const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: String,
  name: { type: String, required: true },
  unit: String,
  quantity: { type: Number, required: true, min: 0.001 },
  unitCost: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
  supplierName: { type: String, default: '' },
  supplierInvoiceNumber: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  items: { type: [purchaseItemSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentStatus: { type: String, enum: ['PAID', 'PARTIAL', 'UNPAID'], default: 'PAID' },
  amountPaid: { type: Number, default: 0, min: 0 },
  idempotencyKey: { type: String, unique: true, sparse: true }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
