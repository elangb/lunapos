import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from '../utils/toast';
import { Play, Square, Plus, Wallet } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Field from '../components/Field';
import PageHeader from '../components/PageHeader';
import { cashApi } from '../api';
import { errMsg } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { rupiah, fmtDate, today, typeLabels } from '../utils/format';

const txnSchema = z.object({
  type: z.enum(['in', 'out', 'setor', 'tarik']),
  amount: z.coerce.number().positive('Jumlah wajib > 0'),
  note: z.string().optional(),
});

export default function CashPage() {
  const can = useAuthStore((s) => s.can);
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState('transactions');
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [shiftsMeta, setShiftsMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [type, setType] = useState('');
  const [currentShift, setCurrentShift] = useState(null);
  const [showTxn, setShowTxn] = useState(false);
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [closeInfo, setCloseInfo] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(txnSchema) });

  const loadShift = () => cashApi.currentShift().then((r) => setCurrentShift(r.data)).catch(() => {});
  useEffect(() => { loadShift(); }, []);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      if (tab === 'transactions') {
        const res = await cashApi.transactions({ page: p, from, to, type, limit: 15 });
        setData(res.data); setMeta(res.meta); setSummary(res.meta.summary);
      } else {
        const res = await cashApi.shifts({ page: p, limit: 15 });
        setShifts(res.data); setShiftsMeta(res.meta);
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(page); }, [tab, page, from, to, type]);

  const onSubmitTxn = async (d) => {
    try {
      await cashApi.createTransaction(d);
      toast.success('Transaksi kas dicatat');
      setShowTxn(false); reset();
      load(page); loadShift();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const openShift = async (d) => {
    try {
      await cashApi.openShift({ opening_cash: +d.opening_cash || 0, note: d.note });
      toast.success('Shift dibuka');
      setShowOpen(false);
      loadShift();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const closeShift = async (d) => {
    try {
      const res = await cashApi.closeShift(currentShift.id, { physical_cash: +d.physical_cash, note: d.note });
      toast.success('Shift ditutup');
      setShowClose(false);
      loadShift(); load(page);
      setCloseInfo(res.data);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const txnColumns = useMemo(() => [
    { header: 'Waktu', accessorKey: 'created_at', cell: (c) => <span className="text-xs">{fmtDate(c.getValue(), true)}</span> },
    { header: 'Tipe', accessorKey: 'type', cell: (c) => {
        const inflow = ['sale', 'in', 'tarik', 'debt_payment', 'receivable_payment', 'open_balance'].includes(c.getValue());
        return <span className={`badge ${inflow ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{typeLabels[c.getValue()] || c.getValue()}</span>;
      } },
    { header: 'Jumlah', accessorKey: 'amount', cell: (c) => {
        const inflow = ['sale', 'in', 'tarik', 'debt_payment', 'receivable_payment', 'open_balance'].includes(c.row.original.type);
        return <span className={`font-extrabold ${inflow ? 'text-success' : 'text-danger'}`}>{inflow ? '+' : '-'}{rupiah(c.getValue())}</span>;
      } },
    { header: 'Keterangan', accessorKey: 'note', cell: (c) => <span className="text-xs">{c.getValue() || '-'}</span> },
    { header: 'Oleh', accessorKey: 'user_name', cell: (c) => <span className="text-xs">{c.getValue()}</span> },
  ], []);

  const shiftColumns = useMemo(() => [
    { header: 'Kasir', accessorKey: 'user_name', cell: (c) => <div><div className="font-semibold">{c.getValue()}</div><div className="text-xs text-ink-400">{c.row.original.branch_name}</div></div> },
    { header: 'Buka', accessorKey: 'opened_at', cell: (c) => <span className="text-xs">{fmtDate(c.getValue(), true)}</span> },
    { header: 'Tutup', accessorKey: 'closed_at', cell: (c) => c.getValue() ? <span className="text-xs">{fmtDate(c.getValue(), true)}</span> : <span className="badge bg-emerald-100 text-emerald-600">Aktif</span> },
    { header: 'Saldo Awal', accessorKey: 'opening_cash', cell: (c) => rupiah(c.getValue()) },
    { header: 'Harapan', accessorKey: 'expected_cash', cell: (c) => c.getValue() !== null ? rupiah(c.getValue()) : '-' },
    { header: 'Fisik', accessorKey: 'physical_cash', cell: (c) => c.getValue() !== null ? rupiah(c.getValue()) : '-' },
    { header: 'Selisih', accessorKey: 'difference', cell: (c) => c.getValue() !== null ? <span className={`font-bold ${+c.getValue() === 0 ? 'text-success' : 'text-danger'}`}>{rupiah(c.getValue())}</span> : '-' },
    { header: 'Status', accessorKey: 'status', cell: (c) => <span className={`badge ${c.getValue() === 'open' ? 'bg-emerald-100 text-emerald-600' : 'bg-ink-100 text-ink-400'}`}>{c.getValue()}</span> },
  ], []);

  return (
    <div>
      <PageHeader
        title="Kas & Shift Kasir"
        subtitle={summary ? `Masuk ${rupiah(summary.total_in)} • Keluar ${rupiah(summary.total_out)} • Saldo ${rupiah(summary.balance)}` : ''}
        actions={
          <>
            {!currentShift ? (
              can('shifts', 'create') && <button className="btn-success" onClick={() => setShowOpen(true)}><Play size={16} /> Buka Shift</button>
            ) : (
              <>
                <span className="badge bg-emerald-100 text-emerald-600 !px-3 !py-1.5">Shift #{currentShift.id} aktif</span>
                {can('shifts', 'edit') && <button className="btn-danger" onClick={() => setShowClose(true)}><Square size={15} /> Tutup Shift</button>}
              </>
            )}
            {can('cash', 'create') && <button className="btn-primary" onClick={() => setShowTxn(true)}><Plus size={16} /> Transaksi Kas</button>}
          </>
        }
      />

      <div className="flex gap-1 mb-4 p-1 bg-ink-100 dark:bg-ink-800 rounded-xl w-fit">
        {[['transactions', 'Transaksi Kas'], ['shifts', 'Shift Kasir']].map(([k, l]) => (
          <button key={k} onClick={() => { setTab(k); setPage(1); }} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === k ? 'bg-white dark:bg-ink-700 shadow-soft' : 'text-ink-400'}`}>{l}</button>
        ))}
      </div>

      {tab === 'transactions' && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Field label="Dari" className="!mb-0"><input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="input !w-40" /></Field>
          <Field label="Sampai" className="!mb-0"><input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="input !w-40" /></Field>
          <Field label="Tipe" className="!mb-0">
            <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="input !w-44">
              <option value="">Semua</option>
              <option value="sale">Penjualan</option>
              <option value="purchase">Pembelian</option>
              <option value="in">Kas Masuk</option>
              <option value="out">Kas Keluar</option>
              <option value="setor">Setor ke Pusat</option>
              <option value="tarik">Tarik Tunai</option>
              <option value="debt_payment">Bayar Hutang</option>
              <option value="receivable_payment">Bayar Piutang</option>
            </select>
          </Field>
        </div>
      )}
      <DataTable columns={tab === 'transactions' ? txnColumns : shiftColumns} data={tab === 'transactions' ? data : shifts} loading={loading} meta={tab === 'transactions' ? meta : shiftsMeta} onPageChange={setPage} />

      {/* Buka shift */}
      <Modal open={showOpen} onClose={() => setShowOpen(false)} title="Buka Shift" size="sm" footer={
        <>
          <button className="btn-secondary" onClick={() => setShowOpen(false)}>Batal</button>
          <button className="btn-success" onClick={handleSubmit(openShift)}><Play size={15} /> Buka Shift</button>
        </>
      }>
        <div className="space-y-3">
          <Field label="Saldo Awal (Rp)"><input type="number" defaultValue={0} {...register('opening_cash')} className="input" /></Field>
          <Field label="Catatan"><input {...register('note')} className="input" placeholder="Shift pagi" /></Field>
        </div>
      </Modal>

      {/* Tutup shift */}
      <Modal open={showClose} onClose={() => setShowClose(false)} title="Tutup Shift — Hitung Uang Fisik" size="sm" footer={
        <>
          <button className="btn-secondary" onClick={() => setShowClose(false)}>Batal</button>
          <button className="btn-danger" onClick={handleSubmit(closeShift)}><Square size={15} /> Tutup Shift</button>
        </>
      }>
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-ink-50 dark:bg-ink-900 text-sm flex justify-between"><span className="text-ink-400">Uang yang diharapkan</span><b>— dihitung otomatis dari transaksi</b></div>
          <Field label="Uang Fisik di Laci (Rp)" required>
            <input type="number" {...register('physical_cash', { required: 'Wajib diisi' })} className="input !text-lg !font-bold" autoFocus />
          </Field>
          {errors.physical_cash && <p className="text-xs text-danger">{errors.physical_cash.message}</p>}
          <Field label="Catatan"><input {...register('note')} className="input" placeholder="Selisih karena..." /></Field>
        </div>
      </Modal>

      {/* Hasil tutup shift */}
      <Modal open={!!closeInfo} onClose={() => setCloseInfo(null)} title="Shift Ditutup" size="sm" footer={<button className="btn-primary" onClick={() => setCloseInfo(null)}>OK</button>}>
        {closeInfo && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2.5 rounded-lg bg-ink-50 dark:bg-ink-900"><span className="text-ink-400">Uang Diharapkan</span><b>{rupiah(closeInfo.expected_cash)}</b></div>
            <div className="flex justify-between p-2.5 rounded-lg bg-ink-50 dark:bg-ink-900"><span className="text-ink-400">Uang Fisik</span><b>{rupiah(closeInfo.physical_cash)}</b></div>
            <div className={`flex justify-between p-2.5 rounded-lg ${+closeInfo.difference === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-red-50 dark:bg-red-900/20 text-danger'}`}>
              <span className="font-semibold">Selisih</span><b className="font-extrabold">{rupiah(closeInfo.difference)}</b>
            </div>
          </div>
        )}
      </Modal>

      {/* Transaksi kas manual */}
      <Modal open={showTxn} onClose={() => setShowTxn(false)} title="Transaksi Kas" size="sm" footer={
        <>
          <button className="btn-secondary" onClick={() => setShowTxn(false)}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit(onSubmitTxn)}><Wallet size={15} /> Simpan</button>
        </>
      }>
        <div className="space-y-3">
          <Field label="Tipe">
            <select {...register('type')} className="input">
              <option value="in">Kas Masuk</option>
              <option value="out">Kas Keluar</option>
              <option value="setor">Setor ke Pusat</option>
              <option value="tarik">Tarik Tunai</option>
            </select>
          </Field>
          <Field label="Jumlah (Rp)" required>
            <input type="number" {...register('amount')} className="input" />
            {errors.amount && <p className="text-xs text-danger mt-1">{errors.amount.message}</p>}
          </Field>
          <Field label="Keterangan"><input {...register('note')} className="input" /></Field>
        </div>
      </Modal>
    </div>
  );
}
