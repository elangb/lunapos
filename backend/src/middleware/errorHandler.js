/* Error handler global */
const { fail } = require('../utils/helpers');

function notFound(req, res) {
  return fail(res, 404, `Route ${req.originalUrl} tidak ditemukan`);
}

function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err);

  if (err.code === 'INSUFFICIENT_STOCK') return fail(res, 400, err.message);

  if (err.code === 'ER_DUP_ENTRY') {
    return fail(res, 400, 'Data sudah ada / duplikat (cek kode, barcode, atau nama unik)');
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    return fail(res, 400, 'Data sedang dipakai di transaksi lain');
  }
  if (err.name === 'MulterError') {
    return fail(res, 400, `Upload gagal: ${err.message}`);
  }
  if (err.type === 'entity.parse.failed') return fail(res, 400, 'Format JSON tidak valid');

  if (err instanceof SyntaxError) return fail(res, 400, err.message);

  return fail(res, err.status || 500, err.message || 'Internal server error');
}

module.exports = { notFound, errorHandler };
