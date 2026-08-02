import { useEffect, useMemo, useState } from 'react';
import toast from '../utils/toast';
import Barcode from 'react-barcode';
import { Printer, Plus, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Field, { SearchInput } from '../components/Field';
import { productsApi, barcodeApi } from '../api';
import { errMsg } from '../api/client';
import { rupiah } from '../utils/format';

const SIZES = {
  '58x25': { label: '58×25mm (Struk)', cls: 'label-58x25' },
  '58x40': { label: '58×40mm (Struk besar)', cls: 'label-58x40' },
  '100x50': { label: '100×50mm (Label)', cls: 'label-100x50' },
};

export default function BarcodePage() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [qty, setQty] = useState(2);
  const [size, setSize] = useState('58x40');
  const [showName, setShowName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    productsApi.list({ limit: 100, status: 'active' }).then((r) => setProducts(r.data));
  }, []);

  const filtered = useMemo(() => products.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())), [products, search]);

  const toggle = (p) => {
    setSelected((prev) => prev.some((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : [...prev, p]);
  };

  const generate = async () => {
    if (!selected.length) return toast.error('Pilih minimal 1 barang');
    setLoading(true);
    try {
      const res = await barcodeApi.labels(selected.map((p) => p.id), true);
      const flat = [];
      res.data.forEach((p) => {
        p.labels.forEach((l) => {
          if (!l.barcode) return;
          for (let i = 0; i < qty; i++) flat.push(l);
        });
      });
      setLabels(flat);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const doPrint = () => window.print();

  return (
    <div className="no-print">
      <PageHeader title="Cetak Barcode Manual" subtitle="Pilih barang → tentukan jumlah label → pilih ukuran → preview → cetak massal"
        actions={<button className="btn-primary" onClick={doPrint} disabled={!labels.length}><Printer size={17} /> Cetak ({labels.length} label)</button>} />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-bold mb-3">1. Pilih Barang</h3>
            <SearchInput value={search} onChange={setSearch} placeholder="Cari barang..." className="mb-3" />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filtered.map((p) => (
                <label key={p.id} className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-sm border ${selected.some((x) => x.id === p.id) ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-transparent hover:bg-ink-50 dark:hover:bg-ink-700/40'}`}>
                  <input type="checkbox" checked={selected.some((x) => x.id === p.id)} onChange={() => toggle(p)} className="w-4 h-4 rounded accent-primary-600" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="font-mono text-[11px] text-ink-400">{p.barcode || 'belum ada barcode'}</div>
                  </div>
                  <span className="text-xs font-bold">{rupiah(p.retail_price)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="card p-4 space-y-3">
            <h3 className="font-bold">2. Pengaturan Label</h3>
            <Field label="Jumlah Label per Barcode">
              <input type="number" min={1} max={100} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(100, +e.target.value)))} className="input" />
            </Field>
            <Field label="Ukuran Label">
              <select value={size} onChange={(e) => setSize(e.target.value)} className="input">
                {Object.entries(SIZES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} className="w-4 h-4 rounded" /> Tampilkan nama barang</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} className="w-4 h-4 rounded" /> Tampilkan harga</label>
            <button className="btn-primary w-full" onClick={generate} disabled={loading}>
              <Plus size={16} /> {loading ? 'Memproses...' : 'Generate Preview'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">3. Preview</h3>
              {labels.length > 0 && (
                <button onClick={() => setLabels([])} className="btn-ghost !px-2.5 !py-1.5 text-xs text-danger"><X size={14} /> Kosongkan</button>
              )}
            </div>
            {labels.length === 0 ? (
              <div className="py-20 text-center text-ink-400 text-sm">Belum ada label — pilih barang lalu generate</div>
            ) : (
              <div id="print-area">
                <div className={`label-grid ${SIZES[size].cls === 'label-58x25' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {labels.map((l, i) => (
                    <div key={i} className={`barcode-label ${SIZES[size].cls}`}>
                      {showName && <div className="font-semibold leading-tight">{l.label}</div>}
                      <Barcode value={l.barcode} format="CODE128" width={1} height={size === '100x50' ? 34 : 22} displayValue={false} margin={0} />
                      <div className="font-mono font-bold tracking-wider">{l.barcode}</div>
                      {showPrice && <div className="font-bold">Rp {Number(l.price).toLocaleString('id-ID')}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
