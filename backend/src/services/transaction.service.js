const mongoose = require('mongoose');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const Sale = require('../models/Sale');
const StockMovement = require('../models/StockMovement');
const { nextInvoiceNumber } = require('./invoiceNumber.service');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function money(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw httpError(400, 'Add at least one item');
  for (const item of items) {
    if (!mongoose.isValidObjectId(item.productId)) throw httpError(400, 'Invalid product ID');
    if (!Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0) {
      throw httpError(400, 'Quantity must be greater than zero');
    }
  }
}

async function createPurchase(body, idempotencyKey) {
  validateItems(body.items);
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      if (idempotencyKey) {
        const prior = await Purchase.findOne({ idempotencyKey }).session(session);
        if (prior) { result = prior; return; }
      }

      const supplier = body.supplierId
        ? await Supplier.findById(body.supplierId).session(session)
        : null;
      if (body.supplierId && !supplier) throw httpError(400, 'Supplier not found');

      const items = [];
      const movements = [];
      let subtotal = 0;
      for (const raw of body.items) {
        const product = await Product.findById(raw.productId).session(session);
        if (!product || !product.active) throw httpError(400, 'Product not found or inactive');
        const quantity = Number(raw.quantity);
        const unitCost = Number(raw.unitCost);
        if (!Number.isFinite(unitCost) || unitCost < 0) throw httpError(400, 'Invalid purchase cost');
        const lineTotal = money(quantity * unitCost);
        subtotal += lineTotal;

        const before = product.currentStock;
        product.currentStock = before + quantity;
        product.costPrice = unitCost;
        await product.save({ session });

        movements.push({
          productId: product._id, type: 'PURCHASE', quantity,
          before, after: product.currentStock, referenceType: 'PURCHASE',
          reason: 'Purchase received'
        });

        items.push({
          productId: product._id, sku: product.sku, name: product.name,
          unit: product.unit, quantity, unitCost, lineTotal
        });
      }

      subtotal = money(subtotal);
      const discount = Number(body.discount || 0);
      if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) {
        throw httpError(400, 'Discount must be between zero and subtotal');
      }
      const total = money(subtotal - discount);
      const amountPaid = Number(body.amountPaid ?? total);
      if (!Number.isFinite(amountPaid) || amountPaid < 0 || amountPaid > total) {
        throw httpError(400, 'Amount paid must be between zero and total');
      }
      const paymentStatus = amountPaid === total ? 'PAID' : amountPaid === 0 ? 'UNPAID' : 'PARTIAL';
      const invoiceNumber = await nextInvoiceNumber('PUR', session);
      const [purchase] = await Purchase.create([{
        invoiceNumber, supplierId: supplier?._id || null,
        supplierName: supplier?.name || body.supplierName || '',
        supplierInvoiceNumber: body.supplierInvoiceNumber || '',
        date: body.date ? new Date(body.date) : new Date(),
        items, subtotal, discount, total, amountPaid, paymentStatus,
        idempotencyKey: idempotencyKey || undefined
      }], { session });

      await StockMovement.create(movements.map(m => ({ ...m, referenceId: purchase._id })), { session });
      result = purchase;
    });
    return result;
  } finally {
    await session.endSession();
  }
}

async function createSale(body, idempotencyKey) {
  validateItems(body.items);
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      if (idempotencyKey) {
        const prior = await Sale.findOne({ idempotencyKey }).session(session);
        if (prior) { result = prior; return; }
      }

      const items = [];
      const movements = [];
      let subtotal = 0;
      for (const raw of body.items) {
        const product = await Product.findById(raw.productId).session(session);
        if (!product || !product.active) throw httpError(400, 'Product not found or inactive');

        const quantity = Number(raw.quantity);
        const unitPrice = raw.unitPrice === undefined ? product.sellingPrice : Number(raw.unitPrice);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) throw httpError(400, 'Invalid selling price');

        const updated = await Product.updateOne(
          { _id: product._id, currentStock: { $gte: quantity }, active: true },
          { $inc: { currentStock: -quantity } },
          { session }
        );
        if (updated.modifiedCount !== 1) throw httpError(400, `Insufficient stock for ${product.name}`);

        const lineTotal = money(quantity * unitPrice);
        subtotal += lineTotal;
        movements.push({
          productId: product._id, type: 'SALE', quantity: -quantity,
          before: product.currentStock, after: product.currentStock - quantity,
          referenceType: 'SALE', reason: 'Sale completed'
        });

        items.push({
          productId: product._id, sku: product.sku, name: product.name,
          unit: product.unit, quantity, unitPrice,
          unitCost: product.costPrice, lineTotal
        });
      }

      subtotal = money(subtotal);
      const discount = Number(body.discount || 0);
      if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) {
        throw httpError(400, 'Discount must be between zero and subtotal');
      }
      const total = money(subtotal - discount);
      const amountPaid = Number(body.amountPaid ?? total);
      if (!Number.isFinite(amountPaid) || amountPaid < 0 || amountPaid > total) {
        throw httpError(400, 'Amount paid must be between zero and total');
      }

      const invoiceNumber = await nextInvoiceNumber('SAL', session);
      const [sale] = await Sale.create([{
        invoiceNumber, date: body.date ? new Date(body.date) : new Date(),
        customerName: body.customerName || 'Walk-in customer',
        customerPhone: body.customerPhone || '',
        items, subtotal, discount, total,
        paymentMethod: body.paymentMethod || 'CASH',
        amountPaid, idempotencyKey: idempotencyKey || undefined
      }], { session });

      await StockMovement.create(movements.map(m => ({ ...m, referenceId: sale._id })), { session });
      result = sale;
    });
    return result;
  } finally {
    await session.endSession();
  }
}

module.exports = { createPurchase, createSale };
