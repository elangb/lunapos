import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from '../utils/toast';
import { Plus, Pencil, Trash2, Gift } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Field, { SearchInput } from '../components/Field';
import PageHeader from '../components/PageHeader';
import { promotionsApi, masterApi, productsApi, branchesApi } from '../api';
import { errMsg } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { fmtDate, typeLabels } from '../utils/format';

const schema = z.object({
  name: z.string().min(1, 'Nama wajib'),
  type: z.enum(['bogo', 'discount']),
  buy_qty: z.coerce.number().int().min(1).optional(),
  free_qty: z.coerce.number().int().min(1).optional(),
  discount_percent: z.coerce.number().min(0).max(100).optional(),
  target: z.enum(['product', 'category', 'all']),
  branch_id: z.coerce.number().optional(),
  start_date: z.string().min(1, 'Tanggal mulai wajib'),
  end_date: z.string().min(1, 'Tanggal selesai wajib'),
  is_active: z.boolean(),
});

function PromoForm({ open, onClose, promo, onSaved }) {
  const [targets, setTargets] = useState([]);
  const [branches, setBranches] = useState([]);
  const [targetId, setTargetId] = useState('');
  const [targetList, setTargetList] = useState([]);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const type = watch('type');
  const target = watch('target');

  useEffect(() => {
    if (!open) return;
    branchesApi.options().then((r) => setBranches(r.data));
    if (promo) {
      reset({
        name: promo.name, type: promo.type, buy_qty: promo.buy_qty || '', free_qty: promo.free_qty || '',
        discount_percent: promo.discount_percent || '', target: promo.target, branch_id: promo.branch_id || '',
        start_date: promo.start_date, end_date: promo.end_date, is_active: !!promo.is_active,
      });
      setTargetList(promo.items || []);
      setTargetId('');
    } else {
      reset({ name: '', type: 'bogo', buy_qty: 2, free_qty: 1, discount_percent: 10, target: 'all', branch_id: '', start_date: '', end_date: '', is_active: true });
      setTargetList([]);
      setTargetId('');
    }
  }, [open, promo]);

  useEffect(() => {
    if (target === 'product') productsApi.list({ limit: 100, status: 'active' }).then((r) => setTargets(r.data));
    else if (target === 'category') masterApi.options('categories').then((r) => setTargets(r.data));
    else setTargets([]);
  }, [target, open]);

  const addTarget = () => {
    if (!targetId) return;
    const t = targets.find((x) => String(x.id) === String(targetId));
    if (!t) return;
    setTargetList((prev) => [...prev, target === 'product' ? { product_id: t.id, product_name: t.name } : { category_id: t.id, category_name: t.name }]);
    setTargetId('');
  };

  const onSubmit = async (d) => {
    try {
      const payload = {
        ...d,
        branch_id: d.branch_id || null,
        buy_qty: d.type === 'bogo' ? d.buy_qty : null,
        free_qty: d.type === 'bogo' ? d.free_qty : null,
        discount_percent: d.type === 'discount' ? d.discount_percent : null,
        items: targetList.map((t) => ({ product_id: t.product_id || null, category_id: t.category_id || null })),
      };
      if (promo) await promotionsApi.update(promo.id, payload);
      else await promotionsApi.create(payload);
      toast.success('Promo disimpan');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`${promo ? 'Edit' : 'Tambah'} Promo`} size="lg" footer={
      <>
        <button className="btn-secondary" onClick={onClose}>Batal</button>
        <button className="btn-primary" onClick={handleSubmit(onSubmit)}>Simpan</button>
      </>
    }>
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Nama Promo" required className="md:col-span-2">
            <input {...register('name')} className="input" placeholder="Contoh: Beli 2 Gratis 1 Aqua" />
            {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
          </Field>
          <Field label="Tipe Promo">
            <select {...register('type')} className="input">
              <option value="bogo">Beli X Gratis Y</option>
              <option value="discount">Diskon Persen</option>
            </select>
          </Field>
          <Field label="Berlaku di Cabang">
            <select {...register('branch_id')} className="input">
              <option value="">Semua Cabang</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          {type === 'bogo' ? (
            <>
              <Field label="Beli (qty)" required>
                <input type="number" {...register('buy_qty')} className="input" placeholder="2" />
              </Field>
              <Field label="Gratis (qty)" required>
                <input type="number" {...register('free_qty')} className="input" placeholder="1" />
              </Field>
            </>
          ) : (
            <Field label="Diskon (%)" required>
              <input type="number" {...register('discount_percent')} className="input" placeholder="10" />
            </Field>
          )}
          <Field label="Target">
            <select {...register('target')} className="input">
              <option value="all">Semua Produk</option>
              <option value="product">Produk Tertentu</option>
              <option value="category">Kategori</option>
            </select>
          </Field>
          <Field label="Tanggal Mulai" required>
            <input type="date" {...register('start_date')} className="input" />
            {errors.start_date && <p className="text-xs text-danger mt-1">{errors.start_date.message}</p>}
          </Field>
          <Field label="Tanggal Selesai" required>
            <input type="date" {...register('end_date')} className="input" />
            {errors.end_date && <p className="text-xs text-danger mt-1">{errors.end_date.message}</p>}
          </Field>
        </div>

        {target !== 'all' && (
          <div className="rounded-xl border border-ink-100 dark:border-ink-700 p-3 space-y-2">
            <div className="flex gap-2">
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="input flex-1">
                <option value="">— Pilih {target === 'product' ? 'produk' : 'kategori'} —</option>
                {targets.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button type="button" className="btn-secondary" onClick={addTarget}><Plus size={15} /> Tambah</button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {targetList.map((t, i) => (
                <span key={i} className="badge bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 !py-1">
                  {t.product_name || t.category_name}
                  <button type="button" className="ml-1" onClick={() => setTargetList(targetList.filter((_, x) => x !== i))}>×</button>
                </span>
              ))}
              {targetList.length === 0 && <span className="text-xs text-ink-400">Belum ada target — semua {target === 'product' ? 'produk' : 'kategori'} tidak akan kena promo</span>}
            </div>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('is_active')} className="w-4 h-4 rounded" /> Aktif
        </label>
      </div>
    </Modal>
  );
}

export default function PromotionsPage() {
  const can = useAuthStore((s) => s.can);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await promotionsApi.list({ page: p, search, limit: 15 });
      setData(res.data);
      setMeta(res.meta);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(page); }, [page, search]);

  const columns = useMemo(() => [
    { header: 'Promo', accessorKey: 'name', cell: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center"><Gift size={17} /></div>
          <div>
            <div className="font-semibold">{c.getValue()}</div>
            <div className="text-xs text-ink-400">
              {c.row.original.type === 'bogo'
                ? `Beli ${c.row.original.buy_qty} gratis ${c.row.original.free_qty}`
                : `Diskon ${c.row.original.discount_percent}%`} • {typeLabels[c.row.original.target]} • {c.row.original.branch_name || 'Semua cabang'}
            </div>
          </div>
        </div>
      ) },
    { header: 'Periode', accessorKey: 'id', cell: (c) => <span className="text-xs">{fmtDate(c.row.original.start_date)} — {fmtDate(c.row.original.end_date)}</span> },
    { header: 'Status', accessorKey: 'is_active', cell: (c) => {
        const expired = new Date(c.row.original.end_date) < new Date();
        return expired ? <span className="badge bg-ink-100 text-ink-400">Kedaluwarsa</span> : c.getValue() ? <span className="badge bg-emerald-100 text-emerald-600">Aktif</span> : <span className="badge bg-red-100 text-red-600">Nonaktif</span>;
      } },
    {
      header: 'Aksi', accessorKey: 'id',
      cell: (c) => (
        <div className="flex gap-1">
          {can('promotions', 'edit') && <button className="btn-ghost !p-1.5" onClick={() => { setEditing(c.row.original); setShowForm(true); }}><Pencil size={15} /></button>}
          {can('promotions', 'delete') && (
            <button className="btn-ghost !p-1.5 text-danger" onClick={async () => {
              await promotionsApi.remove(c.row.original.id);
              toast.success('Promo dinonaktifkan'); load(page);
            }}><Trash2 size={15} /></button>
          )}
        </div>
      ),
    },
  ], [can, page]);

  return (
    <div>
      <PageHeader title="Promo" subtitle="Engine otomatis: Beli 2 Gratis 1, Beli 5 Bayar 4, diskon per produk/kategori/cabang"
        actions={can('promotions', 'create') && <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> Tambah Promo</button>} />
      <div className="mb-4"><SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari promo..." className="w-72" /></div>
      <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={setPage} />
      <PromoForm open={showForm} onClose={() => setShowForm(false)} promo={editing} onSaved={() => load(page)} />
    </div>
  );
}
