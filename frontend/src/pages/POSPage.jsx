import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import toast from '../utils/toast';
import { swalConfirm } from '../utils/confirm';
import {
  ShoppingCart, Search, Trash2, Plus, Minus, ScanBarcode, Camera, PauseCircle, History,
  Banknote, Landmark, Smartphone, HandCoins, Receipt as ReceiptIcon, X, Package, Percent, User as UserIcon,
  Loader2,
} from 'lucide-react';
import Barcode from 'react-barcode';
import Modal from '../components/Modal';
import Field from '../components/Field';
import { productsApi, salesApi, barcodeApi, customersApi, branchesApi } from '../api';
import { errMsg } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { usePosStore } from '../stores/pos';
import { rupiah, fmtQty, fmtDate } from '../utils/format';
import { isOnline, enqueue } from '../utils/offline';

/* ================== SCANNER KAMERA ================== */
function ScannerModal({ open, onClose, onScanned }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    let scanner = null;
    let mounted = true;
    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mounted) return;
        scanner = new Html5Qrcode('qr-reader');
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (text) => { onScanned(text.trim()); onClose(); },
          () => {}
        );
      } catch (e) {
        toast.error('Kamera tidak dapat diakses');
      }
    })();
    return () => { mounted = false; scanner?.stop().catch(() => {}); scanner?.clear(); };
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Scan Barcode dengan Kamera" size="sm">
      <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />
      <p className="text-xs text-ink-400 mt-3 text-center">Arahkan kamera ke barcode produk</p>
    </Modal>
  );
}

