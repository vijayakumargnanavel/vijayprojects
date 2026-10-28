const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  brand: { type: String, trim: true, default: '' },
  variant: { type: String, trim: true, default: '' },
  unit: {
    type: String, required: true,
    enum: ['piece', 'can', 'bucket', 'box', 'litre', 'ml', 'kg', 'gram', 'metre', 'foot']
  },
  costPrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  currentStock: { type: Number, default: 0, min: 0 },
  reorderLevel: { type: Number, default: 5, min: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.index({ name: 'text', sku: 'text', brand: 'text' });
module.exports = mongoose.model('Product', productSchema);
