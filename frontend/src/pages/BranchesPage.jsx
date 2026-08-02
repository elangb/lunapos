import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from '../utils/toast';
import { swalConfirm } from '../utils/confirm';
import { Plus, Pencil, Trash2, Store } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Field, { SearchInput } from '../components/Field';
import PageHeader from '../components/PageHeader';
import { branchesApi } from '../api';
import { errMsg } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { fmtDate, rupiah } from '../utils/format';

const schema = z.object({
  name: z.string().min(1, 'Nama wajib'),
  address: z.string().optional(),
  pic_name: z.string().optional(),
  phone: z.string().optional(),
  is_active: z.boolean(),
});

export default function BranchesPage() {
  const can = useAuthStore((s) => s.can);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await branchesApi.list({ page: p, search, limit: 15 });
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
    reset(row ? { name: row.name, address: row.address || '', pic_name: row.pic_name || '', phone: row.phone || '', is_active: !!row.is_active } : { name: '', address: '', pic_name: '', phone: '', is_active: true });
    setShowForm(true);
  };

  const onSubmit = async (d) => {
    try {
      if (editing) await branchesApi.update(editing.id, d);
      else await branchesApi.create(d);
      toast.success('Cabang disimpan');
      setShowForm(false);
      load(page);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const columns = useMemo(() => [
    { header: 'ID', accessorKey: 'id', cell: (c) => <span className="font-mono text-xs text-ink-400">#{c.getValue()}</span> },
    {
      header: 'Cabang', accessorKey: 'name',
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center"><Store size={17} /></div>
          <div>
            <div className="font-semibold">{c.getValue()}</div>
            <div className="text-xs text-ink-400">{c.row.original.address || '-'}</div>
          </div>
        </div>
      ),
    },
    { header: 'Penanggung Jawab', accessorKey: 'pic_name', cell: (c) => c.getValue() || '-' },
    { header: 'Telepon', accessorKey: 'phone', cell: (c) => c.getValue() || '-' },
    { header: 'Pengguna', accessorKey: 'user_count', cell: (c) => <span className="badge bg-ink-100 dark:bg-ink-700">{c.getValue()} user</span> },
    { header: 'Penjualan Hari Ini', accessorKey: 'today_sales', cell: (c) => <span className="badge bg-emerald-100 text-emerald-600">{c.getValue()} trx</span> },
    { header: 'Status', accessorKey: 'is_active', cell: (c) => c.getValue() ? <span className="badge bg-emerald-100 text-emerald-600">Aktif</span> : <span className="badge bg-ink-100 text-ink-400">Nonaktif</span> },
    {
      header: 'Aksi', accessorKey: 'id',
      cell: (c) => (
        <div className="flex gap-1">
          {can('branches', 'edit') && <button className="btn-ghost !p-1.5" onClick={() => openForm(c.row.original)}><Pencil size={15} /></button>}
          {can('branches', 'delete') && (
            <button className="btn-ghost !p-1.5 text-danger" onClick={async () => {
              if (await swalConfirm({ text: `Nonaktifkan cabang "${c.row.original.name}"?`, confirmText: 'Ya, Nonaktifkan', danger: true })) {
                await branchesApi.remove(c.row.original.id);
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
      <PageHeader title="Cabang" subtitle="Multi-cabang: setiap kasir hanya melihat cabangnya"
        actions={can('branches', 'create') && <button className="btn-primary" onClick={() => openForm()}><Plus size={17} /> Tambah Cabang</button>} />
      <div className="mb-4"><SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari cabang..." className="w-72" /></div>
      <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={setPage} />

      <Modal open={showForm} onClose={() => setShowForm(false)} title={`${editing ? 'Edit' : 'Tambah'} Cabang`} size="md" footer={
        <>
          <button className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit(onSubmit)}>Simpan</button>
        </>
      }>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Nama Cabang" required>
            <input {...register('name')} className="input" />
            {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
          </Field>
          <Field label="Penanggung Jawab"><input {...register('pic_name')} className="input" /></Field>
          <Field label="Telepon"><input {...register('phone')} className="input" /></Field>
          <Field label="Alamat"><input {...register('address')} className="input" /></Field>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" {...register('is_active')} className="w-4 h-4 rounded" /> Aktif
          </label>
        </div>
      </Modal>
    </div>
  );
}
