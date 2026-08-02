import client from './client';

const qs = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const authApi = {
  login: (d) => client.post('/auth/login', d).then((r) => r.data),
  me: () => client.get('/auth/me').then((r) => r.data),
  changePassword: (d) => client.post('/auth/change-password', d).then((r) => r.data),
  resetPassword: (d) => client.post('/auth/reset-password', d).then((r) => r.data),
};

export const usersApi = {
  list: (p = {}) => client.get(`/users${qs(p)}`).then((r) => r.data),
  roles: () => client.get('/users/roles').then((r) => r.data),
  create: (d) => client.post('/users', d).then((r) => r.data),
  update: (id, d) => client.put(`/users/${id}`, d).then((r) => r.data),
  remove: (id) => client.delete(`/users/${id}`).then((r) => r.data),
  getPermissions: (roleId) => client.get(`/users/${roleId}/permissions`).then((r) => r.data),
  updatePermissions: (roleId, permissions) => client.put(`/users/${roleId}/permissions`, { permissions }).then((r) => r.data),
};

export const branchesApi = {
  list: (p = {}) => client.get(`/branches${qs(p)}`).then((r) => r.data),
  options: () => client.get('/branches/options').then((r) => r.data),
  create: (d) => client.post('/branches', d).then((r) => r.data),
  update: (id, d) => client.put(`/branches/${id}`, d).then((r) => r.data),
  remove: (id) => client.delete(`/branches/${id}`).then((r) => r.data),
};

export const masterApi = {
  list: (key, p = {}) => client.get(`/${key}${qs(p)}`).then((r) => r.data),
  options: (key) => client.get(`/${key}/options`).then((r) => r.data),
  create: (key, d) => client.post(`/${key}`, d).then((r) => r.data),
  update: (key, id, d) => client.put(`/${key}/${id}`, d).then((r) => r.data),
  remove: (key, id) => client.delete(`/${key}/${id}`).then((r) => r.data),
};

export const productsApi = {
  list: (p = {}) => client.get(`/products${qs(p)}`).then((r) => r.data),
  options: (branchId) => client.get(`/products/options${branchId ? `?branch_id=${branchId}` : ''}`).then((r) => r.data),
  get: (id) => client.get(`/products/${id}`).then((r) => r.data),
  create: (d) => client.post('/products', d).then((r) => r.data),
  update: (id, d) => client.put(`/products/${id}`, d).then((r) => r.data),
  remove: (id) => client.delete(`/products/${id}`).then((r) => r.data),
  generateBarcode: (d) => client.post('/products/generate-barcode', d).then((r) => r.data),
  adjustStock: (id, d) => client.post(`/products/${id}/adjust-stock`, d).then((r) => r.data),
};

export const suppliersApi = {
  list: (p = {}) => client.get(`/suppliers${qs(p)}`).then((r) => r.data),
  options: () => client.get('/suppliers/options').then((r) => r.data),
  create: (d) => client.post('/suppliers', d).then((r) => r.data),
  update: (id, d) => client.put(`/suppliers/${id}`, d).then((r) => r.data),
  remove: (id) => client.delete(`/suppliers/${id}`).then((r) => r.data),
  debts: (id, p = {}) => client.get(`/suppliers/${id}/debts${qs(p)}`).then((r) => r.data),
  purchases: (id) => client.get(`/suppliers/${id}/purchases`).then((r) => r.data),
};

export const customersApi = {
  list: (p = {}) => client.get(`/customers${qs(p)}`).then((r) => r.data),
  options: () => client.get('/customers/options').then((r) => r.data),
  create: (d) => client.post('/customers', d).then((r) => r.data),
  update: (id, d) => client.put(`/customers/${id}`, d).then((r) => r.data),
  remove: (id) => client.delete(`/customers/${id}`).then((r) => r.data),
  receivables: (id) => client.get(`/customers/${id}/receivables`).then((r) => r.data),
  sales: (id) => client.get(`/customers/${id}/sales`).then((r) => r.data),
};

export const salesApi = {
  create: (d) => client.post('/sales', d).then((r) => r.data),
  list: (p = {}) => client.get(`/sales${qs(p)}`).then((r) => r.data),
  get: (id) => client.get(`/sales/${id}`).then((r) => r.data),
  void: (id) => client.post(`/sales/${id}/void`).then((r) => r.data),
  hold: (d) => client.post('/sales/hold', d).then((r) => r.data),
  holds: () => client.get('/sales/holds').then((r) => r.data),
  getHold: (id) => client.get(`/sales/holds/${id}`).then((r) => r.data),
  deleteHold: (id) => client.delete(`/sales/holds/${id}`).then((r) => r.data),
  payReceivable: (id, d) => client.post(`/sales/receivables/${id}/pay`, d).then((r) => r.data),
};

