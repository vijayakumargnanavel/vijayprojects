const router = require('express').Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

router.get('/stock', async (req, res, next) => {
  try {
    const filter = { active: true };
    if (req.query.lowStock === 'true') filter.$expr = { $lte: ['$currentStock', '$reorderLevel'] };
    res.json(await Product.find(filter).sort({ name: 1 }).limit(1000));
  } catch (e) { next(e); }
});

router.get('/movements', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.productId && mongoose.isValidObjectId(req.query.productId)) filter.productId = req.query.productId;
    res.json(await StockMovement.find(filter).populate('productId', 'sku name unit').sort({ createdAt: -1 }).limit(Math.min(Number(req.query.limit) || 100, 500)));
  } catch (e) { next(e); }
});

router.post('/adjustments', async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { productId, quantity, reason } = req.body;
    if (!mongoose.isValidObjectId(productId) || !Number.isFinite(Number(quantity)) || Number(quantity) === 0 || !String(reason || '').trim()) {
      return res.status(400).json({ message: 'Valid product, non-zero quantity and reason are required' });
    }
    let updatedProduct;
    await session.withTransaction(async () => {
      const product = await Product.findById(productId).session(session);
      if (!product || !product.active) {
        const err = new Error('Product not found'); err.status = 404; throw err;
      }
      const before = product.currentStock;
      const after = before + Number(quantity);
      if (after < 0) { const err = new Error('Stock cannot be negative'); err.status = 400; throw err; }
      product.currentStock = after;
      await product.save({ session });
      await StockMovement.create([{
        productId: product._id, type: 'ADJUSTMENT', quantity: Number(quantity),
        before, after, referenceType: 'MANUAL', reason: String(reason).trim()
      }], { session });
      updatedProduct = product;
    });
    res.json(updatedProduct);
  } catch (e) { next(e); }
  finally { await session.endSession(); }
});

module.exports = router;
