import { useEffect, useMemo, useState, useRef } from 'react';
import toast from '../utils/toast';
import { swalConfirm } from '../utils/confirm';
import { Plus, Check, X, ClipboardList, ScanBarcode, Camera } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Field from '../components/Field';
import PageHeader from '../components/PageHeader';
import { stockApi, barcodeApi } from '../api';
import { errMsg } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { fmtQty, fmtDate } from '../utils/format';

export default function OpnamePage() {
  const can = useAuthStore((s) => s.can);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [session, setSession] = useState(null);
  const [barcode, setBarcode] = useState('');
  const barcodeRef = useRef(null);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await stockApi.opnames({ page: p, status, limit: 15 });
      setData(res.data);
      setMeta(res.meta);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(page); }, [page, status]);

  const openSession = async (row) => {
    const res = await stockApi.getOpname(row.id);
    setSession(res.data);
  };

  const handleScan = async () => {
    const code = barcode.trim();
    if (!code) return;
    try {
      const res = await barcodeApi.scan(code);
      const p = res.data;
      // cari item di sesi
      const existing = session.items.find((i) => i.product_id === p.id);
      if (existing) {
        // fokus ke input fisik item tsb
        document.getElementById(`opname-qty-${existing.id}`)?.focus();
        document.getElementById(`opname-qty-${existing.id}`)?.select();
        toast.success(`${p.name} — input stok fisik`);
      } else {
        const r = await stockApi.addOpnameItem(session.id, { product_id: p.id });
        toast.success(`${p.name} ditambahkan ke sesi`);
        setSession({ ...session, items: [...session.items, { id: r.data.id, product_id: p.id, product_name: p.name, product_code: p.code, system_qty: r.data.system_qty, physical_qty: r.data.system_qty, diff_qty: 0 }] });
      }
      setBarcode('');
    } catch (e) {
      toast.error(errMsg(e));
      setBarcode('');
    }
  };

  const updatePhysical = async (itemId, value) => {
    const qty = +value || 0;
    setSession((s) => ({ ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, physical_qty: qty, diff_qty: qty - +i.system_qty } : i)) }));
    try {
      await stockApi.updateOpnameItem(session.id, itemId, { physical_qty: qty });
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const submitSession = async () => {
    try {
      await stockApi.submitOpname(session.id);
      toast.success('Opname dikirim untuk approval');
      setSession(null); load(page);
    } catch (e) { toast.error(errMsg(e)); }
  };

  const columns = useMemo(() => [
    { header: 'No. Opname', accessorKey: 'opname_no', cell: (c) => <span className="font-mono text-xs font-bold">{c.getValue()}</span> },
    { header: 'Cabang', accessorKey: 'branch_name' },
    { header: 'Petugas', accessorKey: 'user_name', cell: (c) => <span className="text-xs">{c.getValue()}</span> },
    { header: 'Tanggal', accessorKey: 'created_at', cell: (c) => <span className="text-xs">{fmtDate(c.getValue(), true)}</span> },
    { header: 'Item', accessorKey: 'item_count', cell: (c) => <span className="badge bg-ink-100 dark:bg-ink-700">{c.getValue()} produk</span> },
    { header: 'Selisih', accessorKey: 'total_diff', cell: (c) => <span className={`font-bold ${+c.getValue() !== 0 ? 'text-warning' : 'text-success'}`}>{fmtQty(c.getValue())}</span> },
    { header: 'Status', accessorKey: 'status', cell: (c) => (
        <span className={`badge ${c.getValue() === 'approved' ? 'bg-emerald-100 text-emerald-600' : c.getValue() === 'rejected' ? 'bg-red-100 text-red-600' : c.getValue() === 'submitted' ? 'bg-primary-100 text-primary-600' : 'bg-amber-100 text-amber-600'}`}>{c.getValue()}</span>
      ) },
    {
      header: 'Aksi', accessorKey: 'id',
      cell: (c) => (
        <div className="flex gap-1">
          <button className="btn-ghost !p-1.5" title="Buka Sesi" onClick={() => openSession(c.row.original)}><ClipboardList size={15} /></button>
          {c.row.original.status === 'submitted' && can('opname', 'edit') && (
            <>
              <button className="btn-ghost !p-1.5 text-success" title="Approve (terapkan selisih ke stok)" onClick={async () => {
                if (!(await swalConfirm({ text: 'Setujui opname? Selisih akan diterapkan ke stok.', confirmText: 'Setujui' }))) return;
                try { await stockApi.approveOpname(c.row.original.id); toast.success('Opname disetujui'); load(page); } catch (e) { toast.error(errMsg(e)); }
              }}><Check size={16} /></button>
              <button className="btn-ghost !p-1.5 text-danger" title="Tolak" onClick={async () => {
                try { await stockApi.rejectOpname(c.row.original.id); toast.success('Opname ditolak'); load(page); } catch (e) { toast.error(errMsg(e)); }
              }}><X size={16} /></button>
            </>
          )}
        </div>
      ),
    },
  ], [can, page]);

  return (
    <div>
      <PageHeader title="Stok Opname" subtitle="Sesi opname: scan barcode, input fisik, selisih otomatis, approval"
        actions={can('opname', 'create') && (
          <button className="btn-primary" onClick={async () => {
            try {
              const res = await stockApi.createOpname({ note: '' });
              toast.success(`${res.data.opname_no} dibuat (${res.data.item_count} produk)`);
              openSession(res.data);
              load(page);
            } catch (e) { toast.error(errMsg(e)); }
          }}><Plus size={17} /> Buat Sesi Opname</button>
        )} />
      <div className="mb-4">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input !w-40">
          <option value="">Semua Status</option>
          <option value="open">Open</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={setPage} />

      {/* Sesi opname */}
      <Modal open={!!session} onClose={() => setSession(null)} title={`${session?.opname_no || ''} — Input Stok Fisik`} size="xl" footer={
        <>
          <button className="btn-secondary" onClick={() => setSession(null)}>Tutup</button>
          {session?.status === 'open' && (
            <button className="btn-primary" onClick={submitSession}><Check size={15} /> Kirim untuk Approval</button>
          )}
        </>
      }>
        {session && (
          <div className="space-y-3">
            {session.status === 'open' ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ScanBarcode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    ref={barcodeRef} value={barcode} onChange={(e) => setBarcode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                    placeholder="Scan barcode / ketik lalu Enter..." className="input !pl-9 font-mono" autoFocus
                  />
                </div>
                <button className="btn-secondary !px-3" title="Scan kamera"><Camera size={16} /></button>
              </div>
            ) : (
              <div className={`p-3 rounded-xl text-sm font-semibold ${session.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : session.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-600'}`}>
                Status: {session.status} — {session.status === 'approved' ? 'selisih sudah diterapkan ke stok' : session.status === 'submitted' ? 'menunggu approval manager' : ''}
              </div>
            )}
            <div className="rounded-xl border border-ink-100 dark:border-ink-700 overflow-hidden max-h-[50vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-ink-50 dark:bg-ink-900"><tr>
                  <th className="th">Barang</th><th className="th text-center">Stok Sistem</th><th className="th text-center">Stok Fisik</th><th className="th text-center">Selisih</th>
                </tr></thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
                  {session.items.map((i) => (
                    <tr key={i.id} className={+i.diff_qty !== 0 ? 'bg-amber-50/60 dark:bg-amber-900/10' : ''}>
                      <td className="td"><div className="font-semibold">{i.product_name}</div><div className="font-mono text-xs text-ink-400">{i.product_code}</div></td>
                      <td className="td text-center font-bold">{fmtQty(i.system_qty)} {i.unit}</td>
                      <td className="td text-center">
                        {session.status === 'open' ? (
                          <input id={`opname-qty-${i.id}`} type="number" value={i.physical_qty} onChange={(e) => updatePhysical(i.id, e.target.value)} className="input !w-28 !px-2 !py-1 text-center font-bold" />
                        ) : (
                          <b>{fmtQty(i.physical_qty)}</b>
                        )}
                      </td>
                      <td className={`td text-center font-extrabold ${+i.diff_qty > 0 ? 'text-success' : +i.diff_qty < 0 ? 'text-danger' : 'text-ink-300'}`}>
                        {+i.diff_qty > 0 ? '+' : ''}{fmtQty(i.diff_qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-ink-400">
              Total selisih: <b className={+session.total_diff !== 0 ? 'text-warning' : 'text-success'}>{fmtQty(session.total_diff)}</b> • barang stok fisik sama dengan sistem otomatis saat sesi dibuat — cukup perbaiki yang berbeda.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
