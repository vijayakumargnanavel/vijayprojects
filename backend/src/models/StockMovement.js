const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT'], required: true },
  quantity: { type: Number, required: true }, // signed: positive in, negative out
  before: { type: Number, required: true },
  after: { type: Number, required: true },
  referenceType: { type: String, enum: ['PURCHASE', 'SALE', 'MANUAL'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  reason: { type: String, default: '' }
}, { timestamps: true });

stockMovementSchema.index({ productId: 1, createdAt: -1 });
module.exports = mongoose.model('StockMovement', stockMovementSchema);
