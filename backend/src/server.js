require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const port = process.env.PORT || 3000;

async function start() {
  try {
    await connectDB();
    app.listen(port, () => console.log(`API listening at http://localhost:${port}`));
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
}

start();