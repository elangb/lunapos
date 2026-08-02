import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import toast from '../utils/toast';
import { swalConfirm } from '../utils/confirm';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Field, { SearchInput } from '../components/Field';
import PageHeader from '../components/PageHeader';
import { masterApi } from '../api';
import { errMsg } from '../api/client';
import { useAuthStore } from '../stores/auth';

const TABS = [
  { key: 'categories', label: 'Kategori', fields: ['name', 'is_active'] },
  { key: 'brands', label: 'Merk', fields: ['name', 'is_active'] },
  { key: 'units', label: 'Satuan', fields: ['name', 'short_name', 'is_active'] },
];

export default function MasterDataPage() {
  const [tab, setTab] = useState('categories');
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const can = useAuthStore((s) => s.can);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const cfg = TABS.find((t) => t.key === tab);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await masterApi.list(tab, { page: p, search, limit: 15 });
      setData(res.data);
      setMeta(res.meta);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [tab, page, search]);

  const openForm = (row = null) => {
    setEditing(row);
    if (row) {
      const d = { name: row.name, short_name: row.short_name, is_active: !!row.is_active };
      reset(d);
    } else {
      reset({ name: '', short_name: '', is_active: true });
    }
    setShowForm(true);
  };

  const onSubmit = async (d) => {
    try {
      if (editing) await masterApi.update(tab, editing.id, d);
      else await masterApi.create(tab, d);
      toast.success('Disimpan');
      setShowForm(false);
      load(page);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const columns = useMemo(() => [
    { header: 'ID', accessorKey: 'id', cell: (c) => <span className="font-mono text-xs text-ink-400">#{c.getValue()}</span> },
    { header: 'Nama', accessorKey: 'name', cell: (c) => <span className="font-semibold">{c.getValue()}</span> },
    ...(tab === 'units' ? [{ header: 'Singkatan', accessorKey: 'short_name', cell: (c) => <span className="badge bg-ink-100 dark:bg-ink-700">{c.getValue()}</span> }] : []),
    { header: 'Status', accessorKey: 'is_active', cell: (c) => c.getValue() ? <span className="badge bg-emerald-100 text-emerald-600">Aktif</span> : <span className="badge bg-ink-100 text-ink-400">Nonaktif</span> },
    {
      header: 'Aksi', accessorKey: 'id',
      cell: (c) => (
        <div className="flex gap-1">
          {can(tab, 'edit') && <button className="btn-ghost !p-1.5" onClick={() => openForm(c.row.original)}><Pencil size={15} /></button>}
          {can(tab, 'delete') && (
            <button className="btn-ghost !p-1.5 text-danger" onClick={async () => {
              if (await swalConfirm({ text: `Nonaktifkan "${c.row.original.name}"?`, confirmText: 'Ya, Nonaktifkan', danger: true })) {
                await masterApi.remove(tab, c.row.original.id);
                toast.success('Dinonaktifkan');
                load(page);
              }
            }}><Trash2 size={15} /></button>
          )}
        </div>
      ),
    },
  ], [tab, can, page]);

  return (
    <div>
      <PageHeader
        title="Master Data"
        subtitle="Kategori, merk, dan satuan barang"
        actions={can(tab, 'create') && <button className="btn-primary" onClick={() => openForm()}><Plus size={17} /> Tambah</button>}
      />
      <div className="flex gap-1 mb-4 p-1 bg-ink-100 dark:bg-ink-800 rounded-xl w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? 'bg-white dark:bg-ink-700 shadow-soft' : 'text-ink-400'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="mb-4"><SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder={`Cari ${cfg.label.toLowerCase()}...`} className="w-72" /></div>
      <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={setPage} />

      <Modal open={showForm} onClose={() => setShowForm(false)} title={`${editing ? 'Edit' : 'Tambah'} ${cfg.label}`} size="sm" footer={
        <>
          <button className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit(onSubmit)}>Simpan</button>
        </>
      }>
        <div className="space-y-4">
          <Field label={`Nama ${cfg.label}`} required>
            <input {...register('name', { required: 'Nama wajib' })} className="input" />
            {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
          </Field>
          {tab === 'units' && (
            <Field label="Singkatan (pcs / lzn / dus)" required>
              <input {...register('short_name', { required: 'Singkatan wajib' })} className="input" />
            </Field>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('is_active')} className="w-4 h-4 rounded" /> Aktif
          </label>
        </div>
      </Modal>
    </div>
  );
}