export const purchasesApi = {
  create: (d) => client.post('/purchases', d).then((r) => r.data),
  list: (p = {}) => client.get(`/purchases${qs(p)}`).then((r) => r.data),
  get: (id) => client.get(`/purchases/${id}`).then((r) => r.data),
  createReturn: (d) => client.post('/purchases/returns', d).then((r) => r.data),
  listReturns: (p = {}) => client.get(`/purchases/returns${qs(p)}`).then((r) => r.data),
};

export const stockApi = {
  movements: (p = {}) => client.get(`/stock/movements${qs(p)}`).then((r) => r.data),
  card: (p = {}) => client.get(`/stock/card${qs(p)}`).then((r) => r.data),
  low: () => client.get('/stock/low').then((r) => r.data),
  createTransfer: (d) => client.post('/stock/transfers', d).then((r) => r.data),
  transfers: (p = {}) => client.get(`/stock/transfers${qs(p)}`).then((r) => r.data),
  getTransfer: (id) => client.get(`/stock/transfers/${id}`).then((r) => r.data),
  approveTransfer: (id) => client.post(`/stock/transfers/${id}/approve`).then((r) => r.data),
  rejectTransfer: (id) => client.post(`/stock/transfers/${id}/reject`).then((r) => r.data),
  createOpname: (d) => client.post('/stock/opnames', d).then((r) => r.data),
  opnames: (p = {}) => client.get(`/stock/opnames${qs(p)}`).then((r) => r.data),
  getOpname: (id) => client.get(`/stock/opnames/${id}`).then((r) => r.data),
  addOpnameItem: (id, d) => client.post(`/stock/opnames/${id}/items`, d).then((r) => r.data),
  updateOpnameItem: (id, itemId, d) => client.put(`/stock/opnames/${id}/items/${itemId}`, d).then((r) => r.data),
  submitOpname: (id) => client.post(`/stock/opnames/${id}/submit`).then((r) => r.data),
  approveOpname: (id) => client.post(`/stock/opnames/${id}/approve`).then((r) => r.data),
  rejectOpname: (id) => client.post(`/stock/opnames/${id}/reject`).then((r) => r.data),
};

export const cashApi = {
  openShift: (d) => client.post('/cash/shifts/open', d).then((r) => r.data),
  closeShift: (id, d) => client.post(`/cash/shifts/${id}/close`, d).then((r) => r.data),
  shifts: (p = {}) => client.get(`/cash/shifts${qs(p)}`).then((r) => r.data),
  currentShift: () => client.get('/cash/shifts/current').then((r) => r.data),
  createTransaction: (d) => client.post('/cash/transactions', d).then((r) => r.data),
  transactions: (p = {}) => client.get(`/cash/transactions${qs(p)}`).then((r) => r.data),
};

export const promotionsApi = {
  list: (p = {}) => client.get(`/promotions${qs(p)}`).then((r) => r.data),
  get: (id) => client.get(`/promotions/${id}`).then((r) => r.data),
  create: (d) => client.post('/promotions', d).then((r) => r.data),
  update: (id, d) => client.put(`/promotions/${id}`, d).then((r) => r.data),
  remove: (id) => client.delete(`/promotions/${id}`).then((r) => r.data),
};

export const reportsApi = {
  dashboard: () => client.get('/reports/dashboard').then((r) => r.data),
  sales: (p = {}) => client.get(`/reports/sales${qs(p)}`).then((r) => r.data),
  purchases: (p = {}) => client.get(`/reports/purchases${qs(p)}`).then((r) => r.data),
  cash: (p = {}) => client.get(`/reports/cash${qs(p)}`).then((r) => r.data),
  stock: (p = {}) => client.get(`/reports/stock${qs(p)}`).then((r) => r.data),
  debts: (p = {}) => client.get(`/reports/debts${qs(p)}`).then((r) => r.data),
  monthly: (p = {}) => client.get(`/reports/monthly${qs(p)}`).then((r) => r.data),
};

export const barcodeApi = {
  labels: (productIds, withUnits = true) => client.get(`/barcode/labels?product_ids=${productIds.join(',')}&with_units=${withUnits ? 1 : 0}`).then((r) => r.data),
  scan: (code) => client.get(`/barcode/scan/${encodeURIComponent(code)}`).then((r) => r.data),
};
