import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from '../utils/toast';
import { Eye, EyeOff, Lock, User, LogIn, ShoppingCart } from 'lucide-react';
import { authApi } from '../api';
import { errMsg } from '../api/client';
import { useAuthStore } from '../stores/auth';

const schema = z.object({
  username: z.string().min(1, 'Username wajib'),
  password: z.string().min(1, 'Password wajib'),
});

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { username: 'admin', password: 'password123' } });

  const onSubmit = async (d) => {
    setLoading(true);
    try {
      const res = await authApi.login(d);
      login(res.data.token, res.data.user);
      toast.success(`Selamat datang, ${res.data.user.full_name}!`);
      navigate('/');
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-ink-50 dark:bg-ink-950">
      {/* Panel kiri — brand */}
      <div className="hidden lg:flex w-[46%] bg-ink-950 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full bg-primary-600/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-secondary-600/25 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-white/5" />

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center font-black shadow-strong shadow-primary-600/40">LP</div>
          <div>
            <span className="text-2xl font-extrabold tracking-tight">Luna<span className="text-primary-400">POS</span></span>
            <div className="text-[10px] font-semibold text-ink-500 uppercase tracking-widest">Point of Sale & Inventory</div>
          </div>
        </div>

        <div className="relative space-y-7">
          <h1 className="text-[2.6rem] leading-[1.15] font-extrabold tracking-tight">
            Kasir super cepat.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">Stok selalu terkontrol.</span>
          </h1>
          <p className="text-ink-400 max-w-md leading-relaxed">
            Sistem POS & Inventory multi-cabang: scan barcode, promo otomatis, stok opname,
            laporan harian-bulanan-tahunan — semua dalam satu aplikasi.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Scan Barcode', 'Promo B2G1', 'Multi Cabang', 'Struk Thermal'].map((f) => (
              <span key={f} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-ink-300">{f}</span>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-ink-500 text-sm">
          <ShoppingCart size={15} /> © 2026 LunaPOS — React + Express + MySQL
        </div>
      </div>

      {/* Panel form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 text-white flex items-center justify-center font-black shadow-soft shadow-primary-600/30">LP</div>
            <div>
              <div className="text-xl font-extrabold tracking-tight text-ink-900 dark:text-ink-100">Luna<span className="text-primary-600">POS</span></div>
              <div className="text-[10px] font-semibold text-ink-400 uppercase tracking-widest">Point of Sale</div>
            </div>
          </div>

          <div className="mb-7">
            <h2 className="text-[1.7rem] font-extrabold tracking-tight text-ink-900 dark:text-ink-100">Selamat datang kembali 👋</h2>
            <p className="text-sm text-ink-400 mt-1.5">Masuk untuk mengelola kasir, stok, dan laporan Anda.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input {...register('username')} className="input !pl-10" placeholder="username" autoFocus />
              </div>
              {errors.username && <p className="text-xs text-danger mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input {...register('password')} type={showPass ? 'text' : 'password'} className="input !pl-10 !pr-11" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3 !rounded-xl">
              {loading ? 'Memproses...' : (<><LogIn size={18} /> Masuk</>)}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-2xl bg-ink-100/70 dark:bg-ink-900/70 border border-ink-200/60 dark:border-ink-800 text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
            <div className="font-bold mb-1.5 text-ink-600 dark:text-ink-300">Akun demo (password: <code>password123</code>)</div>
            <code className="text-primary-600 dark:text-primary-400 font-semibold">admin</code> Super Admin • <code className="text-primary-600 dark:text-primary-400 font-semibold">pusat</code> Admin Pusat • <code className="text-primary-600 dark:text-primary-400 font-semibold">manager</code> Manager Cabang<br />
            <code className="text-primary-600 dark:text-primary-400 font-semibold">kasir1</code> Kasir Jakarta • <code className="text-primary-600 dark:text-primary-400 font-semibold">kasir2</code> Kasir Bandung • <code className="text-primary-600 dark:text-primary-400 font-semibold">gudang</code> Gudang
          </div>
        </div>
      </div>
    </div>
  );
}
