const router = require('express').Router();
const Sale = require('../models/Sale');
const { createSale } = require('../services/transaction.service');

router.post('/', async (req, res, next) => {
  try {
    const sale = await createSale(req.body, req.get('Idempotency-Key'));
    res.status(201).json(sale);
  } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    res.json(await Sale.find().sort({ createdAt: -1 }).limit(limit));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    res.json(sale);
  } catch (e) { next(e); }
});

module.exports = router;
