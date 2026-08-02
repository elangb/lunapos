import { useEffect, useMemo, useState } from 'react';
import toast from '../utils/toast';
import { swalConfirm } from '../utils/confirm';
import { Plus, Check, X, ArrowRight, ArrowLeftRight } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Field, { SearchInput } from '../components/Field';
import PageHeader from '../components/PageHeader';
import { stockApi, branchesApi, productsApi } from '../api';
import { errMsg } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { fmtQty, fmtDate } from '../utils/format';

export default function TransfersPage() {
  const can = useAuthStore((s) => s.can);
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [toBranch, setToBranch] = useState('');
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    branchesApi.options().then((r) => setBranches(r.data));
    productsApi.list({ limit: 100 }).then((r) => setProducts(r.data));
  }, []);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await stockApi.transfers({ page: p, status, limit: 15 });
      setData(res.data);
      setMeta(res.meta);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(page); }, [page, status]);

  const addItem = (p) => {
    setItems((prev) => {
      const ex = prev.find((i) => i.product_id === p.id);
      if (ex) return prev.map((i) => (i === ex ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { product_id: p.id, name: p.name, code: p.code, qty: 1, stock: +p.stock_qty || 0 }];
    });
  };

  const submit = async () => {
    if (!toBranch) return toast.error('Pilih cabang tujuan');
    if (!items.length) return toast.error('Item kosong');
    try {
      const res = await stockApi.createTransfer({ to_branch_id: +toBranch, items: items.map((i) => ({ product_id: i.product_id, qty: i.qty })), note });
      toast.success(`${res.data.transfer_no} dibuat — menunggu approval manager`);
      setShowForm(false); setItems([]); setToBranch(''); setNote('');
      load(page);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const openDetail = async (row) => {
    const res = await stockApi.getTransfer(row.id);
    setDetail(res.data);
  };

  const columns = useMemo(() => [
    { header: 'No. Transfer', accessorKey: 'transfer_no', cell: (c) => <span className="font-mono text-xs font-bold">{c.getValue()}</span> },
    { header: 'Rute', accessorKey: 'id', cell: (c) => (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="badge bg-ink-100 dark:bg-ink-700">{c.row.original.from_branch_name}</span>
          <ArrowRight size={13} className="text-ink-400" />
          <span className="badge bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">{c.row.original.to_branch_name}</span>
        </div>
      ) },
    { header: 'Diminta Oleh', accessorKey: 'requested_name', cell: (c) => <span className="text-xs">{c.getValue()}</span> },
    { header: 'Tanggal', accessorKey: 'created_at', cell: (c) => <span className="text-xs">{fmtDate(c.getValue(), true)}</span> },
    { header: 'Status', accessorKey: 'status', cell: (c) => (
        <span className={`badge ${c.getValue() === 'approved' ? 'bg-emerald-100 text-emerald-600' : c.getValue() === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{c.getValue()}</span>
      ) },
    {
      header: 'Aksi', accessorKey: 'id',
      cell: (c) => (
        <div className="flex gap-1">
          <button className="btn-ghost !p-1.5" title="Detail" onClick={() => openDetail(c.row.original)}><ArrowLeftRight size={15} /></button>
          {c.row.original.status === 'pending' && can('transfers', 'edit') && (
            <>
              <button className="btn-ghost !p-1.5 text-success" title="Approve (pindahkan stok)" onClick={async () => {
                if (!(await swalConfirm({ text: 'Setujui transfer? Stok akan dipindahkan dari cabang asal.', confirmText: 'Setujui' }))) return;
                try { await stockApi.approveTransfer(c.row.original.id); toast.success('Transfer disetujui'); load(page); } catch (e) { toast.error(errMsg(e)); }
              }}><Check size={16} /></button>
              <button className="btn-ghost !p-1.5 text-danger" title="Tolak" onClick={async () => {
                try { await stockApi.rejectTransfer(c.row.original.id); toast.success('Transfer ditolak'); load(page); } catch (e) { toast.error(errMsg(e)); }
              }}><X size={16} /></button>
            </>
          )}
        </div>
      ),
    },
  ], [can, page]);

  return (
    <div>
      <PageHeader title="Mutasi Antar Cabang" subtitle="Transfer stok antar cabang dengan approval manager"
        actions={can('transfers', 'create') && user.branch_id && <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={17} /> Buat Transfer</button>} />
      <div className="flex flex-wrap gap-2 mb-4">
        <SearchInput value={search} onChange={(v) => setSearch(v)} placeholder="Cari..." className="w-64" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input !w-40">
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
        </select>
      </div>
      <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={setPage} />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Transfer Stok" size="lg" footer={
        <>
          <button className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
          <button className="btn-primary" onClick={submit}>Kirim & Minta Approval</button>
        </>
      }>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Cabang Asal">
              <input value={user?.branch_name || ''} disabled className="input bg-ink-50 dark:bg-ink-900" />
            </Field>
            <Field label="Cabang Tujuan" required>
              <select value={toBranch} onChange={(e) => setToBranch(e.target.value)} className="input">
                <option value="">— Pilih —</option>
                {branches.filter((b) => b.id !== user.branch_id).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Cari produk..." className="w-72" />
          <div className="flex gap-1.5 flex-wrap max-h-28 overflow-y-auto">
            {products.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())).slice(0, 30).map((p) => (
              <button key={p.id} onClick={() => addItem(p)} className="btn-secondary !px-2.5 !py-1 text-xs">{p.name}</button>
            ))}
          </div>
          <div className="rounded-xl border border-ink-100 dark:border-ink-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-ink-50 dark:bg-ink-900/60"><th className="th">Barang</th><th className="th text-center">Stok Asal</th><th className="th text-center">Qty Transfer</th><th className="th w-10"></th></tr></thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
                {items.length === 0 && <tr><td colSpan={4} className="td text-center text-ink-400 py-6">Belum ada item</td></tr>}
                {items.map((i, idx) => (
                  <tr key={i.product_id}>
                    <td className="td"><div className="font-semibold">{i.name}</div><div className="font-mono text-xs text-ink-400">{i.code}</div></td>
                    <td className="td text-center">{fmtQty(i.stock)}</td>
                    <td className="td text-center"><input type="number" max={i.stock} value={i.qty} onChange={(e) => setItems(items.map((x, k) => k === idx ? { ...x, qty: Math.max(0, Math.min(+e.target.value, +x.stock)) } : x))} className="input !w-28 !px-2 !py-1 text-center" /></td>
                    <td className="td"><button className="text-danger" onClick={() => setItems(items.filter((_, k) => k !== idx))}><X size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Field label="Catatan"><input value={note} onChange={(e) => setNote(e.target.value)} className="input" placeholder="Contoh: transfer rutin bulanan" /></Field>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.transfer_no || ''} size="md">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-ink-50 dark:bg-ink-900 text-sm">
              <span>{detail.from_branch_name}</span>
              <ArrowRight size={16} className="text-primary-600" />
              <span>{detail.to_branch_name}</span>
              <span className={`badge ${detail.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : detail.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{detail.status}</span>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="bg-ink-50 dark:bg-ink-900/60"><th className="th">Barang</th><th className="th text-center">Qty</th></tr></thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
                {detail.items.map((i) => (
                  <tr key={i.id}><td className="td font-semibold">{i.product_name}</td><td className="td text-center font-bold">{fmtQty(i.qty)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