/* ================== MODAL RECALL (HOLD) ================== */
function HoldModal({ open, onClose, onRecall }) {
  const [holds, setHolds] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    salesApi.holds().then((r) => setHolds(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Recall Transaksi (Hold)" size="md">
      {loading ? <div className="py-8 text-center text-sm text-ink-400">Memuat...</div> : holds.length === 0 ? (
        <div className="py-8 text-center text-sm text-ink-400">Tidak ada transaksi yang di-hold</div>
      ) : (
        <div className="space-y-2">
          {holds.map((h) => (
            <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl border border-ink-100 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-700/40">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{h.hold_no} <span className="text-ink-400 font-normal">• {h.user_name}</span></div>
                <div className="text-xs text-ink-400">{fmtDate(h.held_at, true)} • {JSON.parse(h.items || '[]').length} item</div>
              </div>
              <div className="text-sm font-bold">{rupiah(h.total)}</div>
              <button className="btn-primary !px-3 !py-1.5 text-xs" onClick={() => onRecall(h)}>Recall</button>
              <button className="btn-ghost !px-2 !py-1.5" onClick={async () => { await salesApi.deleteHold(h.id); setHolds(holds.filter((x) => x.id !== h.id)); }}>
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* ================== MODAL PEMBAYARAN ================== */
const METHODS = [
  { key: 'cash', label: 'Cash', icon: Banknote },
  { key: 'transfer', label: 'Transfer', icon: Landmark },
  { key: 'qris', label: 'QRIS', icon: Smartphone },
  { key: 'debt', label: 'Hutang', icon: HandCoins },
];

function PaymentModal({ open, onClose, onSuccess, branchId }) {
  const store = usePosStore();
  const can = useAuthStore((s) => s.can);
  const [method, setMethod] = useState('cash');
  const [received, setReceived] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const t = store.total();
  const isDebt = method === 'debt';
  const change = isDebt ? 0 : Math.max(0, (+received || 0) - t.total);

  const quickAmounts = useMemo(() => {
    const arr = [10000, 20000, 50000, 100000];
    const target = Math.ceil(t.total / 10000) * 10000;
    return [...new Set([target, ...arr.filter((a) => a >= target)])].slice(0, 4);
  }, [t.total]);

  const submit = async () => {
    if (isDebt && !store.customer) return toast.error('Pilih customer untuk penjualan hutang');
    if (isDebt && !dueDate) return toast.error('Isi jatuh tempo');
    if (!isDebt && +received < t.total) return toast.error('Uang diterima kurang dari total');
    const payload = {
      ...store.payload(),
      branch_id: branchId,
      payment_method: method,
      total_paid: isDebt ? 0 : +received,
      due_date: dueDate || null,
    };
    setLoading(true);

    /* Mode offline: simpan ke antrian lokal */
    if (!isOnline()) {
      enqueue({ type: 'sale', payload });
      toast.info(`Offline — transaksi Rp ${rupiah(t.total)} disimpan lokal, akan dikirim saat online`);
      onClose();
      store.clear();
      setLoading(false);
      return;
    }

    try {
      const res = await salesApi.create(payload);
      toast.success(`Transaksi ${res.data.invoice_no} berhasil!`);
      onClose();
      onSuccess(res.data.id);
      store.clear();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Pembayaran" size="sm">
      <div className="space-y-4">
        <div className="text-center py-3 bg-ink-50 dark:bg-ink-900 rounded-xl">
          <div className="text-xs text-ink-400 font-semibold uppercase">Total Tagihan</div>
          <div className="text-3xl font-extrabold text-primary-600 dark:text-primary-400">{rupiah(t.total)}</div>
          {t.discount_total > 0 && <div className="text-xs text-success font-semibold">Diskon {rupiah(t.discount_total)}</div>}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {METHODS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMethod(m.key)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                method === m.key ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'border-ink-200 dark:border-ink-600 text-ink-500 hover:border-ink-300'
              }`}
            >
              <m.icon size={20} />
              {m.label}
            </button>
          ))}
        </div>

        {isDebt ? (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold"><UserIcon size={14} /> Penjualan Hutang</div>
            <div>
              Customer: <b>{store.customer?.name || '— belum dipilih'}</b>
              {!store.customer && (
                <button onClick={() => { onClose(); document.getElementById('pos-customer-btn')?.click(); }} className="text-primary-600 underline ml-1">pilih di kasir</button>
              )}
            </div>
            <Field label="Jatuh Tempo" required>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
            </Field>
          </div>
        ) : (
          <>
            <Field label="Uang Diterima">
              <input
                type="number" value={received} onChange={(e) => setReceived(e.target.value)} className="input !text-xl !font-bold"
                placeholder="0" autoFocus
              />
            </Field>
            <div className="flex gap-2">
              {quickAmounts.map((a) => (
                <button key={a} onClick={() => setReceived(a)} className="btn-secondary !px-3 !py-1.5 text-xs">Rp {(a / 1000).toFixed(0)}rb</button>
              ))}
            </div>
            <div className={`flex items-center justify-between p-3 rounded-xl ${change > 0 ? 'bg-success/10 text-success' : 'bg-ink-50 dark:bg-ink-900 text-ink-400'}`}>
              <span className="text-sm font-semibold">Kembalian</span>
              <span className="text-xl font-extrabold">{rupiah(change)}</span>
            </div>
          </>
        )}

        <button onClick={submit} disabled={loading} className="btn-success w-full !py-3.5 !text-base">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <ReceiptIcon size={18} />} Proses Pembayaran
        </button>
        <p className="text-[11px] text-ink-400 text-center">
          {can('sales', 'edit') ? 'Harga & diskon dapat diedit di keranjang.' : 'Anda tidak memiliki izin edit harga.'}
        </p>
      </div>
    </Modal>
  );
}

/* ================== MODAL STRUK ================== */
function ReceiptModal({ open, onClose, saleId }) {
  const [sale, setSale] = useState(null);
  const [width, setWidth] = useState('58');
  const user = useAuthStore((s) => s.user);
  const branchName = user?.branch_name || '';

  useEffect(() => {
    if (!open || !saleId) return;
    salesApi.get(saleId).then((r) => setSale(r.data)).catch(() => {});
  }, [open, saleId]);

  const doPrint = () => {
    window.print();
  };

  return (
    <Modal open={open} onClose={onClose} title="Struk Transaksi" size="sm" footer={
      <>
        <div className="flex items-center gap-1 mr-auto">
          {['58', '80'].map((w) => (
            <button key={w} onClick={() => setWidth(w)} className={`btn-secondary !px-3 !py-1.5 text-xs ${width === w ? '!bg-primary-600 !text-white' : ''}`}>{w}mm</button>
          ))}
        </div>
        <button className="btn-primary" onClick={doPrint}><ReceiptIcon size={16} /> Cetak</button>
        <button className="btn-secondary" onClick={onClose}>Tutup</button>
      </>
    }>
      {!sale ? (
        <div className="py-10 text-center text-sm text-ink-400">Memuat struk...</div>
      ) : (
        <div id="print-area">
          <div className={`receipt receipt-${width} mx-auto p-2`}>
            <h3>LunaPOS</h3>
            <div className="center">{branchName}</div>
            <div className="center">{sale.invoice_no}</div>
            <div className="center">{fmtDate(sale.created_at, true)}</div>
            <div className="dashed" />
            <div className="row"><span>Kasir</span><span>{sale.cashier_name}</span></div>
            {sale.customer_name && <div className="row"><span>Customer</span><span>{sale.customer_name}</span></div>}
            <div className="dashed" />
            {sale.items.map((it) => (
              <div key={it.id}>
                <div>{it.is_free ? '🎁 ' : ''}{it.product_name}</div>
                <div className="row">
                  <span>{fmtQty(it.qty)} {it.unit_name || 'pcs'} × {rupiah(it.unit_price)}</span>
                  <span>{it.is_free ? 'GRATIS' : rupiah(it.subtotal)}</span>
                </div>
              </div>
            ))}
            <div className="dashed" />
            <div className="row"><span>Subtotal</span><span>{rupiah(sale.subtotal)}</span></div>
            {+sale.discount_total > 0 && <div className="row"><span>Diskon</span><span>-{rupiah(sale.discount_total)}</span></div>}
            {+sale.tax > 0 && <div className="row"><span>Pajak</span><span>{rupiah(sale.tax)}</span></div>}
            <div className="row" style={{ fontWeight: 700, fontSize: '1.15em' }}><span>TOTAL</span><span>{rupiah(sale.total)}</span></div>
            <div className="row"><span>{sale.payment_method.toUpperCase()}</span><span>{rupiah(sale.total_paid)}</span></div>
            {+sale.debt_amount > 0 && (
              <>
                <div className="row"><span>Hutang</span><span>{rupiah(sale.debt_amount)}</span></div>
                {sale.receivables?.[0]?.due_date && <div className="row"><span>Jatuh tempo</span><span>{fmtDate(sale.receivables[0].due_date)}</span></div>}
              </>
            )}
            <div className="dashed" />
            <div className="center" style={{ fontSize: '0.85em' }}>Terima kasih atas kunjungan Anda!</div>
            <div className="center" style={{ fontSize: '0.8em' }}>Barang yang sudah dibeli tidak dapat ditukar</div>
            <div className="center" style={{ marginTop: 3 }}>
              <Barcode value={sale.invoice_no} format="CODE128" width={1.2} height={28} displayValue={false} />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ================== HALAMAN POS ================== */
export default function POSPage() {
  const store = usePosStore();
  const user = useAuthStore((s) => s.user);
  const can = useAuthStore((s) => s.can);
  const canEditPrice = can('sales', 'edit');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [customers, setCustomers] = useState([]);
  const [branchList, setBranchList] = useState([]);
  const [branchId, setBranchId] = useState(user.branch_id || null);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [showHold, setShowHold] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSaleId, setLastSaleId] = useState(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [variantPicker, setVariantPicker] = useState(null); // {product, variants}

  const searchRef = useRef(null);
  const barcodeRef = useRef(null);
  const t = store.total();

  /* load produk, customer, cabang (user pusat harus pilih cabang) */
  useEffect(() => {
    if (!branchId && !branchList.length) {
      branchesApi.options().then((r) => { setBranchList(r.data); if (r.data.length) setBranchId(r.data[0].id); }).catch(() => {});
    }
    if (branchId) {
      productsApi.options(branchId).then((r) => { setProducts(r.data); setLoading(false); }).catch(() => setLoading(false));
    }
    customersApi.options().then((r) => setCustomers(r.data)).catch(() => {});
    masterOptions();
  }, [branchId]);

  const masterOptions = async () => {
    try {
      const res = await fetch('/api/categories/options', { headers: { Authorization: `Bearer ${useAuthStore.getState().token}` } });
      const j = await res.json();
      setCategories(j.data || []);
    } catch { /* noop */ }
  };

  /* harga sesuai tipe customer */
  const priceFor = (p, customer) => {
    if (customer?.type === 'member' && +p.member_price > 0) return +p.member_price;
    if (customer?.type === 'grosir' && +p.wholesale_price > 0) return +p.wholesale_price;
    return +p.retail_price || +p.units?.[0]?.price || 0;
  };

  const filtered = useMemo(() => {
    let list = products;
    if (catFilter) list = list.filter((p) => p.category_id === +catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.barcode || '').includes(q)
      );
    }
    return list;
  }, [products, search, catFilter]);

  const addProduct = useCallback((p, unitId = null, qty = 1, variant = null) => {
    const units = p.units || [];
    const unit = units.find((u) => u.id === unitId) || units.find((u) => u.is_base) || units[0] || { unit_id: null, unit_name: 'pcs', conversion_factor: 1, price: p.retail_price };
    const isBase = units.find((u) => u.is_base);
    const useTypePrice = isBase && unit.id === isBase.id && (store.customer?.type === 'member' || store.customer?.type === 'grosir');
    const price = useTypePrice ? priceFor(p, store.customer) : (+unit.price || priceFor(p, store.customer));
    const finalPrice = variant ? (+price + +variant.price_adjust) : price;
    store.addItem({
      productId: p.id, code: p.code, name: variant ? `${p.name} (${variant.name})` : p.name,
      variant_id: variant?.id || null, variant_name: variant?.name || null,
      unit_id: unit.unit_id, unit_name: unit.unit_short || 'pcs', unit_factor: +unit.conversion_factor,
      price: finalPrice, discount: 0, stockQty: +p.stock_qty || 0,
    }, qty);
    toast.success(variant ? `${p.name} — ${variant.name} ditambahkan` : `${p.name} ditambahkan`, { duration: 800 });
  }, [store, store.customer]);

  const handleBarcode = useCallback(async (code) => {
    const c = (code ?? barcodeInput).trim();
    if (!c) return;
    try {
      const res = await barcodeApi.scan(c);
      const p = res.data;
      const full = products.find((x) => x.id === p.id);
      if (p.is_variant) {
        // scan barcode varian: p.price sudah = base + adjust
        const base = full
          ? { ...full, units: (full.units || []).map((u) => (u.id === p.unit_id ? { ...u, price: p.price } : u)) }
          : { ...p, units: [{ unit_id: p.unit_id, unit_name: p.unit_short, conversion_factor: p.conversion_factor, price: p.price }] };
        addProduct({ ...base, retail_price: p.price }, p.unit_id, 1, { id: null, name: p.variant_name, price_adjust: 0 });
      } else {
        addProduct(full || { ...p, units: [{ unit_id: p.unit_id, unit_name: p.unit_short, conversion_factor: p.conversion_factor, price: p.price }] }, p.unit_id);
      }
      setBarcodeInput('');
    } catch (e) {
      toast.error(errMsg(e));
      setBarcodeInput('');
    }
  }, [barcodeInput, products, addProduct]);

  /* shortcut keyboard */
  useEffect(() => {
    const onKey = async (e) => {
      if (e.target.tagName === 'INPUT' && e.key !== 'Escape') {
        if (e.key === 'Enter' && e.target.id === 'pos-barcode') { e.preventDefault(); handleBarcode(barcodeInput); }
        return;
      }
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'F4') { e.preventDefault(); if (store.items.length) setShowPay(true); }
      if (e.key === 'F5') { e.preventDefault(); if (store.items.length) handleHold(); }
      if (e.key === 'F6') { e.preventDefault(); setShowHold(true); }
      if (e.key === 'F9') { e.preventDefault(); document.getElementById('pos-discount')?.focus(); }
      if (e.key === 'F12') { e.preventDefault(); if (await swalConfirm({ text: 'Kosongkan keranjang?', confirmText: 'Ya, Kosongkan', danger: true })) store.clear(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store.items.length, barcodeInput, handleBarcode]);

  const handleHold = async () => {
    try {
      await salesApi.hold({ ...store.payload(), branch_id: branchId, items: store.payload().items });
      toast.success('Transaksi di-hold');
      store.clear();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const handleRecall = async (h) => {
    const res = await salesApi.getHold(h.id);
    store.loadHeldItems(res.data);
    setShowHold(false);
    toast.success('Transaksi di-recall');
  };

  const rowTotal = (i) => (i.price * i.qty) - (i.discount || 0);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-3 no-print">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari barang... (F2)" className="input !pl-9"
          />
        </div>
        <input
          ref={barcodeRef} id="pos-barcode" value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleBarcode(); }}
          placeholder="Scan barcode..." className="input !w-48 font-mono" title="Fokus otomatis saat scan"
        />
        <button onClick={() => setShowScanner(true)} className="btn-secondary !px-3"><Camera size={17} /></button>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="input !w-44">
          <option value="">Semua Kategori</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {!user.branch_id && (
          <select value={branchId || ''} onChange={(e) => { setBranchId(+e.target.value); setCatFilter(''); }} className="input !w-52 !font-semibold !border-primary-400">
            {branchList.map((b) => <option key={b.id} value={b.id}>🏪 {b.name}</option>)}
          </select>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-5 gap-4 min-h-0">
        {/* ===== Grid produk ===== */}
        <div className="xl:col-span-3 overflow-y-auto pr-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => <div key={i} className="card h-32 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3">
              {filtered.map((p) => {
                const stock = +p.stock_qty || 0;
                const low = stock <= +p.min_stock;
                const hasVariants = p.has_variants && p.variants?.length > 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => (hasVariants ? setVariantPicker({ product: p, variants: p.variants }) : addProduct(p))}
                    className="card p-3 text-left hover:shadow-medium hover:border-primary-400 transition-all group disabled:opacity-40"
                    disabled={stock <= 0}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                        <Package size={19} />
                      </div>
                      <span className={`badge ${stock <= 0 ? 'bg-red-100 text-red-600' : low ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {stock <= 0 ? 'Habis' : `${fmtQty(stock)} stok`}
                      </span>
                    </div>
                    <div className="mt-2 text-sm font-semibold leading-snug line-clamp-2">{p.name}</div>
                    <div className="text-[11px] text-ink-400 font-mono">{p.code}</div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="text-primary-600 dark:text-primary-400 font-extrabold">{rupiah(+p.retail_price || 0)}</div>
                      {hasVariants && <span className="badge bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 !text-[10px]">{p.variants.length} varian</span>}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && <div className="col-span-full text-center py-14 text-ink-400 text-sm">Barang tidak ditemukan</div>}
            </div>
          )}
        </div>

        {/* ===== Keranjang ===== */}
        <div className="xl:col-span-2 card flex flex-col min-h-0">
          <div className="p-4 border-b border-ink-100 dark:border-ink-700 flex items-center justify-between no-print">
            <div className="flex items-center gap-2 font-bold">
              <ShoppingCart size={18} className="text-primary-600" /> Keranjang ({store.items.length})
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setShowHold(true)} className="btn-secondary !px-2.5 !py-1.5 text-xs" title="F6"><History size={14} /> Recall</button>
              <button onClick={handleHold} disabled={!store.items.length} className="btn-secondary !px-2.5 !py-1.5 text-xs" title="F5"><PauseCircle size={14} /> Hold</button>
              <button onClick={async () => { if (await swalConfirm({ text: 'Kosongkan keranjang?', confirmText: 'Ya, Kosongkan', danger: true })) store.clear(); }} className="btn-ghost !px-2.5 !py-1.5 text-xs text-danger" title="F12">
                <Trash2 size={14} /> Clear
              </button>
            </div>
          </div>

          {/* Customer */}
          <div className="relative px-4 pt-3 no-print">
            <button
              id="pos-customer-btn"
              onClick={() => setCustomerOpen(!customerOpen)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-dashed border-ink-200 dark:border-ink-600 text-sm hover:border-primary-400"
            >
              <span className="flex items-center gap-2">
                <UserIcon size={15} className="text-ink-400" />
                {store.customer ? <b>{store.customer.name}</b> : <span className="text-ink-400">Customer umum / pilih customer...</span>}
              </span>
              <span className="badge bg-ink-100 dark:bg-ink-700">{store.customer?.type || 'umum'}</span>
            </button>
            {customerOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setCustomerOpen(false)} />
                <div className="absolute z-20 left-4 right-4 top-full mt-1 card p-1.5 max-h-56 overflow-y-auto shadow-medium">
                  <button onClick={() => { store.setCustomer(null); setCustomerOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-ink-50 dark:hover:bg-ink-700">
                    Customer Umum
                  </button>
                  {customers.map((c) => (
                    <button key={c.id} onClick={() => { store.setCustomer({ id: c.id, name: c.name, type: c.type }); setCustomerOpen(false); }} className="w-full flex justify-between items-center px-3 py-2 rounded-lg text-sm hover:bg-ink-50 dark:hover:bg-ink-700">
                      <span>{c.name}</span>
                      <span className="badge bg-ink-100 dark:bg-ink-700">{c.type}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Daftar item */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {store.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-ink-300 dark:text-ink-500 gap-2">
                <ShoppingCart size={40} />
                <p className="text-sm">Keranjang kosong — scan atau klik barang</p>
              </div>
            ) : store.items.map((i, idx) => (
              <div key={`${i.productId}-${i.unit_id}-${idx}`} className={`p-2.5 rounded-xl border ${i.is_free ? 'border-success/40 bg-success/5' : 'border-ink-100 dark:border-ink-700'} animate-slide-up`}>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                      {i.name}
                      {i.is_free && <span className="badge bg-success text-white !text-[10px]">FREE</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <select
                        value={i.unit_id || ''}
                        onChange={(e) => {
                          const u = products.find((p) => p.id === i.productId)?.units?.find((x) => x.id === +e.target.value);
                          if (u) store.updateItem(idx, { unit_id: u.id, unit_name: u.unit_short, unit_factor: +u.conversion_factor, price: +u.price });
                        }}
                        className="input !w-20 !px-2 !py-1 !text-xs"
                      >
                        {products.find((p) => p.id === i.productId)?.units?.map((u) => (
                          <option key={u.id} value={u.id}>{u.unit_short}</option>
                        ))}
                      </select>
                      {canEditPrice && !i.is_free && (
                        <input
                          type="number" value={i.price} onChange={(e) => store.updatePrice(idx, e.target.value)}
                          className="input !w-24 !px-2 !py-1 !text-xs !font-bold" title="Edit harga"
                        />
                      )}
                      {!canEditPrice && !i.is_free && <span className="text-xs font-bold">{rupiah(i.price)}</span>}
                      {canEditPrice && !i.is_free && (
                        <input
                          id="pos-discount" type="number" value={i.discount || ''} placeholder="Diskon"
                          onChange={(e) => store.updateDiscount(idx, e.target.value)}
                          className="input !w-20 !px-2 !py-1 !text-xs" title="Diskon per item (F9)"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => store.updateQty(idx, i.qty - 1)} className="btn-secondary !p-1.5"><Minus size={13} /></button>
                    <span className="w-9 text-center font-bold text-sm">{fmtQty(i.qty)}</span>
                    <button onClick={() => store.updateQty(idx, i.qty + 1)} className="btn-secondary !p-1.5"><Plus size={13} /></button>
                  </div>
                  <div className="w-24 text-right">
                    <div className="text-sm font-extrabold">{i.is_free ? 'GRATIS' : rupiah(rowTotal(i))}</div>
                  </div>
                  <button onClick={() => store.removeItem(idx)} className="text-ink-300 hover:text-danger"><X size={15} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Ringkasan + bayar */}
          <div className="border-t border-ink-100 dark:border-ink-700 p-4 space-y-2 no-print">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-400">Subtotal</span>
              <span>{rupiah(t.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-400 flex items-center gap-1"><Percent size={13} /> Diskon transaksi</span>
              <input
                type="number" value={store.transDiscount || ''} onChange={(e) => store.setTransDiscount(e.target.value)}
                className="input !w-28 !px-2 !py-1 !text-right" placeholder="0"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-400">Pajak (%)</span>
              <input
                type="number" value={store.taxRate || ''} onChange={(e) => store.setTaxRate(e.target.value)}
                className="input !w-28 !px-2 !py-1 !text-right" placeholder="0"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="font-bold">TOTAL</span>
              <span className="text-2xl font-extrabold text-primary-600 dark:text-primary-400">{rupiah(t.total)}</span>
            </div>
            <button
              onClick={() => setShowPay(true)}
              disabled={!store.items.length}
              className="btn-primary w-full !py-3.5 !text-base" title="F4"
            >
              <Banknote size={19} /> Bayar Sekarang
            </button>
            <div className="text-center text-[11px] text-ink-400">
              F2 cari • F4 bayar • F5 hold • F6 recall • F9 diskon • F12 clear
            </div>
          </div>
        </div>
      </div>

      <ScannerModal open={showScanner} onClose={() => setShowScanner(false)} onScanned={(code) => {
        handleBarcode(code);
      }} />
      <HoldModal open={showHold} onClose={() => setShowHold(false)} onRecall={handleRecall} />
      <PaymentModal open={showPay} onClose={() => setShowPay(false)} branchId={branchId} onSuccess={(id) => { setLastSaleId(id); setShowReceipt(true); }} />
      <ReceiptModal open={showReceipt} onClose={() => setShowReceipt(false)} saleId={lastSaleId} />

      {/* ===== Modal pilih varian ===== */}
      <Modal open={!!variantPicker} onClose={() => setVariantPicker(null)} title={variantPicker ? `Pilih Varian — ${variantPicker.product.name}` : ''} size="sm">
        {variantPicker && (
          <div className="space-y-2">
            {variantPicker.variants.map((v) => {
              const basePrice = priceFor(variantPicker.product, store.customer);
              const vPrice = +basePrice + +v.price_adjust;
              return (
                <button
                  key={v.id}
                  onClick={() => { addProduct(variantPicker.product, null, 1, v); setVariantPicker(null); }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-ink-100 dark:border-ink-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-left"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{v.name}</div>
                    <div className="text-[11px] text-ink-400 font-mono truncate">{v.sku || v.barcode}</div>
                  </div>
                  <div className="text-sm font-bold text-primary-600 dark:text-primary-400 ml-3">{rupiah(vPrice)}</div>
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
