const router = require('express').Router();
const { auth, requirePerm } = require('../middleware/auth');
const authCtrl = require('../controllers/auth.controller');
const usersCtrl = require('../controllers/users.controller');
const branchesCtrl = require('../controllers/branches.controller');
const productsCtrl = require('../controllers/products.controller');
const suppliersCtrl = require('../controllers/suppliers.controller');
const customersCtrl = require('../controllers/customers.controller');
const salesCtrl = require('../controllers/sales.controller');
const purchasesCtrl = require('../controllers/purchases.controller');
const stockCtrl = require('../controllers/stock.controller');
const batchesCtrl = require('../controllers/batches.controller');
const exportsCtrl = require('../controllers/exports.controller');
const cashCtrl = require('../controllers/cash.controller');
const promotionsCtrl = require('../controllers/promotions.controller');
const reportsCtrl = require('../controllers/reports.controller');
const barcodeCtrl = require('../controllers/barcode.controller');
const { createMasterController } = require('../controllers/master.controller');
const upload = require('../middleware/upload');

/* ============ AUTH ============ */
router.post('/auth/login', authCtrl.login);
router.post('/auth/refresh', authCtrl.refresh);
router.get('/auth/me', auth, authCtrl.me);
router.post('/auth/change-password', auth, authCtrl.changePassword);
router.post('/auth/reset-password', auth, requirePerm('users', 'edit'), authCtrl.resetPassword);

/* ============ USERS ============ */
router.get('/users', auth, requirePerm('users', 'view'), usersCtrl.list);
router.get('/users/roles', auth, usersCtrl.roles);
router.get('/users/:id/permissions', auth, requirePerm('users', 'view'), usersCtrl.getPermissions);
router.put('/users/:id/permissions', auth, requirePerm('users', 'edit'), usersCtrl.updatePermissions);
router.post('/users', auth, requirePerm('users', 'create'), usersCtrl.create);
router.put('/users/:id', auth, requirePerm('users', 'edit'), usersCtrl.update);
router.delete('/users/:id', auth, requirePerm('users', 'delete'), usersCtrl.remove);

/* ============ CABANG ============ */
router.get('/branches', auth, requirePerm('branches', 'view'), branchesCtrl.list);
router.get('/branches/options', auth, branchesCtrl.options);
router.get('/branches/:id', auth, requirePerm('branches', 'view'), branchesCtrl.get);
router.post('/branches', auth, requirePerm('branches', 'create'), branchesCtrl.create);
router.put('/branches/:id', auth, requirePerm('branches', 'edit'), branchesCtrl.update);
router.delete('/branches/:id', auth, requirePerm('branches', 'delete'), branchesCtrl.remove);

/* ============ MASTER: KATEGORI / MERK / SATUAN ============ */
const categories = createMasterController({ table: 'categories', label: 'Kategori', fields: ['name', 'is_active'] });
const brands = createMasterController({ table: 'brands', label: 'Merk', fields: ['name', 'is_active'] });
const units = createMasterController({ table: 'units', label: 'Satuan', fields: ['name', 'short_name', 'is_active'] });

router.get('/categories', auth, requirePerm('categories', 'view'), categories.list);
router.get('/categories/options', auth, categories.options);
router.post('/categories', auth, requirePerm('categories', 'create'), categories.create);
router.put('/categories/:id', auth, requirePerm('categories', 'edit'), categories.update);
router.delete('/categories/:id', auth, requirePerm('categories', 'delete'), categories.remove);

router.get('/brands', auth, requirePerm('brands', 'view'), brands.list);
router.get('/brands/options', auth, brands.options);
router.post('/brands', auth, requirePerm('brands', 'create'), brands.create);
router.put('/brands/:id', auth, requirePerm('brands', 'edit'), brands.update);
router.delete('/brands/:id', auth, requirePerm('brands', 'delete'), brands.remove);

router.get('/units', auth, requirePerm('units', 'view'), units.list);
router.get('/units/options', auth, units.options);
router.post('/units', auth, requirePerm('units', 'create'), units.create);
router.put('/units/:id', auth, requirePerm('units', 'edit'), units.update);
router.delete('/units/:id', auth, requirePerm('units', 'delete'), units.remove);

