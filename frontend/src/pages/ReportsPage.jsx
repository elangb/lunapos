import { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Field from '../components/Field';
import { reportsApi, exportApi } from '../api';
import { errMsg } from '../api/client';
import toast from '../utils/toast';
import { rupiah, fmtQty, fmtDate, today, periodPresets, downloadCSV, downloadBlob } from '../utils/format';

const COLORS = ['#2563eb', '#7c3aed', '#10b981', '#F59E0B', '#EF4444', '#06b6d4'];

const TABS = [
  { key: 'sales', label: 'Penjualan' },
  { key: 'purchases', label: 'Pembelian' },
  { key: 'cash', label: 'Kas' },
  { key: 'stock', label: 'Stok' },
  { key: 'debts', label: 'Hutang & Piutang' },
  { key: 'monthly', label: 'Bulanan / Tahunan' },
];

export default function ReportsPage() {
  const [tab, setTab] = useState('sales');
  const [period, setPeriod] = useState('today');
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [breakdown, setBreakdown] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const params = useMemo(() => {
    const p = { period };
    if (period === 'custom') { p.from = from; p.to = to; }
    return p;
  }, [period, from, to]);

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      try {
        if (tab === 'sales') {
          const res = await reportsApi.sales({ ...params, breakdown });
          setData(res.data);
        } else if (tab === 'purchases') {
          const res = await reportsApi.purchases({ ...params, breakdown });
          setData(res.data);
        } else if (tab === 'cash') {
          const res = await reportsApi.cash(params);
          setData(res.data);
        } else if (tab === 'stock') {
          const res = await reportsApi.stock({ view: 'current' });
          setData({ rows: res.data, view: 'current' });
        } else if (tab === 'debts') {
          const res = await reportsApi.debts({ ...params, view: 'hutang' });
          setData(res.data);
        } else {
          const res = await reportsApi.monthly({ year });
          setData({ rows: res.data });
        }
      } catch (e) {
        console.error(errMsg(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab, params, breakdown, year]);

  const applyPreset = (key) => {
    setPeriod(key);
    const now = new Date();
    if (key === 'custom') { setFrom(today()); setTo(today()); return; }
    if (key === 'yesterday') { const d = new Date(now); d.setDate(d.getDate() - 1); setFrom(d.toISOString().slice(0, 10)); setTo(d.toISOString().slice(0, 10)); }
    if (key === 'this_week') { const day = (now.getDay() + 6) % 7; const s = new Date(now); s.setDate(now.getDate() - day); setFrom(s.toISOString().slice(0, 10)); setTo(today()); }
    if (key === 'this_month') { setFrom(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)); setTo(today()); }
    if (key === 'this_year') { setFrom(`${now.getFullYear()}-01-01`); setTo(today()); }
    if (key === 'today') { setFrom(today()); setTo(today()); }
  };

  const exportCSV = () => {
    if (!data) return;
    const rows = data.rows || [];
    if (tab === 'sales' || tab === 'purchases') {
      downloadCSV(`laporan-${tab}-${period}.csv`, ['Kategori', 'Nilai', 'Jumlah'], rows.map((r) => [r.name || r.date || r.full_name || r.customer_type || r.payment_method || r.cashier_name, r.total ?? r.omzet ?? '', r.qty ?? r.transaksi ?? '']));
    } else if (tab === 'debts') {
      downloadCSV('laporan-hutang-piutang.csv', ['Pihak', 'Referensi', 'Sisa', 'Jatuh Tempo', 'Umur (hari)'], rows.map((r) => [r.supplier_name || r.customer_name, r.purchase_no || r.invoice_no, r.amount - r.paid_amount, r.due_date, r.umur_hari]));
    } else if (tab === 'monthly') {
      downloadCSV(`laporan-tahunan-${year}.csv`, ['Bulan', 'Transaksi', 'Omzet', 'Laba', 'Rata-rata'], rows.map((r) => [r.month, r.transaksi, r.omzet, r.laba, r.rata_rata]));
    } else if (tab === 'stock') {
      downloadCSV('laporan-stok.csv', ['Kode', 'Produk', 'Kategori', 'Stok', 'Harga Beli', 'Harga Jual', 'Cabang'], rows.map((r) => [r.code, r.name, r.category_name, r.stock_qty, r.buy_price, r.retail_price, r.branch_name]));
    }
  };

  const exportFile = async (format) => {
    try {
      if (tab === 'stock') {
        const blob = await exportApi.report({ type: 'stock', format, view: data?.view || 'current' });
        downloadBlob(blob, `laporan-stok-${today()}.${format}`);
      } else if (tab === 'debts') {
        const blob = await exportApi.report({ type: 'debts', format, view: 'hutang' });
        downloadBlob(blob, `laporan-hutang-${today()}.${format}`);
      } else if (tab === 'monthly') {
        toast.info('Export bulanan gunakan tab Laporan Penjualan');
      } else {
        const blob = await exportApi.report({ type: tab, format, ...params, breakdown });
        downloadBlob(blob, `laporan-${tab}-${from}-${to}.${format}`);
      }
    } catch (e) {
      console.error(e);
      toast.error(errMsg(e));
    }
  };

  const renderChart = (rows, key = 'total') => (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`} />
        <Tooltip formatter={(v) => rupiah(v)} />
        <Bar dataKey={key} fill="#2563eb" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div>
      <PageHeader title="Laporan" subtitle="Filter: hari ini, kemarin, minggu, bulan, tahun, custom — per cabang otomatis sesuai peran"
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={exportCSV} disabled={!data}><Download size={16} /> Export CSV</button>
            <button className="btn-secondary" onClick={() => exportFile('xlsx')} disabled={!data}><FileSpreadsheet size={16} /> Excel</button>
            <button className="btn-secondary" onClick={() => exportFile('pdf')} disabled={!data}><FileText size={16} /> PDF</button>
          </div>
        } />

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1 p-1 bg-ink-100 dark:bg-ink-800 rounded-xl w-fit flex-wrap">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold ${tab === t.key ? 'bg-white dark:bg-ink-700 shadow-soft' : 'text-ink-400'}`}>{t.label}</button>
          ))}
        </div>
      </div>

      {tab !== 'stock' && (
        <div className="flex flex-wrap gap-2 mb-4 items-end">
          {tab !== 'monthly' ? (
            <>
              {periodPresets.map((p) => (
                <button key={p.key} onClick={() => applyPreset(p.key)} className={`btn-secondary !px-3 !py-1.5 text-xs ${period === p.key ? '!bg-primary-600 !text-white' : ''}`}>{p.label}</button>
              ))}
              {period === 'custom' && (
                <>
                  <Field label="Dari" className="!mb-0"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input !w-40" /></Field>
                  <Field label="Sampai" className="!mb-0"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input !w-40" /></Field>
                </>
              )}
              {(tab === 'sales' || tab === 'purchases') && (
                <Field label="Rincian" className="!mb-0">
                  <select value={breakdown} onChange={(e) => setBreakdown(e.target.value)} className="input !w-48">
                    <option value="">Per Hari</option>
                    <option value="cashier">Per Kasir</option>
                    <option value="branch">Per Cabang</option>
                    <option value="product">Per Barang</option>
                    <option value="category">Per Kategori</option>
                    <option value="customer">Per Customer</option>
                    {tab === 'sales' && <option value="type">Retail vs Grosir</option>}
                    {tab === 'sales' && <option value="method">Cash vs Transfer vs QRIS vs Hutang</option>}
                    <option value="supplier">Per Supplier</option>
                  </select>
                </Field>
              )}
            </>
          ) : (
            <Field label="Tahun" className="!mb-0">
              <select value={year} onChange={(e) => setYear(+e.target.value)} className="input !w-32">
                {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
          )}
        </div>
      )}

      {loading ? (
        <div className="card p-10 text-center text-sm text-ink-400 animate-pulse">Memuat laporan...</div>
      ) : tab === 'sales' || tab === 'purchases' ? (
        <div className="space-y-4">
          {data?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {tab === 'sales' ? (
                <>
                  <SummaryCard label="Omzet" value={rupiah(data.summary.omzet)} />
                  <SummaryCard label="Laba Kotor" value={rupiah(data.summary.laba)} color="text-success" />
                  <SummaryCard label="Transaksi" value={data.summary.transaksi} />
                  <SummaryCard label="Rata-rata Belanja" value={rupiah(data.summary.rata_rata)} />
                  <SummaryCard label="Piutang Baru" value={rupiah(data.summary.piutang)} color="text-amber-600" />
                </>
              ) : (
                <>
                  <SummaryCard label="Total Pembelian" value={rupiah(data.summary.total)} />
                  <SummaryCard label="Transaksi" value={data.summary.transaksi} />
                </>
              )}
            </div>
          )}
          <div className="card p-5">
            {renderChart(data?.rows || [])}
          </div>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-ink-50 dark:bg-ink-900/60"><th className="th">Kategori</th><th className="th text-right">Qty</th><th className="th text-right">Jumlah</th><th className="th text-right">%</th></tr></thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
                {data?.rows?.map((r, i) => {
                  const total = data.summary?.omzet || data.summary?.total || 0;
                  const val = +(r.total ?? r.omzet ?? 0);
                  return (
                    <tr key={i}>
                      <td className="td font-semibold">{r.name || r.date || r.full_name || r.customer_type || r.payment_method || r.cashier_name || r.supplier_name}</td>
                      <td className="td text-right">{r.qty ? `${fmtQty(r.qty)}` : r.transaksi ? `${r.transaksi} trx` : '-'}</td>
                      <td className="td text-right font-bold">{rupiah(val)}</td>
                      <td className="td text-right text-ink-400">{total ? ((val / total) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  );
                })}
                {!data?.rows?.length && <tr><td colSpan={4} className="td text-center text-ink-400 py-8">Tidak ada data pada periode ini</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'cash' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Saldo Periode" value={rupiah(data?.saldo)} color={+data?.saldo >= 0 ? 'text-success' : 'text-danger'} />
          </div>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-ink-50 dark:bg-ink-900/60"><th className="th">Tipe</th><th className="th text-right">Jumlah Transaksi</th><th className="th text-right">Total</th></tr></thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
                {data?.rows?.map((r, i) => (
                  <tr key={i}>
                    <td className="td font-semibold capitalize">{r.type.replace('_', ' ')}</td>
                    <td className="td text-right">{r.jumlah}</td>
                    <td className="td text-right font-bold">{rupiah(r.total)}</td>
                  </tr>
                ))}
                {!data?.rows?.length && <tr><td colSpan={3} className="td text-center text-ink-400 py-8">Tidak ada data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'stock' ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-ink-50 dark:bg-ink-900/60"><th className="th">Barang</th><th className="th">Cabang</th><th className="th text-right">Stok</th><th className="th text-right">Minimum</th><th className="th text-right">Nilai Stok</th></tr></thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
              {data?.rows?.map((r, i) => (
                <tr key={i}>
                  <td className="td"><div className="font-semibold">{r.name}</div><div className="font-mono text-xs text-ink-400">{r.code}</div></td>
                  <td className="td">{r.branch_name}</td>
                  <td className="td text-right"><span className={`badge font-bold ${+r.stock_qty <= +r.min_stock ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{fmtQty(r.stock_qty)} {r.unit}</span></td>
                  <td className="td text-right">{fmtQty(r.min_stock)}</td>
                  <td className="td text-right font-bold">{rupiah(+r.stock_qty * +r.buy_price)}</td>
                </tr>
              ))}
              {!data?.rows?.length && <tr><td colSpan={5} className="td text-center text-ink-400 py-8">Tidak ada data</td></tr>}
            </tbody>
          </table>
        </div>
      ) : tab === 'debts' ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button className={`btn-secondary !px-4 ${'!bg-primary-600 !text-white'}`}>Hutang Supplier</button>
            <button className="btn-secondary !px-4" onClick={async () => {
              const res = await reportsApi.debts({ ...params, view: 'piutang' });
              setData(res.data);
            }}>Piutang Customer</button>
          </div>
          {data?.aging && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[['≤ 30 hari', data.aging.a_30], ['31-60 hari', data.aging.a_60], ['61-90 hari', data.aging.a_90], ['> 90 hari', data.aging.a_90plus]].map(([l, v]) => (
                <SummaryCard key={l} label={l} value={rupiah(v)} color="text-amber-600" />
              ))}
            </div>
          )}
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-ink-50 dark:bg-ink-900/60"><th className="th">Pihak</th><th className="th">Referensi</th><th className="th text-right">Sisa</th><th className="th">Jatuh Tempo</th><th className="th text-right">Umur (hari)</th></tr></thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
                {data?.rows?.map((r, i) => (
                  <tr key={i}>
                    <td className="td font-semibold">{r.supplier_name || r.customer_name}</td>
                    <td className="td font-mono text-xs">{r.purchase_no || r.invoice_no}</td>
                    <td className="td text-right font-bold text-amber-600">{rupiah(+r.amount - +r.paid_amount)}</td>
                    <td className="td text-xs">{fmtDate(r.due_date)}</td>
                    <td className="td text-right"><span className={`badge ${+r.umur_hari > 90 ? 'bg-red-100 text-red-600' : +r.umur_hari > 30 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{r.umur_hari || 0} hari</span></td>
                  </tr>
                ))}
                {!data?.rows?.length && <tr><td colSpan={5} className="td text-center text-ink-400 py-8">Semua lunas 🎉</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card p-5">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data?.rows || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`} />
                <Tooltip formatter={(v) => rupiah(v)} />
                <Legend />
                <Line type="monotone" dataKey="omzet" name="Omzet" stroke="#2563eb" strokeWidth={2.5} />
                <Line type="monotone" dataKey="laba" name="Laba Kotor" stroke="#10b981" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-ink-50 dark:bg-ink-900/60"><th className="th">Bulan</th><th className="th text-right">Transaksi</th><th className="th text-right">Omzet</th><th className="th text-right">Laba Kotor</th><th className="th text-right">Rata-rata Belanja</th></tr></thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
                {data?.rows?.map((r, i) => (
                  <tr key={i}>
                    <td className="td font-semibold">{r.month}</td>
                    <td className="td text-right">{r.transaksi}</td>
                    <td className="td text-right font-bold">{rupiah(r.omzet)}</td>
                    <td className="td text-right text-success font-semibold">{rupiah(r.laba)}</td>
                    <td className="td text-right">{rupiah(r.rata_rata)}</td>
                  </tr>
                ))}
                {!data?.rows?.length && <tr><td colSpan={5} className="td text-center text-ink-400 py-8">Belum ada data tahun {year}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color = 'text-ink-800 dark:text-ink-100' }) {
  return (
    <div className="card p-3.5">
      <div className="text-xs text-ink-400 font-semibold uppercase">{label}</div>
      <div className={`text-lg font-extrabold mt-0.5 ${color}`}>{value}</div>
    </div>
  );
}
