const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const num = (v) => parseFloat(v) || 0;
const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const dateStr = (d) => (d ? new Date(d).toLocaleDateString('id-ID') : '-');
const dateTimeStr = (d) => (d ? new Date(d).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-');

/* ============ EXCEL ============ */

/**
 * @param {Array<{header:string,key:string,width?:number,type?:'number'|'string'|'date'}>} columns
 * @param {Array<object>} rows
 * @returns {Promise<Buffer>}
 */
async function buildXlsx({ title, sheetName = 'Data', columns, rows }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'LunaPOS';
  const ws = wb.addWorksheet(sheetName);
  if (title) {
    ws.mergeCells(1, 1, 1, Math.max(columns.length, 1));
    ws.getCell(1, 1).value = title;
    ws.getCell(1, 1).font = { bold: true, size: 14 };
    ws.getCell(1, 1).alignment = { horizontal: 'center' };
    ws.getRow(1).height = 24;
  }
  const headerRow = ws.addRow(columns.map((c) => c.header));
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });
  headerRow.height = 20;

  for (const r of rows) {
    const values = columns.map((c) => {
      let v = r[c.key];
      if (c.type === 'number') v = num(v);
      return v === null || v === undefined ? '' : v;
    });
    const row = ws.addRow(values);
    row.eachCell((cell, colIdx) => {
      const c = columns[colIdx - 1];
      if (c?.type === 'number') cell.numFmt = '#,##0.00';
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
  }

  columns.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.width || Math.max(12, String(c.header).length + 4);
  });
  return wb.xlsx.writeBuffer();
}

/* ============ PDF ============ */

function setupPdf(doc) {
  const brand = '#4F46E5';
  doc.registerFont('Helvetica');
  // Header
  doc.rect(0, 0, doc.page.width, 70).fill(brand);
  doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text('LunaPOS', 40, 20);
  doc.fontSize(9).font('Helvetica').text('Laporan Sistem Kasir & Inventori Multi-Cabang', 40, 44);
  doc.text(new Date().toLocaleString('id-ID'), doc.page.width - 200, 20, { width: 160, align: 'right' });
  doc.moveDown(4);
  return doc;
}

function drawTable(doc, columns, rows, opts = {}) {
  const { startY = 90, fontSize = 7.5 } = opts;
  const pageWidth = doc.page.width - 80;
  const colWidth = pageWidth / columns.length;
  let y = startY;

  const drawRow = (cells, isHeader) => {
    const h = Math.max(18, fontSize + 8);
    if (y + h > doc.page.height - 60) {
      doc.addPage();
      y = 60;
      drawRow(columns.map((c) => c.header), true);
    }
    cells.forEach((cell, i) => {
      const x = 40 + i * colWidth;
      doc.rect(x, y, colWidth, h).fill(isHeader ? '#EEF2FF' : i % 2 ? '#FFFFFF' : '#F9FAFB');
      doc.strokeColor('#E5E7EB').lineWidth(0.5).stroke();
      doc.fillColor(isHeader ? '#1E1B4B' : '#111827');
      doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(fontSize);
      doc.text(String(cell === null || cell === undefined ? '' : cell), x + 4, y + 4, {
        width: colWidth - 8,
        ellipsis: true,
        height: h - 6,
      });
    });
    y += h;
  };

  drawRow(columns.map((c) => c.header), true);
  for (const r of rows) {
    drawRow(columns.map((c) => {
      const v = r[c.key];
      return c.type === 'number' ? rupiah(num(v)) : v;
    }), false);
  }
  return y;
}

async function buildPdf({ title, columns, rows, summary = [] }) {
  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  setupPdf(doc);
  doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text(title, 40, 90);
  doc.moveDown(0.5);
  const endY = drawTable(doc, columns, rows, { startY: 115 });

  // Summary / footer
  if (summary.length) {
    let y = Math.max(endY + 10, doc.page.height - 120);
    if (y + summary.length * 16 > doc.page.height - 40) { doc.addPage(); y = 60; }
    doc.fontSize(9).fillColor('#374151');
    summary.forEach((s) => {
      doc.font('Helvetica-Bold').text(s.label, 40, y, { continued: true });
      doc.font('Helvetica').text(`: ${s.value}`, 200, y);
      y += 16;
    });
  }

  doc.end();
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

module.exports = { buildXlsx, buildPdf, rupiah, num };
