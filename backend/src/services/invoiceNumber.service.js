const Counter = require('../models/Counter');

async function nextInvoiceNumber(prefix, session) {
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;
  const counter = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );
  return `${prefix}-${year}-${String(counter.seq).padStart(6, '0')}`;
}

module.exports = { nextInvoiceNumber };
