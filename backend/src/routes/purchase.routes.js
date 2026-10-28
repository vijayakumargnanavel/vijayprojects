const router = require('express').Router();
const Purchase = require('../models/Purchase');
const { createPurchase } = require('../services/transaction.service');

router.post('/', async (req, res, next) => {
  try {
    const purchase = await createPurchase(req.body, req.get('Idempotency-Key'));
    res.status(201).json(purchase);
  } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    res.json(await Purchase.find().sort({ createdAt: -1 }).limit(limit));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
    res.json(purchase);
  } catch (e) { next(e); }
});

module.exports = router;
