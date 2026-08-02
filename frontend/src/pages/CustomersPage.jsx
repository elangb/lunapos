import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from '../utils/toast';
import { swalConfirm } from '../utils/confirm';
import { Plus, Pencil, Trash2, Wallet, Receipt } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Field, { SearchInput } from '../components/Field';
import PageHeader from '../components/PageHeader';
import { customersApi } from '../api';
import { errMsg } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { rupiah, fmtDate } from '../utils/format';

const schema = z.object({
  name: z.string().min(1, 'Nama wajib'),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  type: z.enum(['umum', 'grosir', 'member']),
  is_active: z.boolean(),
});

export default function CustomersPage() {
  const can = useAuthStore((s) => s.can);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await customersApi.list({ page: p, search, type, limit: 15 });
      setData(res.data);
      setMeta(res.meta);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(page); }, [page, search, type]);

  const openForm = (row = null) => {
    setEditing(row);
    reset(row ? { name: row.name, phone: row.phone || '', email: row.email || '', address: row.address || '', type: row.type, is_active: !!row.is_active } : { name: '', phone: '', email: '', address: '', type: 'umum', is_active: true });
    setShowForm(true);
  };

  const onSubmit = async (d) => {
    try {
      if (editing) await customersApi.update(editing.id, d);
      else await customersApi.create(d);
      toast.success('Customer disimpan');
      setShowForm(false);
      load(page);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const openDetail = async (row) => {
    const [rec, sales] = await Promise.all([customersApi.receivables(row.id), customersApi.sales(row.id)]);
    setDetail({ ...row, receivables: rec.data, sales: sales.data });
  };

  const typeBadge = (t) => ({ umum: 'bg-ink-100 text-ink-500', grosir: 'bg-violet-100 text-violet-600', member: 'bg-primary-100 text-primary-600' }[t] || 'bg-ink-100 text-ink-500');

  const columns = useMemo(() => [
    { header: 'Kode', accessorKey: 'code', cell: (c) => <span className="font-mono text-xs text-ink-400">{c.getValue()}</span> },
    {
      header: 'Customer', accessorKey: 'name',
      cell: (c) => (
        <button onClick={() => openDetail(c.row.original)} className="text-left">
          <div className="font-semibold hover:text-primary-600">{c.getValue()}</div>
          <div className="text-xs text-ink-400">{c.row.original.phone || '-'}</div>
        </button>
      ),
    },
    { header: 'Tipe', accessorKey: 'type', cell: (c) => <span className={`badge ${typeBadge(c.getValue())}`}>{c.getValue()}</span> },
    { header: 'Piutang', accessorKey: 'total_receivable', cell: (c) => +c.getValue() > 0 ? <span className="badge bg-amber-100 text-amber-600 font-bold">{rupiah(c.getValue())}</span> : <span className="badge bg-emerald-100 text-emerald-600">Lunas</span> },
    { header: 'Status', accessorKey: 'is_active', cell: (c) => c.getValue() ? <span className="badge bg-emerald-100 text-emerald-600">Aktif</span> : <span className="badge bg-ink-100 text-ink-400">Nonaktif</span> },
    {
      header: 'Aksi', accessorKey: 'id',
      cell: (c) => (
        <div className="flex gap-1">
          {can('customers', 'edit') && <button className="btn-ghost !p-1.5" onClick={() => openForm(c.row.original)}><Pencil size={15} /></button>}
          {can('customers', 'delete') && (
            <button className="btn-ghost !p-1.5 text-danger" onClick={async () => {
              if (await swalConfirm({ text: `Nonaktifkan customer "${c.row.original.name}"?`, confirmText: 'Ya, Nonaktifkan', danger: true })) {
                await customersApi.remove(c.row.original.id);
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
      <PageHeader title="Customer" subtitle="Customer umum, grosir, member — plus piutang"
        actions={can('customers', 'create') && <button className="btn-primary" onClick={() => openForm()}><Plus size={17} /> Tambah Customer</button>} />
      <div className="flex flex-wrap gap-2 mb-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari customer..." className="w-72" />
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="input !w-36">
          <option value="">Semua Tipe</option>
          <option value="umum">Umum</option>
          <option value="grosir">Grosir</option>
          <option value="member">Member</option>
        </select>
      </div>
      <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={setPage} />

      <Modal open={showForm} onClose={() => setShowForm(false)} title={`${editing ? 'Edit' : 'Tambah'} Customer`} size="md" footer={
        <>
          <button className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit(onSubmit)}>Simpan</button>
        </>
      }>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Nama Customer" required>
            <input {...register('name')} className="input" />
            {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
          </Field>
          <Field label="Tipe">
            <select {...register('type')} className="input">
              <option value="umum">Umum</option>
              <option value="grosir">Grosir</option>
              <option value="member">Member</option>
            </select>
          </Field>
          <Field label="Telepon"><input {...register('phone')} className="input" /></Field>
          <Field label="Email"><input {...register('email')} className="input" /></Field>
          <Field label="Alamat" className="md:col-span-2"><input {...register('address')} className="input" /></Field>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" {...register('is_active')} className="w-4 h-4 rounded" /> Aktif
          </label>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name || ''} size="lg">
        {detail && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20"><div className="text-xs text-ink-400">Total Piutang</div><div className="font-extrabold text-amber-600">{rupiah(detail.total_receivable)}</div></div>
              <div className="p-3 rounded-xl bg-ink-50 dark:bg-ink-900"><div className="text-xs text-ink-400">Tipe</div><div className="font-semibold capitalize">{detail.type}</div></div>
              <div className="p-3 rounded-xl bg-ink-50 dark:bg-ink-900"><div className="text-xs text-ink-400">Kontak</div><div className="font-semibold text-xs">{detail.phone || '-'}</div></div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-sm font-bold mb-2"><Wallet size={15} /> Piutang</div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {detail.receivables.length === 0 && <p className="text-xs text-ink-400">Tidak ada piutang</p>}
                {detail.receivables.map((r) => (
                  <div key={r.id} className="flex justify-between text-xs p-2.5 rounded-lg bg-ink-50 dark:bg-ink-900">
                    <span className="font-mono">{r.invoice_no}</span>
                    <span>{fmtDate(r.sale_date)}</span>
                    <span className="font-bold">{rupiah(r.amount - r.paid_amount)}</span>
                    <span className={`badge ${r.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-sm font-bold mb-2"><Receipt size={15} /> Riwayat Belanja</div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {detail.sales.length === 0 && <p className="text-xs text-ink-400">Belum ada transaksi</p>}
                {detail.sales.map((s) => (
                  <div key={s.id} className="flex justify-between text-xs p-2.5 rounded-lg bg-ink-50 dark:bg-ink-900">
                    <span className="font-mono">{s.invoice_no}</span>
                    <span>{fmtDate(s.created_at)}</span>
                    <span className="font-bold">{rupiah(s.total)}</span>
                    <span className="badge bg-ink-100 dark:bg-ink-700">{s.payment_method}</span>
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
