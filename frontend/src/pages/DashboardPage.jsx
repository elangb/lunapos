import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell,
} from 'recharts';
import {
  Banknote, Receipt, AlertTriangle, Wallet, TrendingUp, Users, Store, Package, ShoppingCart, ArrowRight,
} from 'lucide-react';
import { reportsApi } from '../api';
import { errMsg } from '../api/client';
import { useAuthStore } from '../stores/auth';
import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';
import { PageSkeleton } from '../components/Skeleton';
import { rupiah, fmtDate } from '../utils/format';

const COLORS = ['#2547eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const can = useAuthStore((s) => s.can);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsApi.dashboard();
      setData(res.data);
    } catch (e) {
      toastError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toastError = (e) => console.error(errMsg(e));
  if (loading || !data) return <PageSkeleton />;

  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const row = data.last7.find((r) => r.date === key);
    return { date: fmtDate(key).slice(0, 6), omzet: +(row?.total || 0) };
  });
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const last12 = [...Array(12)].map((_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (11 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const row = data.last12.find((r) => r.month === key);
    return { month: monthLabels[d.getMonth()], omzet: +(row?.total || 0) };
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Halo, ${user?.full_name?.split(' ')[0]} 👋`}
        subtitle={`Ringkasan ${user?.branch_name || 'seluruh cabang'} — ${fmtDate(new Date(), true)}`}
        actions={
          can('sales', 'create') && (
            <Link to="/pos" className="btn-primary"><ShoppingCart size={17} /> Buka Kasir</Link>
          )
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard title="Penjualan Hari Ini" value={rupiah(data.today.omzet)} icon={Banknote} color="primary" sub={`${data.today.transaksi} transaksi`} />
        <StatCard title="Laba Hari Ini" value={rupiah(data.today.laba)} icon={TrendingUp} color="success" sub="estimasi dari harga beli" />
        <StatCard title="Transaksi" value={data.today.transaksi} icon={Receipt} color="secondary" sub={`${data.cabang_aktif} cabang aktif`} />
        <StatCard title="Piutang Customer" value={rupiah(data.piutang)} icon={Wallet} color="warning" sub="belum dibayar" />
        <StatCard title="Hutang Supplier" value={rupiah(data.hutang)} icon={Wallet} color="danger" sub="belum dibayar" />
        <StatCard title="Stok Menipis" value={data.low_stock} icon={AlertTriangle} color="warning" sub="≤ stok minimum" />
        <StatCard title="Piutang Baru Hari Ini" value={rupiah(data.today.piutang_baru)} icon={Users} color="ink" sub="penjualan hutang" />
        <StatCard title="Cabang Aktif" value={data.cabang_aktif} icon={Store} color="primary" sub="beroperasi" />
      </div>

      {data.expiry && (data.expiry.expired.total > 0 || data.expiry.expiring.total > 0) && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${data.expiry.expired.total > 0 ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'}`}>
          <AlertTriangle size={22} className={data.expiry.expired.total > 0 ? 'text-danger' : 'text-amber-500'} />
          <div className="text-sm">
            <div className="font-bold text-ink-800 dark:text-ink-100">Perhatian: Produk Mendekati Kadaluarsa</div>
            <div className="text-ink-500 dark:text-ink-300">
              {data.expiry.expired.total > 0 && <span className="font-semibold text-danger">{data.expiry.expired.total} batch sudah kadaluarsa</span>}
              {data.expiry.expired.total > 0 && data.expiry.expiring.total > 0 && ' · '}
              {data.expiry.expiring.total > 0 && <span>{data.expiry.expiring.total} batch akan kadaluarsa dalam 30 hari</span>}
              {' '}— periksa di menu <Link to="/stock" className="underline font-semibold">Stok → Batch/Expired</Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold tracking-tight">Penjualan 7 Hari Terakhir</h3>
            <Link to="/reports" className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:gap-1.5 transition-all">Laporan <ArrowRight size={13} /></Link>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={last7}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b822" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`} axisLine={false} tickLine={false} width={44} />
              <Tooltip formatter={(v) => rupiah(v)} contentStyle={{ borderRadius: 12, border: '1px solid #eef1f6', boxShadow: '0 8px 24px -6px rgb(16 24 40 / 0.12)' }} />
              <Line type="monotone" dataKey="omzet" stroke="#2547eb" strokeWidth={2.5} dot={{ r: 3, fill: '#2547eb' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-bold mb-4 tracking-tight">Penjualan 12 Bulan</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={last12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b822" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`} axisLine={false} tickLine={false} width={44} />
              <Tooltip formatter={(v) => rupiah(v)} contentStyle={{ borderRadius: 12, border: '1px solid #eef1f6', boxShadow: '0 8px 24px -6px rgb(16 24 40 / 0.12)' }} />
              <Bar dataKey="omzet" fill="#2547eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-bold mb-4">Top 10 Produk Hari Ini</h3>
          {data.top_products.length === 0 ? (
            <p className="text-sm text-ink-400 py-8 text-center">Belum ada penjualan hari ini</p>
          ) : (
            <div className="space-y-3">
              {data.top_products.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-primary-600 text-white' : 'bg-ink-100 dark:bg-ink-700 text-ink-500'}`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    <div className="text-xs text-ink-400">{p.qty} pcs terjual</div>
                  </div>
                  <div className="text-sm font-bold">{rupiah(p.total)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-bold mb-4 tracking-tight">Top 5 Cabang Hari Ini</h3>
          {data.top_branches.length === 0 ? (
            <p className="text-sm text-ink-400 py-8 text-center">Belum ada data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.top_branches} dataKey="total" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {data.top_branches.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => rupiah(v)} contentStyle={{ borderRadius: 12, border: '1px solid #eef1f6', boxShadow: '0 8px 24px -6px rgb(16 24 40 / 0.12)' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {data.top_branches.map((b, i) => (
              <div key={b.id} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="truncate">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
