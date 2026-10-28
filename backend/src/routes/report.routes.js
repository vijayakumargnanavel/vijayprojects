const router = require('express').Router();
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');

router.get('/dashboard', async (req, res, next) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const [productCount, lowStockCount, sales, purchases, products] = await Promise.all([
      Product.countDocuments({ active: true }),
      Product.countDocuments({ active: true, $expr: { $lte: ['$currentStock', '$reorderLevel'] } }),
      Sale.find({ status: 'COMPLETED', createdAt: { $gte: start } }).select('total items'),
      Purchase.find({ createdAt: { $gte: start } }).select('total'),
      Product.find({ active: true }).select('currentStock costPrice')
    ]);
    const stockValue = products.reduce((sum, p) => sum + p.currentStock * p.costPrice, 0);
    const salesTotal = sales.reduce((sum, s) => sum + s.total, 0);
    const purchaseTotal = purchases.reduce((sum, p) => sum + p.total, 0);
    const grossProfitEstimate = sales.reduce((sum, sale) =>
      sum + sale.items.reduce((itemSum, item) => itemSum + (item.unitPrice - item.unitCost) * item.quantity, 0), 0);
    res.json({ productCount, lowStockCount, salesTotal, purchaseTotal, stockValue, grossProfitEstimate });
  } catch (e) { next(e); }
});

module.exports = router;
