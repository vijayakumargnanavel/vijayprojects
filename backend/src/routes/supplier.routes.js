const router = require('express').Router();
const Supplier = require('../models/Supplier');

router.get('/', async (req, res, next) => {
  try {
    res.json(await Supplier.find({ active: true }).sort({ name: 1 }).limit(500));
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    if (!req.body.name?.trim()) return res.status(400).json({ message: 'Supplier name is required' });
    const supplier = await Supplier.create({
      name: req.body.name, phone: req.body.phone || '',
      address: req.body.address || '', notes: req.body.notes || ''
    });
    res.status(201).json(supplier);
  } catch (e) { next(e); }
});

module.exports = router;
