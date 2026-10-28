# Paint Shop Inventory — Starter Scaffold

Angular standalone frontend + Express/Mongoose backend for a single paint/hardware shop.

## Included
- Product catalogue and low-stock view
- Product creation and editing from the catalogue
- Supplier creation and selection from the purchases page
- Purchase creation: stores invoice snapshots, increases stock, records stock movements
- Sales creation: checks stock, stores invoice snapshots, decreases stock, records movements
- Manual stock adjustment, stock movement history and simple dashboard summary
- Print-friendly sales invoice view
- API connection status in the application header
- MongoDB transaction-based purchase/sale processing
- Unique invoice numbering and idempotency key support

## Requirements
- Node.js LTS compatible with the Angular version generated on your machine
- MongoDB running as a **replica set** (transactions require this). For local development, a single-node replica set is enough.
- Angular CLI through `npx`

## 1. Start MongoDB
For an existing MongoDB replica set, set `MONGODB_URI` in `backend/.env`.

For a local single-node replica set, configure MongoDB with `replSetName: rs0`, start `mongod`, then run once in `mongosh`:
```js
rs.initiate()
```
Use:
`mongodb://127.0.0.1:27017/paint_shop_inventory?replicaSet=rs0`

If you use MongoDB Atlas, copy its connection string into `MONGODB_URI`.

## 2. Start backend
```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```
Backend: `http://localhost:3000/api/health`

## 3. Create/start Angular frontend
The `frontend/` folder includes the Angular workspace configuration and source files. Run:
```powershell
cd frontend
npm install
npm start
```
The Angular app is expected at `http://localhost:4200`.

> If you already generated an Angular workspace, don't run `ng new` again; copy the provided `src/app` and `src/styles.css` into it.

## API overview
- `GET /api/health`
- `GET/POST /api/products`, `PUT /api/products/:id`
- `GET/POST /api/suppliers`
- `GET/POST /api/purchases`
- `GET /api/purchases/:id`
- `GET/POST /api/sales`
- `GET /api/sales/:id`
- `GET /api/inventory/stock`
- `GET /api/inventory/movements`
- `POST /api/inventory/adjustments`
- `GET /api/reports/dashboard`

## Important before production
This is a starter scaffold, not a finished accounting or GST product. No GST calculations are included. Add authentication, role permissions, robust validation, tested backups/restore, audit controls and proper deployment configuration before using it for real business records. Prices and totals are calculated on the server. Don't manually edit `currentStock`; use purchase, sale or adjustment endpoints. Sales and purchases use MongoDB transactions and therefore require replica-set support.
