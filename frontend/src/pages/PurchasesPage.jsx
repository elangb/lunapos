import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from '../utils/toast';
import { Plus, Undo2, ShoppingBag, X, Trash2, ScanBarcode } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Field, { SearchInput } from '../components/Field';
import PageHeader from '../components/PageHeader';
import { purchasesApi, suppliersApi, productsApi, barcodeApi } from '../api';
import { errMsg } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { rupiah, fmtQty, fmtDate, today } from '../utils/format';

function PurchaseForm({ open, onClose, onSaved }) {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [discountTotal, setDiscountTotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [method, setMethod] = useState('cash');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    suppliersApi.options().then((r) => setSuppliers(r.data));
    productsApi.options().then((r) => setProducts(r.data));
    setItems([]); setSupplierId(''); setDiscountTotal(0); setTaxRate(0); setShipping(0); setMethod('cash'); setDueDate('');
  }, [open]);

  const addItem = (p, qty = 1, price = null, unitId = null) => {
    const units = p.units || [];
    const unit = units.find((u) => u.id === unitId) || units.find((u) => u.is_base) || units[0] || { unit_id: null, unit_name: 'pcs', conversion_factor: 1, price: p.buy_price };
    setItems((prev) => {
      const ex = prev.find((i) => i.product_id === p.id && i.unit_id === unit.unit_id);
      if (ex) return prev.map((i) => (i === ex ? { ...i, qty: +i.qty + qty } : i));
      return [...prev, { product_id: p.id, name: p.name, unit_id: unit.unit_id, unit_name: unit.unit_short || 'pcs', conversion_factor: +unit.conversion_factor, qty, price: price ?? (+unit.price || +p.buy_price || 0), discount: 0 }];
    });
  };

  const handleBarcode = async () => {
    const c = barcode.trim();
    if (!c) return;
    try {
      const res = await barcodeApi.scan(c);
      const full = products.find((x) => x.id === res.data.id);
      addItem(full || res.data);
      setBarcode('');
    } catch (e) {
      toast.error(errMsg(e));
      setBarcode('');
    }
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.qty - i.discount, 0);
    const tax = ((subtotal - discountTotal) * taxRate) / 100;
    const total = subtotal - discountTotal + tax + shipping;
    return { subtotal, tax, total };
  }, [items, discountTotal, taxRate, shipping]);

  const submit = async () => {
    if (!supplierId) return toast.error('Pilih supplier');
    if (!items.length) return toast.error('Keranjang kosong');
    setSaving(true);
    try {
      const res = await purchasesApi.create({
        supplier_id: +supplierId,
        items: items.map((i) => ({ product_id: i.product_id, unit_id: i.unit_id, qty: i.qty, price: i.price, discount: i.discount })),
        discount_total: discountTotal, tax_rate: taxRate, shipping_cost: shipping,
        payment_method: method, total_paid: method === 'cash' ? 0 : 0, due_date: dueDate || null,
      });
      toast.success(`Pembelian ${res.data.purchase_no} berhasil`);
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Pembelian Baru" size="lg" footer={
      <>
        <button className="btn-secondary" onClick={onClose}>Batal</button>
        <button className="btn-primary" onClick={submit} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Pembelian'}</button>
      </>
    }>
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Supplier" required>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input">
              <option value="">— Pilih —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Metode Pembayaran">
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="input">
              <option value="cash">Cash</option>
              <option value="debt">Hutang (termin)</option>
            </select>
          </Field>
          {method === 'debt' && <Field label="Jatuh Tempo"><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" /></Field>}
        </div>

        <div className="flex gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari produk..." className="flex-1" />
          <div className="relative w-44">
            <ScanBarcode size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleBarcode()} placeholder="Scan barcode" className="input !pl-8 font-mono" />
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap max-h-28 overflow-y-auto">
          {products.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())).slice(0, 30).map((p) => (
            <button key={p.id} onClick={() => addItem(p)} className="btn-secondary !px-2.5 !py-1 text-xs">{p.name}</button>
          ))}
        </div>

        <div className="rounded-xl border border-ink-100 dark:border-ink-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-ink-50 dark:bg-ink-900/60"><th className="th">Barang</th><th className="th w-20">Qty</th><th className="th w-28">Harga</th><th className="th w-24">Diskon</th><th className="th text-right">Subtotal</th><th className="th w-10"></th></tr></thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
              {items.length === 0 && <tr><td colSpan={6} className="td text-center text-ink-400 py-8">Keranjang kosong</td></tr>}
              {items.map((i, idx) => (
                <tr key={idx}>
                  <td className="td">
                    <div className="font-semibold">{i.name}</div>
                    <select value={i.unit_id || ''} onChange={(e) => {
                      const u = products.find((p) => p.id === i.product_id)?.units?.find((x) => x.id === +e.target.value);
                      setItems(items.map((x, k) => k === idx ? { ...x, unit_id: u?.id, unit_name: u?.unit_short, conversion_factor: +u?.conversion_factor, price: +u?.price || x.price } : x));
                    }} className="input !w-20 !px-2 !py-1 !text-xs">
                      {products.find((p) => p.id === i.product_id)?.units?.map((u) => <option key={u.id} value={u.id}>{u.unit_short}</option>)}
                    </select>
                  </td>
                  <td className="td"><input type="number" value={i.qty} onChange={(e) => setItems(items.map((x, k) => k === idx ? { ...x, qty: +e.target.value } : x))} className="input !px-2 !py-1" /></td>
                  <td className="td"><input type="number" value={i.price} onChange={(e) => setItems(items.map((x, k) => k === idx ? { ...x, price: +e.target.value } : x))} className="input !px-2 !py-1" /></td>
                  <td className="td"><input type="number" value={i.discount} onChange={(e) => setItems(items.map((x, k) => k === idx ? { ...x, discount: +e.target.value } : x))} className="input !px-2 !py-1" /></td>
                  <td className="td text-right font-semibold">{rupiah(i.price * i.qty - i.discount)}</td>
                  <td className="td"><button onClick={() => setItems(items.filter((_, k) => k !== idx))} className="text-danger"><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-56 space-y-2 text-sm">
            <div className="flex justify-between items-center"><span className="text-ink-400">Diskon Nota</span><input type="number" value={discountTotal} onChange={(e) => setDiscountTotal(+e.target.value)} className="input !w-24 !px-2 !py-1 !text-right" /></div>
            <div className="flex justify-between items-center"><span className="text-ink-400">Pajak (%)</span><input type="number" value={taxRate} onChange={(e) => setTaxRate(+e.target.value)} className="input !w-24 !px-2 !py-1 !text-right" /></div>
            <div className="flex justify-between items-center"><span className="text-ink-400">Ongkir</span><input type="number" value={shipping} onChange={(e) => setShipping(+e.target.value)} className="input !w-24 !px-2 !py-1 !text-right" /></div>
            <div className="flex justify-between font-extrabold text-base border-t border-ink-100 dark:border-ink-700 pt-2"><span>TOTAL</span><span>{rupiah(totals.total)}</span></div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ReturnForm({ open, onClose, purchase, onSaved }) {
  const [items, setItems] = useState([]);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !purchase) return;
    purchasesApi.get(purchase.id).then((r) => {
      setItems(r.data.items.map((i) => ({ ...i, return_qty: 0 })));
    });
  }, [open, purchase]);

  const totalRefund = items.reduce((s, i) => s + i.return_qty * i.unit_price, 0);

  const submit = async () => {
    const chosen = items.filter((i) => i.return_qty > 0);
    if (!chosen.length) return toast.error('Tentukan qty yang diretur');
    setSaving(true);
    try {
      await purchasesApi.createReturn({ purchase_id: purchase.id, items: chosen.map((i) => ({ product_id: i.product_id, qty: i.return_qty })), reason, return_type: 'partial' });
      toast.success('Retur berhasil, stok disesuaikan');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Retur Pembelian ${purchase?.purchase_no || ''}`} size="lg" footer={
      <>
        <button className="btn-secondary" onClick={onClose}>Batal</button>
        <button className="btn-danger" onClick={submit} disabled={saving}>{saving ? 'Memproses...' : `Retur ${rupiah(totalRefund)}`}</button>
      </>
    }>
      <div className="space-y-4">
        <Field label="Alasan"><input value={reason} onChange={(e) => setReason(e.target.value)} className="input" placeholder="Barang rusak / salah kirim / expired" /></Field>
        <table className="w-full text-sm">
          <thead><tr className="bg-ink-50 dark:bg-ink-900/60"><th className="th">Barang</th><th className="th text-center">Dibeli</th><th className="th text-center">Harga</th><th className="th text-center">Qty Retur</th><th className="th text-right">Refund</th></tr></thead>
          <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
            {items.map((i, idx) => (
              <tr key={i.id}>
                <td className="td font-semibold">{i.product_name}</td>
                <td className="td text-center">{fmtQty(i.qty)} {i.unit_name}</td>
                <td className="td text-center">{rupiah(i.unit_price)}</td>
                <td className="td text-center"><input type="number" max={i.qty} value={i.return_qty} onChange={(e) => setItems(items.map((x, k) => k === idx ? { ...x, return_qty: Math.min(+e.target.value, +x.qty) } : x))} className="input !w-24 !px-2 !py-1 text-center" /></td>
                <td className="td text-right font-semibold">{rupiah(i.return_qty * i.unit_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

export default function PurchasesPage() {
  const can = useAuthStore((s) => s.can);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [returns, setReturns] = useState([]);
  const [returnsMeta, setReturnsMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('purchases');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [retur, setRetur] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      if (tab === 'purchases') {
        const res = await purchasesApi.list({ page: p, search, limit: 15 });
        setData(res.data); setMeta(res.meta);
      } else {
        const res = await purchasesApi.listReturns({ page: p, limit: 15 });
        setReturns(res.data); setReturnsMeta(res.meta);
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(page); }, [tab, page, search]);

  const openDetail = async (row) => {
    const res = await purchasesApi.get(row.id);
    setDetail(res.data);
  };

  const columns = useMemo(() => tab === 'purchases' ? [
    { header: 'No. PO', accessorKey: 'purchase_no', cell: (c) => <span className="font-mono text-xs font-bold">{c.getValue()}</span> },
    { header: 'Tanggal', accessorKey: 'created_at', cell: (c) => <span className="text-xs">{fmtDate(c.getValue(), true)}</span> },
    { header: 'Supplier', accessorKey: 'supplier_name' },
    { header: 'Metode', accessorKey: 'payment_method', cell: (c) => <span className="badge bg-ink-100 dark:bg-ink-700 uppercase">{c.getValue()}</span> },
    { header: 'Total', accessorKey: 'total', cell: (c) => <span className="font-extrabold">{rupiah(c.getValue())}</span> },
    { header: 'Status', accessorKey: 'status', cell: (c) => <span className={`badge ${c.getValue() === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{c.getValue()}</span> },
    {
      header: 'Aksi', accessorKey: 'id',
      cell: (c) => (
        <div className="flex gap-1">
          <button className="btn-ghost !p-1.5" title="Detail" onClick={() => openDetail(c.row.original)}><ShoppingBag size={15} /></button>
          {can('returns', 'create') && c.row.original.status !== 'full_return' && (
            <button className="btn-ghost !p-1.5 text-warning" title="Retur" onClick={() => setRetur(c.row.original)}><Undo2 size={15} /></button>
          )}
        </div>
      ),
    },
  ] : [
    { header: 'No. Retur', accessorKey: 'return_no', cell: (c) => <span className="font-mono text-xs font-bold">{c.getValue()}</span> },
    { header: 'Tanggal', accessorKey: 'created_at', cell: (c) => <span className="text-xs">{fmtDate(c.getValue(), true)}</span> },
    { header: 'Supplier', accessorKey: 'supplier_name' },
    { header: 'Tipe', accessorKey: 'return_type', cell: (c) => <span className="badge bg-ink-100 dark:bg-ink-700">{c.getValue()}</span> },
    { header: 'Alasan', accessorKey: 'reason', cell: (c) => c.getValue() || '-' },
    { header: 'Refund', accessorKey: 'total_refund', cell: (c) => <span className="font-extrabold text-danger">{rupiah(c.getValue())}</span> },
  ], [tab, can, page]);

  return (
    <div>
      <PageHeader title="Pembelian & Retur" subtitle="Pembelian cash / hutang, retur sebagian atau penuh"
        actions={can('purchases', 'create') && <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={17} /> Pembelian Baru</button>} />
      <div className="flex gap-1 mb-4 p-1 bg-ink-100 dark:bg-ink-800 rounded-xl w-fit">
        {[['purchases', 'Pembelian'], ['returns', 'Retur']].map(([k, l]) => (
          <button key={k} onClick={() => { setTab(k); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === k ? 'bg-white dark:bg-ink-700 shadow-soft' : 'text-ink-400'}`}>{l}</button>
        ))}
      </div>
      <div className="mb-4"><SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari nomor..." className="w-72" /></div>
      <DataTable columns={columns} data={tab === 'purchases' ? data : returns} loading={loading} meta={tab === 'purchases' ? meta : returnsMeta} onPageChange={setPage} />

      <PurchaseForm open={showForm} onClose={() => setShowForm(false)} onSaved={() => load(page)} />
      <ReturnForm open={!!retur} onClose={() => setRetur(null)} purchase={retur} onSaved={() => load(page)} />

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.purchase_no || ''} size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-ink-50 dark:bg-ink-900"><div className="text-xs text-ink-400">Supplier</div><div className="font-semibold text-sm">{detail.supplier_name}</div></div>
              <div className="p-2.5 rounded-xl bg-ink-50 dark:bg-ink-900"><div className="text-xs text-ink-400">Petugas</div><div className="font-semibold text-sm">{detail.user_name}</div></div>
              <div className="p-2.5 rounded-xl bg-ink-50 dark:bg-ink-900"><div className="text-xs text-ink-400">Metode</div><div className="font-semibold text-sm uppercase">{detail.payment_method}</div></div>
              <div className="p-2.5 rounded-xl bg-ink-50 dark:bg-ink-900"><div className="text-xs text-ink-400">Total</div><div className="font-bold text-sm text-primary-600">{rupiah(detail.total)}</div></div>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="bg-ink-50 dark:bg-ink-900/60"><th className="th">Barang</th><th className="th text-center">Qty</th><th className="th text-right">Harga</th><th className="th text-right">Diskon</th><th className="th text-right">Subtotal</th></tr></thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
                {detail.items.map((it) => (
                  <tr key={it.id}><td className="td font-semibold">{it.product_name}</td><td className="td text-center">{fmtQty(it.qty)} {it.unit_name}</td><td className="td text-right">{rupiah(it.unit_price)}</td><td className="td text-right">{it.discount ? rupiah(it.discount) : '-'}</td><td className="td text-right font-semibold">{rupiah(it.subtotal)}</td></tr>
                ))}
              </tbody>
            </table>
            {detail.debts?.map((d) => (
              <div key={d.id} className="flex justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-sm">
                <span>Hutang: <b>{rupiah(d.amount - d.paid_amount)}</b> (jatuh tempo {fmtDate(d.due_date)})</span>
                <span className="badge bg-amber-100 text-amber-600">{d.status}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