/* ============ PRODUK ============ */
router.get('/products', auth, requirePerm('products', 'view'), productsCtrl.list);
router.get('/products/options', auth, productsCtrl.options);
router.get('/products/:id', auth, requirePerm('products', 'view'), productsCtrl.get);
router.post('/products', auth, requirePerm('products', 'create'), upload.single('photo'), productsCtrl.create);
router.put('/products/:id', auth, requirePerm('products', 'edit'), upload.single('photo'), productsCtrl.update);
router.delete('/products/:id', auth, requirePerm('products', 'delete'), productsCtrl.remove);
router.post('/products/generate-barcode', auth, requirePerm('products', 'edit'), productsCtrl.generateBarcode);
router.post('/products/:id/adjust-stock', auth, requirePerm('stock', 'edit'), productsCtrl.adjustStock);

/* ============ SUPPLIER ============ */
router.get('/suppliers', auth, requirePerm('suppliers', 'view'), suppliersCtrl.list);
router.get('/suppliers/options', auth, suppliersCtrl.options);
router.get('/suppliers/:id', auth, requirePerm('suppliers', 'view'), suppliersCtrl.get);
router.get('/suppliers/:id/debts', auth, requirePerm('suppliers', 'view'), suppliersCtrl.debts);
router.get('/suppliers/:id/purchases', auth, requirePerm('suppliers', 'view'), suppliersCtrl.purchases);
router.post('/suppliers', auth, requirePerm('suppliers', 'create'), suppliersCtrl.create);
router.put('/suppliers/:id', auth, requirePerm('suppliers', 'edit'), suppliersCtrl.update);
router.delete('/suppliers/:id', auth, requirePerm('suppliers', 'delete'), suppliersCtrl.remove);

/* ============ CUSTOMER ============ */
router.get('/customers', auth, requirePerm('customers', 'view'), customersCtrl.list);
router.get('/customers/options', auth, customersCtrl.options);
router.get('/customers/:id', auth, requirePerm('customers', 'view'), customersCtrl.get);
router.get('/customers/:id/receivables', auth, requirePerm('customers', 'view'), customersCtrl.receivables);
router.get('/customers/:id/sales', auth, requirePerm('customers', 'view'), customersCtrl.sales);
router.post('/customers', auth, requirePerm('customers', 'create'), customersCtrl.create);
router.put('/customers/:id', auth, requirePerm('customers', 'edit'), customersCtrl.update);
router.delete('/customers/:id', auth, requirePerm('customers', 'delete'), customersCtrl.remove);

/* ============ PENJUALAN (POS) ============ */
router.post('/sales', auth, requirePerm('sales', 'create'), salesCtrl.create);
router.get('/sales', auth, requirePerm('sales', 'view'), salesCtrl.list);
router.get('/sales/holds', auth, requirePerm('sales', 'view'), salesCtrl.holds);
router.get('/sales/holds/:id', auth, requirePerm('sales', 'view'), salesCtrl.getHold);
router.delete('/sales/holds/:id', auth, requirePerm('sales', 'edit'), salesCtrl.deleteHold);
router.post('/sales/hold', auth, requirePerm('sales', 'create'), salesCtrl.hold);
router.get('/sales/receivables/:id/pay', auth, requirePerm('sales', 'edit'), (req, res) => res.status(405).json({ success: false, message: 'Gunakan POST' }));
router.post('/sales/receivables/:id/pay', auth, requirePerm('sales', 'edit'), salesCtrl.payReceivable);
router.get('/sales/:id', auth, requirePerm('sales', 'view'), salesCtrl.get);
router.post('/sales/:id/void', auth, requirePerm('sales', 'edit'), salesCtrl.void);

/* ============ PEMBELIAN & RETUR ============ */
router.post('/purchases', auth, requirePerm('purchases', 'create'), purchasesCtrl.create);
router.get('/purchases', auth, requirePerm('purchases', 'view'), purchasesCtrl.list);
router.get('/purchases/returns', auth, requirePerm('returns', 'view'), purchasesCtrl.listReturns);
router.post('/purchases/returns', auth, requirePerm('returns', 'create'), purchasesCtrl.createReturn);
router.get('/purchases/:id', auth, requirePerm('purchases', 'view'), purchasesCtrl.get);
router.get('/purchases/:id/returns', auth, requirePerm('returns', 'view'), purchasesCtrl.getReturns);

