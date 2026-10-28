const router = require('express').Router();
const Product = require('../models/Product');

router.get('/', async (req, res, next) => {
  try {
    const filter = { active: true };
    if (req.query.search) {
      const term = String(req.query.search).slice(0, 100);
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { sku: { $regex: term, $options: 'i' } },
        { brand: { $regex: term, $options: 'i' } }
      ];
    }
    if (req.query.lowStock === 'true') {
      filter.$expr = { $lte: ['$currentStock', '$reorderLevel'] };
    }
    res.json(await Product.find(filter).sort({ name: 1 }).limit(500));
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  console.log("req==========",req.body);
  try {
    const { sku, name, category, brand, variant, unit, costPrice, sellingPrice, reorderLevel } = req.body;
    if (!sku || !name || !category || !unit) return res.status(400).json({ message: 'SKU, name, category and unit are required' });
    const product = await Product.create({
      sku, name, category, brand, variant, unit,
      costPrice: Number(costPrice), sellingPrice: Number(sellingPrice),
      reorderLevel: Number(reorderLevel ?? 5), currentStock: 0
    });
    res.status(201).json(product);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'SKU already exists' });
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'category', 'brand', 'variant', 'unit', 'costPrice', 'sellingPrice', 'reorderLevel', 'active'];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (e) { next(e); }
});

module.exports = router;
