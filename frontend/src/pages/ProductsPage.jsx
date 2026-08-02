import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from '../utils/toast';
import { swalConfirm } from '../utils/confirm';
import { Plus, Pencil, Trash2, Barcode, ImagePlus, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Field, { SearchInput } from '../components/Field';
import PageHeader from '../components/PageHeader';
import { productsApi, masterApi } from '../api';
import { errMsg } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { rupiah, fmtQty } from '../utils/format';

const schema = z.object({
  name: z.string().min(1, 'Nama wajib'),
  category_id: z.coerce.number().nullable().optional(),
  brand_id: z.coerce.number().nullable().optional(),
  base_unit_id: z.coerce.number().min(1, 'Satuan dasar wajib'),
  barcode: z.string().optional(),
  buy_price: z.coerce.number().min(0),
  retail_price: z.coerce.number().min(0),
  wholesale_price: z.coerce.number().min(0),
  member_price: z.coerce.number().min(0),
  default_discount: z.coerce.number().min(0).max(100),
  min_stock: z.coerce.number().min(0),
  is_active: z.boolean(),
  units: z.array(z.object({
    unit_id: z.coerce.number(),
    conversion_factor: z.coerce.number().positive(),
    price: z.coerce.number().min(0),
    barcode: z.string().optional(),
    is_base: z.boolean(),
  })),
});

function ProductForm({ open, onClose, product, onSaved }) {
  const can = useAuthStore((s) => s.can);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', category_id: '', brand_id: '', base_unit_id: '', barcode: '',
      buy_price: 0, retail_price: 0, wholesale_price: 0, member_price: 0,
      default_discount: 0, min_stock: 0, is_active: true, units: [],
    },
  });
  const unitRows = watch('units') || [];

  useEffect(() => {
    if (!open) return;
    masterApi.options('categories').then((r) => setCategories(r.data));
    masterApi.options('brands').then((r) => setBrands(r.data));
    masterApi.options('units').then((r) => setUnits(r.data));
    if (product) {
      reset({
        name: product.name, category_id: product.category_id || '', brand_id: product.brand_id || '',
        base_unit_id: product.base_unit_id, barcode: product.barcode || '',
        buy_price: +product.buy_price, retail_price: +product.retail_price,
        wholesale_price: +product.wholesale_price, member_price: +product.member_price,
        default_discount: +product.default_discount, min_stock: +product.min_stock,
        is_active: !!product.is_active,
        units: (product.units || []).map((u) => ({
          unit_id: u.unit_id, conversion_factor: +u.conversion_factor, price: +u.price,
          barcode: u.barcode || '', is_base: !!u.is_base,
        })),
      });
    } else {
      reset({ name: '', category_id: '', brand_id: '', base_unit_id: '', barcode: '', buy_price: 0, retail_price: 0, wholesale_price: 0, member_price: 0, default_discount: 0, min_stock: 0, is_active: true, units: [] });
    }
    setPhoto(null);
  }, [open, product]);

  const addUnitRow = () => {
    const base = unitRows.find((u) => u.is_base);
    const defaultUnit = units.find((u) => !base || u.id !== +base.unit_id);
    setValue('units', [...unitRows, { unit_id: defaultUnit?.id || '', conversion_factor: 1, price: 0, barcode: '', is_base: unitRows.length === 0 }]);
  };

  const onSubmit = async (d) => {
    setSaving(true);
    try {
      const payload = { ...d, units: d.units.filter((u) => u.unit_id) };
      let body = payload;
      if (photo) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (k === 'units') fd.append(k, JSON.stringify(v));
          else fd.append(k, v === null || v === '' ? '' : v);
        });
        fd.append('photo', photo);
        body = fd;
      }
      if (product) await productsApi.update(product.id, body);
      else await productsApi.create(body);
      toast.success('Produk disimpan');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={product ? `Edit ${product.name}` : 'Tambah Barang'} size="lg" footer={
      <>
        <button className="btn-secondary" onClick={onClose}>Batal</button>
        <button className="btn-primary" onClick={handleSubmit(onSubmit)} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
      </>
    }>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Nama Barang" required className="md:col-span-2">
            <input {...register('name')} className="input" />
            {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
          </Field>
          <Field label="Kategori">
            <select {...register('category_id')} className="input">
              <option value="">— Pilih —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Merk">
            <select {...register('brand_id')} className="input">
              <option value="">— Pilih —</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Satuan Dasar" required>
            <select {...register('base_unit_id')} className="input">
              <option value="">— Pilih —</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>)}
            </select>
            {errors.base_unit_id && <p className="text-xs text-danger mt-1">{errors.base_unit_id.message}</p>}
          </Field>
          <Field label="Barcode">
            <input {...register('barcode')} className="input font-mono" placeholder="899... (opsional)" />
          </Field>
          <Field label="Harga Beli (Rp)">
            <input type="number" {...register('buy_price')} className="input" />
          </Field>
          <Field label="Harga Jual Retail (Rp)">
            <input type="number" {...register('retail_price')} className="input" />
          </Field>
          <Field label="Harga Grosir (Rp)">
            <input type="number" {...register('wholesale_price')} className="input" />
          </Field>
          <Field label="Harga Member (Rp)">
            <input type="number" {...register('member_price')} className="input" />
          </Field>
          <Field label="Diskon Default (%)">
            <input type="number" {...register('default_discount')} className="input" />
          </Field>
          <Field label="Stok Minimum">
            <input type="number" step="0.001" {...register('min_stock')} className="input" />
          </Field>
          <Field label="Foto">
            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-ink-300 dark:border-ink-600 cursor-pointer hover:border-primary-400 text-sm text-ink-400">
              <ImagePlus size={16} />
              {photo ? photo.name : 'Upload foto...'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
            </label>
          </Field>
          <label className="flex items-center gap-2 text-sm mt-6">
            <input type="checkbox" {...register('is_active')} className="w-4 h-4 rounded" /> Aktif
          </label>
        </div>

        {/* Satuan bertingkat */}
        <div className="rounded-xl border border-ink-100 dark:border-ink-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-ink-50 dark:bg-ink-900/60">
            <span className="text-sm font-bold">Satuan Bertingkat (konversi stok otomatis)</span>
            <button type="button" onClick={addUnitRow} className="btn-secondary !px-2.5 !py-1 text-xs"><Plus size={13} /> Tambah Satuan</button>
          </div>
          {unitRows.length === 0 && <p className="px-4 py-3 text-xs text-ink-400">Belum ada satuan — klik tambah (contoh: 1 dus = 12 lusin = 144 pcs)</p>}
          <div className="divide-y divide-ink-100 dark:divide-ink-700">
            {unitRows.map((u, i) => (
              <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-2 px-4 py-2.5 items-end">
                <Field label="Satuan">
                  <select value={u.unit_id || ''} onChange={(e) => setValue(`units.${i}.unit_id`, +e.target.value)} className="input !py-1.5">
                    <option value="">—</option>
                    {units.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                </Field>
                <Field label="Faktor (ke dasar)">
                  <input type="number" step="0.001" value={u.conversion_factor} onChange={(e) => setValue(`units.${i}.conversion_factor`, +e.target.value)} className="input !py-1.5" />
                </Field>
                <Field label="Harga Satuan">
                  <input type="number" value={u.price} onChange={(e) => setValue(`units.${i}.price`, +e.target.value)} className="input !py-1.5" />
                </Field>
                <Field label="Barcode">
                  <input value={u.barcode || ''} onChange={(e) => setValue(`units.${i}.barcode`, e.target.value)} className="input !py-1.5 font-mono" />
                </Field>
                <div className="flex items-center gap-2 pb-1.5">
                  <label className="flex items-center gap-1.5 text-xs">
                    <input type="checkbox" checked={!!u.is_base} onChange={(e) => setValue(`units.${i}.is_base`, e.target.checked)} className="w-3.5 h-3.5" /> Dasar
                  </label>
                  <button type="button" onClick={() => setValue('units', unitRows.filter((_, x) => x !== i))} className="text-danger"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function ProductsPage() {
  const can = useAuthStore((s) => s.can);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await productsApi.list({ page: p, search, status, limit: 15 });
      setData(res.data);
      setMeta(res.meta);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page, search, status]);

  const columns = useMemo(() => [
    { header: 'Kode', accessorKey: 'code', cell: (c) => <span className="font-mono text-xs text-ink-400">{c.getValue()}</span> },
    {
      header: 'Barang', accessorKey: 'name',
      cell: (c) => (
        <div>
          <div className="font-semibold">{c.getValue()}</div>
          <div className="text-xs text-ink-400">{c.row.original.category_name || '-'} • {c.row.original.brand_name || '-'}</div>
        </div>
      ),
    },
    { header: 'Barcode', accessorKey: 'barcode', cell: (c) => c.getValue() ? <span className="font-mono text-xs">{c.getValue()}</span> : '-' },
    { header: 'Harga Beli', accessorKey: 'buy_price', cell: (c) => rupiah(c.getValue()) },
    { header: 'Retail', accessorKey: 'retail_price', cell: (c) => <span className="font-bold">{rupiah(c.getValue())}</span> },
    { header: 'Stok', accessorKey: 'stock_qty', cell: (c) => {
        const q = +c.getValue() || 0; const min = +c.row.original.min_stock || 0;
        return <span className={`badge ${q <= 0 ? 'bg-red-100 text-red-600' : q <= min ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{fmtQty(q)}</span>;
      } },
    { header: 'Status', accessorKey: 'is_active', cell: (c) => c.getValue() ? <span className="badge bg-emerald-100 text-emerald-600">Aktif</span> : <span className="badge bg-ink-100 text-ink-400">Nonaktif</span> },
    {
      header: 'Aksi', accessorKey: 'id',
      cell: (c) => (
        <div className="flex gap-1">
          <button className="btn-ghost !p-1.5" title="Detail" onClick={() => setDetail(c.row.original)}><Barcode size={15} /></button>
          {can('products', 'edit') && <button className="btn-ghost !p-1.5" title="Edit" onClick={() => setEditing(c.row.original)}><Pencil size={15} /></button>}
          {can('products', 'delete') && (
            <button className="btn-ghost !p-1.5 text-danger" title="Nonaktifkan" onClick={async () => {
              if (await swalConfirm({ text: `Nonaktifkan "${c.row.original.name}"?`, confirmText: 'Ya, Nonaktifkan', danger: true })) {
                await productsApi.remove(c.row.original.id).then(() => { toast.success('Produk dinonaktifkan'); load(page); });
              }
            }}><Trash2 size={15} /></button>
          )}
        </div>
      ),
    },
  ], [can, page]);

  return (
    <div>
      <PageHeader
        title="Master Barang"
        subtitle={`${meta?.total || 0} produk terdaftar`}
        actions={can('products', 'create') && (
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> Tambah Barang</button>
        )}
      />
      <div className="flex flex-wrap gap-2 mb-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari nama / kode / barcode..." className="w-72" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input !w-36">
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>
      <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={setPage} emptyText="Belum ada barang" />

      <ProductForm open={showForm} onClose={() => setShowForm(false)} product={editing} onSaved={() => load(page)} />

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name || 'Detail'} size="md">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-ink-400 text-xs">Kode</div><div className="font-mono font-semibold">{detail.code}</div></div>
              <div><div className="text-ink-400 text-xs">Barcode</div><div className="font-mono font-semibold">{detail.barcode || '-'}</div></div>
              <div><div className="text-ink-400 text-xs">Kategori</div><div>{detail.category_name || '-'}</div></div>
              <div><div className="text-ink-400 text-xs">Merk</div><div>{detail.brand_name || '-'}</div></div>
              <div><div className="text-ink-400 text-xs">Satuan Dasar</div><div>{detail.base_unit_name} ({detail.base_unit_short})</div></div>
              <div><div className="text-ink-400 text-xs">Diskon Default</div><div>{detail.default_discount}%</div></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Harga Beli', detail.buy_price], ['Retail', detail.retail_price],
                ['Grosir', detail.wholesale_price], ['Member', detail.member_price],
              ].map(([l, v]) => (
                <div key={l} className="p-3 rounded-xl bg-ink-50 dark:bg-ink-900">
                  <div className="text-xs text-ink-400">{l}</div>
                  <div className="font-extrabold">{rupiah(v)}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs text-ink-400 mb-2">Stok per Cabang</div>
              <div className="space-y-1.5">
                {detail.stocks?.map((s) => (
                  <div key={s.branch_id} className="flex justify-between text-sm p-2 rounded-lg bg-ink-50 dark:bg-ink-900">
                    <span>{s.branch_name}</span>
                    <b>{fmtQty(s.qty)} {detail.base_unit_short}</b>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn-primary w-full" onClick={async () => {
              const r = await productsApi.generateBarcode({ product_id: detail.id, format: 'EAN13' });
              toast.success(`Barcode dibuat: ${r.data.barcode}`);
              setDetail(null); load(page);
            }}><Barcode size={16} /> Generate Barcode EAN-13</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