/* ============ STOK ============ */
router.get('/stock/movements', auth, requirePerm('stock', 'view'), stockCtrl.movements);
router.get('/stock/card', auth, requirePerm('stock', 'view'), stockCtrl.card);
router.get('/stock/low', auth, requirePerm('stock', 'view'), stockCtrl.lowStock);
router.post('/stock/transfers', auth, requirePerm('transfers', 'create'), stockCtrl.createTransfer);
router.get('/stock/transfers', auth, requirePerm('transfers', 'view'), stockCtrl.listTransfers);
router.get('/stock/transfers/:id', auth, requirePerm('transfers', 'view'), stockCtrl.getTransfer);
router.post('/stock/transfers/:id/approve', auth, requirePerm('transfers', 'edit'), stockCtrl.approveTransfer);
router.post('/stock/transfers/:id/reject', auth, requirePerm('transfers', 'edit'), stockCtrl.rejectTransfer);
router.post('/stock/opnames', auth, requirePerm('opname', 'create'), stockCtrl.createOpname);
router.get('/stock/opnames', auth, requirePerm('opname', 'view'), stockCtrl.listOpnames);
router.get('/stock/opnames/:id', auth, requirePerm('opname', 'view'), stockCtrl.getOpname);
router.post('/stock/opnames/:id/items', auth, requirePerm('opname', 'edit'), stockCtrl.addOpnameItem);
router.put('/stock/opnames/:id/items/:itemId', auth, requirePerm('opname', 'edit'), stockCtrl.updateOpnameItem);
router.post('/stock/opnames/:id/submit', auth, requirePerm('opname', 'edit'), stockCtrl.submitOpname);
router.post('/stock/opnames/:id/approve', auth, requirePerm('opname', 'edit'), stockCtrl.approveOpname);
router.post('/stock/opnames/:id/reject', auth, requirePerm('opname', 'edit'), stockCtrl.rejectOpname);

/* ============ BATCH / EXPIRY ============ */
router.get('/batches', auth, requirePerm('stock', 'view'), batchesCtrl.list);
router.get('/batches/summary', auth, requirePerm('stock', 'view'), batchesCtrl.summary);
router.post('/batches', auth, requirePerm('stock', 'edit'), batchesCtrl.create);
router.put('/batches/:id', auth, requirePerm('stock', 'edit'), batchesCtrl.update);

/* ============ KAS & SHIFT ============ */
router.post('/cash/shifts/open', auth, requirePerm('shifts', 'create'), cashCtrl.openShift);
router.post('/cash/shifts/:id/close', auth, requirePerm('shifts', 'edit'), cashCtrl.closeShift);
router.get('/cash/shifts', auth, requirePerm('shifts', 'view'), cashCtrl.listShifts);
router.get('/cash/shifts/current', auth, cashCtrl.currentShift);
router.post('/cash/transactions', auth, requirePerm('cash', 'create'), cashCtrl.createTransaction);
router.get('/cash/transactions', auth, requirePerm('cash', 'view'), cashCtrl.listTransactions);

/* ============ PROMO ============ */
router.get('/promotions', auth, requirePerm('promotions', 'view'), promotionsCtrl.list);
router.get('/promotions/:id', auth, requirePerm('promotions', 'view'), promotionsCtrl.get);
router.post('/promotions', auth, requirePerm('promotions', 'create'), promotionsCtrl.create);
router.put('/promotions/:id', auth, requirePerm('promotions', 'edit'), promotionsCtrl.update);
router.delete('/promotions/:id', auth, requirePerm('promotions', 'delete'), promotionsCtrl.remove);

/* ============ LAPORAN ============ */
router.get('/reports/dashboard', auth, reportsCtrl.dashboard);
router.get('/reports/sales', auth, requirePerm('reports', 'view'), reportsCtrl.sales);
router.get('/reports/purchases', auth, requirePerm('reports', 'view'), reportsCtrl.purchases);
router.get('/reports/cash', auth, requirePerm('reports', 'view'), reportsCtrl.cash);
router.get('/reports/stock', auth, requirePerm('reports', 'view'), reportsCtrl.stock);
router.get('/reports/debts', auth, requirePerm('reports', 'view'), reportsCtrl.debts);
router.get('/reports/monthly', auth, requirePerm('reports', 'view'), reportsCtrl.monthly);

/* ============ EXPORT (Excel / PDF) ============ */
router.get('/export/report', auth, requirePerm('reports', 'view'), exportsCtrl.report);
router.get('/export/invoice/:saleId', auth, requirePerm('sales', 'view'), exportsCtrl.invoice);

/* ============ BARCODE ============ */
router.get('/barcode/labels', auth, requirePerm('barcode', 'view'), barcodeCtrl.labels);
router.get('/barcode/scan/:code', auth, barcodeCtrl.scan);

module.exports = router;
