import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from '../utils/toast';
import { swalConfirm } from '../utils/confirm';
import { Plus, Pencil, Trash2, Wallet, History } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Field, { SearchInput } from '../components/Field';
import PageHeader from '../components/PageHeader';
import { suppliersApi } from '../api';
import { errMsg } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { rupiah, fmtDate } from '../utils/format';

const schema = z.object({
  name: z.string().min(1, 'Nama wajib'),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  is_active: z.boolean(),
});

export default function SuppliersPage() {
  const can = useAuthStore((s) => s.can);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await suppliersApi.list({ page: p, search, limit: 15 });
      setData(res.data);
      setMeta(res.meta);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(page); }, [page, search]);

  const openForm = (row = null) => {
    setEditing(row);
    reset(row ? { name: row.name, phone: row.phone || '', email: row.email || '', address: row.address || '', is_active: !!row.is_active } : { name: '', phone: '', email: '', address: '', is_active: true });
    setShowForm(true);
  };

  const onSubmit = async (d) => {
    try {
      if (editing) await suppliersApi.update(editing.id, d);
      else await suppliersApi.create(d);
      toast.success('Supplier disimpan');
      setShowForm(false);
      load(page);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const openDetail = async (row) => {
    const [debts, purchases] = await Promise.all([suppliersApi.debts(row.id), suppliersApi.purchases(row.id)]);
    setDetail({ ...row, debts: debts.data, purchases: purchases.data });
  };

  const columns = useMemo(() => [
    { header: 'Kode', accessorKey: 'code', cell: (c) => <span className="font-mono text-xs text-ink-400">{c.getValue()}</span> },
    {
      header: 'Supplier', accessorKey: 'name',
      cell: (c) => (
        <button onClick={() => openDetail(c.row.original)} className="text-left">
          <div className="font-semibold hover:text-primary-600">{c.getValue()}</div>
          <div className="text-xs text-ink-400">{c.row.original.phone || '-'}</div>
        </button>
      ),
    },
    { header: 'Alamat', accessorKey: 'address', cell: (c) => <span className="text-ink-500 max-w-[200px] truncate block">{c.getValue() || '-'}</span> },
    { header: 'Hutang', accessorKey: 'total_debt', cell: (c) => +c.getValue() > 0 ? <span className="badge bg-amber-100 text-amber-600 font-bold">{rupiah(c.getValue())}</span> : <span className="badge bg-emerald-100 text-emerald-600">Lunas</span> },
    { header: 'Status', accessorKey: 'is_active', cell: (c) => c.getValue() ? <span className="badge bg-emerald-100 text-emerald-600">Aktif</span> : <span className="badge bg-ink-100 text-ink-400">Nonaktif</span> },
    {
      header: 'Aksi', accessorKey: 'id',
      cell: (c) => (
        <div className="flex gap-1">
          {can('suppliers', 'edit') && <button className="btn-ghost !p-1.5" onClick={() => openForm(c.row.original)}><Pencil size={15} /></button>}
          {can('suppliers', 'delete') && (
            <button className="btn-ghost !p-1.5 text-danger" onClick={async () => {
              if (await swalConfirm({ text: `Nonaktifkan supplier "${c.row.original.name}"?`, confirmText: 'Ya, Nonaktifkan', danger: true })) {
                await suppliersApi.remove(c.row.original.id);
                toast.success('Dinonaktifkan'); load(page);
              }
            }}><Trash2 size={15} /></button>
          )}
        </div>
      ),
    },
  ], [can, page]);

  return (
    <div>
      <PageHeader title="Supplier" subtitle="Data pemasok, hutang, dan riwayat pembelian"
        actions={can('suppliers', 'create') && <button className="btn-primary" onClick={() => openForm()}><Plus size={17} /> Tambah Supplier</button>} />
      <div className="mb-4"><SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari supplier..." className="w-72" /></div>
      <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={setPage} />

      <Modal open={showForm} onClose={() => setShowForm(false)} title={`${editing ? 'Edit' : 'Tambah'} Supplier`} size="md" footer={
        <>
          <button className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit(onSubmit)}>Simpan</button>
        </>
      }>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Nama Supplier" required>
            <input {...register('name')} className="input" />
            {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
          </Field>
          <Field label="Telepon"><input {...register('phone')} className="input" /></Field>
          <Field label="Email"><input {...register('email')} className="input" /></Field>
          <Field label="Alamat"><input {...register('address')} className="input" /></Field>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" {...register('is_active')} className="w-4 h-4 rounded" /> Aktif
          </label>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name || ''} size="lg">
        {detail && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20"><div className="text-xs text-ink-400">Total Hutang</div><div className="font-extrabold text-amber-600">{rupiah(detail.total_debt)}</div></div>
              <div className="p-3 rounded-xl bg-ink-50 dark:bg-ink-900"><div className="text-xs text-ink-400">Telepon</div><div className="font-semibold">{detail.phone || '-'}</div></div>
              <div className="p-3 rounded-xl bg-ink-50 dark:bg-ink-900"><div className="text-xs text-ink-400">Alamat</div><div className="font-semibold text-xs">{detail.address || '-'}</div></div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-sm font-bold mb-2"><Wallet size={15} /> Riwayat Hutang</div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {detail.debts.length === 0 && <p className="text-xs text-ink-400">Tidak ada hutang</p>}
                {detail.debts.map((d) => (
                  <div key={d.id} className="flex justify-between text-xs p-2.5 rounded-lg bg-ink-50 dark:bg-ink-900">
                    <span className="font-mono">{d.purchase_no}</span>
                    <span>{fmtDate(d.purchase_date)}</span>
                    <span>{rupiah(d.amount - d.paid_amount)}</span>
                    <span className={`badge ${d.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{d.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-sm font-bold mb-2"><History size={15} /> Riwayat Pembelian</div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {detail.purchases.length === 0 && <p className="text-xs text-ink-400">Belum ada pembelian</p>}
                {detail.purchases.map((p) => (
                  <div key={p.id} className="flex justify-between text-xs p-2.5 rounded-lg bg-ink-50 dark:bg-ink-900">
                    <span className="font-mono">{p.purchase_no}</span>
                    <span>{fmtDate(p.created_at)}</span>
                    <span className="font-bold">{rupiah(p.total)}</span>
                    <span className="badge bg-ink-100 dark:bg-ink-700">{p.payment_method}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
