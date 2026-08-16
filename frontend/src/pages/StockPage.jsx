import { useEffect, useMemo, useState } from 'react';
import toast from '../utils/toast';
import { BookOpen, Download, AlertTriangle, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import Field, { SearchInput } from '../components/Field';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { stockApi, productsApi, reportsApi, batchesApi, branchesApi } from '../api';
import { errMsg } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { rupiah, fmtQty, fmtDate, today, downloadCSV, typeLabels } from '../utils/format';

export default function StockPage() {
  const [tab, setTab] = useState('movements');
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [type, setType] = useState('');
  const [productId, setProductId] = useState('');
  const [products, setProducts] = useState([]);
  const [card, setCard] = useState(null);
  const [batchStatus, setBatchStatus] = useState('active');
  const [batchDays, setBatchDays] = useState(30);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({ product_id: '', branch_id: '', batch_no: '', expiry_date: '', qty: '' });
  const [branches, setBranches] = useState([]);
  const { user } = useAuthStore();

  useEffect(() => {
    productsApi.list({ limit: 100 }).then((r) => setProducts(r.data));
    branchesApi.options().then((r) => setBranches(r.data));
  }, []);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      if (tab === 'movements') {
        const res = await stockApi.movements({ page: p, type, from, to, limit: 15 });
        setData(res.data); setMeta(res.meta);
      } else if (tab === 'current') {
        const res = await reportsApi.stock({ view: 'current' });
        setData(res.data); setMeta({ total: res.data.length, page: 1, limit: res.data.length });
      } else if (tab === 'low') {
        const res = await stockApi.low();
        setData(res.data); setMeta({ total: res.data.length, page: 1, limit: res.data.length });
      } else if (tab === 'batches') {
        const res = await batchesApi.list({ page: p, status: batchStatus, days: batchDays, limit: 15 });
        setData(res.data); setMeta(res.meta);
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(page); }, [tab, page, from, to, type, batchStatus, batchDays]);

  const loadCard = async () => {
    if (!productId) return toast.error('Pilih produk');
    setLoading(true);
    try {
      const res = await stockApi.card({ product_id: productId, from, to });
      setCard(res.data);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => {
    if (tab === 'movements') return [
      { header: 'Waktu', accessorKey: 'created_at', cell: (c) => <span className="text-xs">{fmtDate(c.getValue(), true)}</span> },
      { header: 'Barang', accessorKey: 'product_name', cell: (c) => (
          <div><div className="font-semibold">{c.getValue()}</div><div className="font-mono text-xs text-ink-400">{c.row.original.product_code}</div></div>
        ) },
      { header: 'Tipe', accessorKey: 'type', cell: (c) => <span className={`badge ${+c.row.original.qty > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{typeLabels[c.getValue()] || c.getValue()}</span> },
      { header: 'Qty', accessorKey: 'qty', cell: (c) => <span className={`font-bold ${+c.getValue() > 0 ? 'text-success' : 'text-danger'}`}>{+c.getValue() > 0 ? '+' : ''}{fmtQty(c.getValue())}</span> },
      { header: 'Referensi', accessorKey: 'ref_type', cell: (c) => <span className="font-mono text-xs text-ink-400">{c.row.original.note || '-'}</span> },
      { header: 'Oleh', accessorKey: 'user_name', cell: (c) => c.getValue() || '-' },
    ];
    if (tab === 'current') return [
      { header: 'Barang', accessorKey: 'name', cell: (c) => (
          <div><div className="font-semibold">{c.getValue()}</div><div className="font-mono text-xs text-ink-400">{c.row.original.code}</div></div>
        ) },
      { header: 'Kategori', accessorKey: 'category_name', cell: (c) => c.getValue() || '-' },
      { header: 'Stok', accessorKey: 'stock_qty', cell: (c) => {
          const q = +c.getValue() || 0; const min = +c.row.original.min_stock || 0;
          return <span className={`badge font-bold ${q <= 0 ? 'bg-red-100 text-red-600' : q <= min ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{fmtQty(q)} {c.row.original.unit}</span>;
        } },
      { header: 'Minimum', accessorKey: 'min_stock', cell: (c) => fmtQty(c.getValue()) },
      { header: 'Harga Beli', accessorKey: 'buy_price', cell: (c) => rupiah(c.getValue()) },
      { header: 'Retail', accessorKey: 'retail_price', cell: (c) => <span className="font-bold">{rupiah(c.getValue())}</span> },
      { header: 'Cabang', accessorKey: 'branch_name' },
    ];
    return [
      { header: 'Barang', accessorKey: 'name', cell: (c) => (
          <div><div className="font-semibold">{c.getValue()}</div><div className="font-mono text-xs text-ink-400">{c.row.original.code}</div></div>
        ) },
      { header: 'Stok', accessorKey: 'stock_qty', cell: (c) => <span className="badge bg-amber-100 text-amber-600 font-bold">{fmtQty(c.getValue())} {c.row.original.unit}</span> },
      { header: 'Minimum', accessorKey: 'min_stock', cell: (c) => fmtQty(c.getValue()) },
      { header: 'Selisih', accessorKey: 'id', cell: (c) => { const d = +c.row.original.stock_qty - +c.row.original.min_stock; return <span className={d < 0 ? 'text-danger font-bold' : 'text-success font-bold'}>{fmtQty(d)}</span>; } },
    ];
  }, [tab]);

  const batchColumns = [
    { header: 'Batch', accessorKey: 'batch_no', cell: (c) => <span className="font-mono font-semibold">{c.getValue()}</span> },
    { header: 'Barang', accessorKey: 'product_name', cell: (c) => (
        <div><div className="font-semibold">{c.getValue()}</div><div className="font-mono text-xs text-ink-400">{c.row.original.product_code}</div></div>
      ) },
    { header: 'Cabang', accessorKey: 'branch_name' },
    { header: 'Kadaluarsa', accessorKey: 'expiry_date', cell: (c) => {
        const v = c.getValue();
        if (!v) return <span className="text-ink-400">Tanpa expiry</span>;
        const left = +c.row.original.days_left;
        const expired = left < 0;
        const soon = !expired && left <= 30;
        return (
          <div className="flex items-center gap-2">
            <span>{fmtDate(v)}</span>
            <span className={`badge text-xs ${expired ? 'bg-red-100 text-red-600' : soon ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {expired ? `lewat ${Math.abs(left)} hari` : `${left} hari`}
            </span>
          </div>
        );
      } },
    { header: 'Sisa Qty', accessorKey: 'qty', cell: (c) => <span className="font-bold">{fmtQty(c.getValue())}</span> },
    { header: 'Tgl Input', accessorKey: 'created_at', cell: (c) => <span className="text-xs">{fmtDate(c.getValue())}</span> },
  ];

  return (
    <div>
      <PageHeader title="Stok & Kartu Stok" subtitle="Mutasi masuk/keluar, stok saat ini, stok menipis, batch & expired" />
      <div className="flex gap-1 mb-4 p-1 bg-ink-100 dark:bg-ink-800 rounded-xl w-fit flex-wrap">
        {[['movements', 'Mutasi Stok'], ['current', 'Stok Saat Ini'], ['low', 'Stok Menipis'], ['batches', 'Batch / Expired'], ['card', 'Kartu Stok']].map(([k, l]) => (
          <button key={k} onClick={() => { setTab(k); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === k ? 'bg-white dark:bg-ink-700 shadow-soft' : 'text-ink-400'}`}>{l}</button>
        ))}
      </div>

      {tab === 'card' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-end">
            <Field label="Produk" className="!mb-0">
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className="input !w-72">
                <option value="">— Pilih —</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
              </select>
            </Field>
            <Field label="Dari" className="!mb-0"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input !w-40" /></Field>
            <Field label="Sampai" className="!mb-0"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input !w-40" /></Field>
            <button className="btn-primary" onClick={loadCard}><BookOpen size={16} /> Lihat Kartu Stok</button>
            {card && <button className="btn-secondary" onClick={() => downloadCSV(`kartu-stok-${card.product.code}.csv`, ['Waktu', 'Tipe', 'Qty', 'Saldo', 'Referensi'], card.items.map((i) => [i.created_at, typeLabels[i.type], i.qty, i.balance, i.note]))}><Download size={15} /> CSV</button>}
          </div>
          {card && (
            <div className="card overflow-hidden">
              <div className="p-4 bg-ink-50 dark:bg-ink-900/60 flex flex-wrap gap-6 text-sm">
                <div><span className="text-ink-400">Produk: </span><b>{card.product.name}</b> <span className="font-mono text-xs text-ink-400">({card.product.code})</span></div>
                <div><span className="text-ink-400">Cabang: </span><b>{card.branch.name}</b></div>
                <div><span className="text-ink-400">Saldo Awal: </span><b>{fmtQty(card.opening)}</b></div>
                <div><span className="text-ink-400">Saldo Akhir: </span><b className="text-primary-600">{card.items.length ? fmtQty(card.items[card.items.length - 1].balance) : fmtQty(card.opening)}</b></div>
              </div>
              <table className="w-full">
                <thead><tr className="bg-ink-50 dark:bg-ink-900/60"><th className="th">Waktu</th><th className="th">Tipe</th><th className="th text-right">Masuk</th><th className="th text-right">Keluar</th><th className="th text-right">Saldo</th><th className="th">Referensi</th><th className="th">Oleh</th></tr></thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
                  {card.items.length === 0 && <tr><td colSpan={7} className="td text-center text-ink-400 py-8">Tidak ada mutasi di rentang ini</td></tr>}
                  {card.items.map((m) => (
                    <tr key={m.id}>
                      <td className="td text-xs">{fmtDate(m.created_at, true)}</td>
                      <td className="td"><span className="badge bg-ink-100 dark:bg-ink-700">{typeLabels[m.type] || m.type}</span></td>
                      <td className="td text-right text-success font-semibold">{+m.qty > 0 ? fmtQty(m.qty) : '-'}</td>
                      <td className="td text-right text-danger font-semibold">{+m.qty < 0 ? fmtQty(Math.abs(+m.qty)) : '-'}</td>
                      <td className="td text-right font-bold">{fmtQty(m.balance)}</td>
                      <td className="td font-mono text-xs text-ink-400">{m.note || '-'}</td>
                      <td className="td text-xs">{m.user_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <>
          {tab === 'movements' && (
            <div className="flex flex-wrap gap-2 mb-4">
              <Field label="Dari" className="!mb-0"><input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="input !w-40" /></Field>
              <Field label="Sampai" className="!mb-0"><input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="input !w-40" /></Field>
              <Field label="Tipe" className="!mb-0">
                <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="input !w-44">
                  <option value="">Semua Tipe</option>
                  {Object.entries(typeLabels).filter(([k]) => ['purchase', 'sale', 'transfer_in', 'transfer_out', 'opname', 'return_in', 'return_out', 'manual'].includes(k)).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </Field>
            </div>
          )}
          {tab === 'batches' && (
            <div className="flex flex-wrap gap-2 mb-4 items-end">
              <Field label="Status" className="!mb-0">
                <select value={batchStatus} onChange={(e) => { setBatchStatus(e.target.value); setPage(1); }} className="input !w-40">
                  <option value="active">Belum Kadaluarsa</option>
                  <option value="expiring">Akan Kadaluarsa</option>
                  <option value="expired">Sudah Kadaluarsa</option>
                  <option value="">Semua</option>
                </select>
              </Field>
              {batchStatus === 'expiring' && (
                <Field label="Dalam (hari)" className="!mb-0">
                  <input type="number" value={batchDays} min={1} onChange={(e) => { setBatchDays(+e.target.value || 30); setPage(1); }} className="input !w-24" />
                </Field>
              )}
              <button className="btn-primary" onClick={() => setShowBatchModal(true)}><Plus size={16} /> Input Batch</button>
            </div>
          )}
          {tab === 'batches' ? (
            <DataTable columns={batchColumns} data={data} loading={loading} meta={meta} onPageChange={setPage} emptyText="Tidak ada batch" />
          ) : (
            <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={setPage} />
          )}
        </>
      )}

      {showBatchModal && (
        <Modal open={showBatchModal} title="Input Batch / Stok Masuk" onClose={() => setShowBatchModal(false)}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              await batchesApi.create(batchForm);
              toast.success('Batch ditambahkan');
              setShowBatchModal(false);
              setBatchForm({ product_id: '', branch_id: '', batch_no: '', expiry_date: '', qty: '' });
              load(page);
            } catch (err) {
              toast.error(errMsg(err));
            }
          }}>
            <div className="space-y-3">
              {!user?.branch_id && (
                <Field label="Cabang" required>
                  <select value={batchForm.branch_id} onChange={(e) => setBatchForm({ ...batchForm, branch_id: e.target.value })} className="input" required>
                    <option value="">— Pilih Cabang —</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </Field>
              )}
              <Field label="Produk" required>
                <select value={batchForm.product_id} onChange={(e) => setBatchForm({ ...batchForm, product_id: e.target.value })} className="input" required>
                  <option value="">— Pilih —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nomor Batch" required>
                  <input value={batchForm.batch_no} onChange={(e) => setBatchForm({ ...batchForm, batch_no: e.target.value })} className="input" placeholder="mis. LOT-2026-01" required />
                </Field>
                <Field label="Tanggal Kadaluarsa">
                  <input type="date" value={batchForm.expiry_date} onChange={(e) => setBatchForm({ ...batchForm, expiry_date: e.target.value })} className="input" />
                </Field>
              </div>
              <Field label="Qty (satuan dasar)" required>
                <input type="number" step="any" min="0.001" value={batchForm.qty} onChange={(e) => setBatchForm({ ...batchForm, qty: e.target.value })} className="input" placeholder="mis. 48" required />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowBatchModal(false)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan</button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
