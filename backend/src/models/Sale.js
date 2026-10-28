const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: String,
  name: { type: String, required: true },
  unit: String,
  quantity: { type: Number, required: true, min: 0.001 },
  unitPrice: { type: Number, required: true, min: 0 },
  unitCost: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  customerName: { type: String, default: 'Walk-in customer' },
  customerPhone: { type: String, default: '' },
  items: { type: [saleItemSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['CASH', 'UPI', 'CARD', 'CREDIT', 'OTHER'], default: 'CASH' },
  amountPaid: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['COMPLETED', 'CANCELLED'], default: 'COMPLETED' },
  idempotencyKey: { type: String, unique: true, sparse: true }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
