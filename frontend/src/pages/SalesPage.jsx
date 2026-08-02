import { useEffect, useMemo, useState } from 'react';
import toast from '../utils/toast';
import { swalConfirm } from '../utils/confirm';
import { Receipt, Ban, Wallet, Printer } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Field, { SearchInput } from '../components/Field';
import PageHeader from '../components/PageHeader';
import { salesApi, customersApi } from '../api';
import { errMsg } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { rupiah, fmtDate, fmtQty, periodPresets, today } from '../utils/format';

export default function SalesPage() {
  const can = useAuthStore((s) => s.can);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [method, setMethod] = useState('');
  const [detail, setDetail] = useState(null);
  const [payRec, setPayRec] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [customers, setCustomers] = useState([]);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await salesApi.list({ page: p, search, from, to, payment_method: method, limit: 15 });
      setData(res.data);
      setMeta(res.meta);
      setSummary(res.meta.summary);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(page); }, [page, search, from, to, method]);

  const openDetail = async (row) => {
    const res = await salesApi.get(row.id);
    setDetail(res.data);
  };

  const columns = useMemo(() => [
    { header: 'Invoice', accessorKey: 'invoice_no', cell: (c) => <span className="font-mono text-xs font-bold">{c.getValue()}</span> },
    { header: 'Waktu', accessorKey: 'created_at', cell: (c) => <span className="text-xs">{fmtDate(c.getValue(), true)}</span> },
    { header: 'Kasir', accessorKey: 'cashier_name' },
    { header: 'Customer', accessorKey: 'customer_name', cell: (c) => c.getValue() || <span className="text-ink-400">Umum</span> },
    { header: 'Metode', accessorKey: 'payment_method', cell: (c) => <span className="badge bg-ink-100 dark:bg-ink-700 uppercase">{c.getValue()}</span> },
    { header: 'Total', accessorKey: 'total', cell: (c) => <span className="font-extrabold">{rupiah(c.getValue())}</span> },
    { header: 'Hutang', accessorKey: 'debt_amount', cell: (c) => +c.getValue() > 0 ? <span className="badge bg-amber-100 text-amber-600">{rupiah(c.getValue())}</span> : '-' },
    {
      header: 'Aksi', accessorKey: 'id',
      cell: (c) => (
        <div className="flex gap-1">
          <button className="btn-ghost !p-1.5" title="Detail" onClick={() => openDetail(c.row.original)}><Receipt size={15} /></button>
          {can('sales', 'edit') && (
            <button className="btn-ghost !p-1.5 text-danger" title="Void" onClick={async () => {
              if (await swalConfirm({ title: 'Batalkan Transaksi?', text: `${c.row.original.invoice_no} akan dibatalkan dan stok dikembalikan.`, confirmText: 'Ya, Batalkan', danger: true })) {
                try { await salesApi.void(c.row.original.id); toast.success('Transaksi dibatalkan'); load(page); } catch (e) { toast.error(errMsg(e)); }
              }
            }}><Ban size={15} /></button>
          )}
        </div>
      ),
    },
  ], [can, page]);

  return (
    <div>
      <PageHeader title="Riwayat Penjualan" subtitle={summary ? `${rupiah(summary.total_sum)} • ${summary.total} transaksi` : ''} />
      <div className="flex flex-wrap gap-2 mb-4">
        <Field label="Dari" className="!mb-0"><input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="input !w-40" /></Field>
        <Field label="Sampai" className="!mb-0"><input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="input !w-40" /></Field>
        <Field label="Metode" className="!mb-0">
          <select value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }} className="input !w-36">
            <option value="">Semua</option>
            <option value="cash">Cash</option>
            <option value="transfer">Transfer</option>
            <option value="qris">QRIS</option>
            <option value="debt">Hutang</option>
          </select>
        </Field>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari invoice / customer..." className="w-64" />
        {periodPresets.filter((p) => p.key !== 'custom').map((p) => (
          <button key={p.key} className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => {
            const now = new Date();
            if (p.key === 'today') { setFrom(today()); setTo(today()); }
            if (p.key === 'yesterday') { const d = new Date(now); d.setDate(d.getDate() - 1); const s = d.toISOString().slice(0, 10); setFrom(s); setTo(s); }
            if (p.key === 'this_week') { const day = (now.getDay() + 6) % 7; const s = new Date(now); s.setDate(now.getDate() - day); setFrom(s.toISOString().slice(0, 10)); setTo(today()); }
            if (p.key === 'this_month') { setFrom(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)); setTo(today()); }
            if (p.key === 'this_year') { setFrom(`${now.getFullYear()}-01-01`); setTo(today()); }
            setPage(1);
          }}>{p.label}</button>
        ))}
      </div>
      <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={setPage} />

      {/* Detail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`${detail?.invoice_no || ''} — ${detail ? fmtDate(detail.created_at, true) : ''}`} size="lg" footer={
        <>
          <button className="btn-secondary" onClick={() => setDetail(null)}>Tutup</button>
          <button className="btn-primary" onClick={() => window.print()}><Printer size={15} /> Cetak</button>
        </>
      }>
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-ink-50 dark:bg-ink-900"><div className="text-xs text-ink-400">Kasir</div><div className="font-semibold text-sm">{detail.cashier_name}</div></div>
              <div className="p-2.5 rounded-xl bg-ink-50 dark:bg-ink-900"><div className="text-xs text-ink-400">Customer</div><div className="font-semibold text-sm">{detail.customer_name || 'Umum'}</div></div>
              <div className="p-2.5 rounded-xl bg-ink-50 dark:bg-ink-900"><div className="text-xs text-ink-400">Metode</div><div className="font-semibold text-sm uppercase">{detail.payment_method}</div></div>
              <div className="p-2.5 rounded-xl bg-ink-50 dark:bg-ink-900"><div className="text-xs text-ink-400">Status</div><div className="font-semibold text-sm">{detail.status}</div></div>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="bg-ink-50 dark:bg-ink-900/60"><th className="th">Barang</th><th className="th text-center">Qty</th><th className="th text-right">Harga</th><th className="th text-right">Diskon</th><th className="th text-right">Subtotal</th></tr></thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
                {detail.items.map((it) => (
                  <tr key={it.id} className={it.is_free ? 'bg-success/5' : ''}>
                    <td className="td">{it.product_name} {it.is_free && <span className="badge bg-success text-white !text-[10px]">FREE</span>}</td>
                    <td className="td text-center">{fmtQty(it.qty)} {it.unit_name}</td>
                    <td className="td text-right">{rupiah(it.unit_price)}</td>
                    <td className="td text-right">{it.discount ? rupiah(it.discount) : '-'}</td>
                    <td className="td text-right font-semibold">{it.is_free ? 'GRATIS' : rupiah(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end">
              <div className="w-56 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-ink-400">Subtotal</span><span>{rupiah(detail.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-ink-400">Diskon</span><span>-{rupiah(detail.discount_total)}</span></div>
                <div className="flex justify-between"><span className="text-ink-400">Pajak</span><span>{rupiah(detail.tax)}</span></div>
                <div className="flex justify-between font-extrabold text-base"><span>TOTAL</span><span>{rupiah(detail.total)}</span></div>
                <div className="flex justify-between"><span className="text-ink-400">Dibayar</span><span>{rupiah(detail.total_paid)}</span></div>
                {+detail.debt_amount > 0 && (
                  <div className="flex justify-between text-amber-600 font-bold"><span>Hutang</span><span>{rupiah(detail.debt_amount)}</span></div>
                )}
              </div>
            </div>
            {detail.receivables?.map((r) => (
              +r.amount - +r.paid_amount > 0 && (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                  <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                    <Wallet size={15} />
                    Piutang tersisa <b>{rupiah(+r.amount - +r.paid_amount)}</b> — jatuh tempo {fmtDate(r.due_date)}
                  </div>
                  <button className="btn-success !px-3 !py-1.5 text-xs" onClick={() => { setPayRec(r); setPayAmount(''); setPayMethod('cash'); }}>Bayar</button>
                </div>
              )
            ))}
          </div>
        )}
      </Modal>

      {/* Bayar piutang */}
      <Modal open={!!payRec} onClose={() => setPayRec(null)} title="Bayar Piutang" size="sm" footer={
        <>
          <button className="btn-secondary" onClick={() => setPayRec(null)}>Batal</button>
          <button className="btn-primary" onClick={async () => {
            try {
              await salesApi.payReceivable(payRec.id, { amount: +payAmount, method: payMethod });
              toast.success('Pembayaran piutang dicatat');
              setPayRec(null);
              openDetail(detail);
            } catch (e) { toast.error(errMsg(e)); }
          }}>Bayar</button>
        </>
      }>
        <div className="space-y-3">
          <div className="text-center p-3 bg-ink-50 dark:bg-ink-900 rounded-xl">
            <div className="text-xs text-ink-400">Sisa Piutang</div>
            <div className="text-xl font-extrabold text-amber-600">{rupiah(payRec ? +payRec.amount - +payRec.paid_amount : 0)}</div>
          </div>
          <Field label="Jumlah"><input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="input" /></Field>
          <Field label="Metode">
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="input">
              <option value="cash">Cash</option>
              <option value="transfer">Transfer</option>
              <option value="qris">QRIS</option>
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
