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
    <div className="min-h-screen flex">
      {/* Panel kiri */}
      <div className="hidden lg:flex w-1/2 bg-ink-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-600/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-secondary-500/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary-600 flex items-center justify-center font-black">LP</div>
          <span className="text-2xl font-extrabold">Luna<span className="text-primary-400">POS</span></span>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight">
            Kasir super cepat.<br />Stok selalu terkontrol.
          </h1>
          <p className="text-ink-300 max-w-md leading-relaxed">
            Sistem POS & Inventory multi-cabang: scan barcode, promo otomatis, stok opname,
            laporan harian-bulanan-tahunan — semua dalam satu aplikasi.
          </p>
          <div className="flex gap-3">
            {['Scan Barcode', 'Promo B2G1', 'Multi Cabang', 'Struk Thermal'].map((f) => (
              <span key={f} className="badge bg-white/10 text-ink-100 !px-3 !py-1.5">{f}</span>
            ))}
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-ink-400 text-sm">
          <ShoppingCart size={15} /> © 2026 LunaPOS — React + Express + MySQL
        </div>
      </div>

      {/* Panel form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-ink-50 dark:bg-ink-900">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-black">LP</div>
            <span className="text-xl font-extrabold text-ink-800 dark:text-ink-100">Luna<span className="text-primary-600">POS</span></span>
          </div>
          <h2 className="text-2xl font-extrabold text-ink-800 dark:text-ink-100">Masuk ke akun Anda</h2>
          <p className="text-sm text-ink-400 mt-1 mb-6">Gunakan akun sesuai peran Anda (Kasir / Manager / Admin)</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input {...register('username')} className="input !pl-9" placeholder="username" autoFocus />
              </div>
              {errors.username && <p className="text-xs text-danger mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input {...register('password')} type={showPass ? 'text' : 'password'} className="input !pl-9 !pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
              {loading ? 'Memproses...' : (<><LogIn size={18} /> Masuk</>)}
            </button>
          </form>

          <div className="mt-6 p-3.5 rounded-xl bg-ink-100 dark:bg-ink-800 text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
            <div className="font-bold mb-1 text-ink-600 dark:text-ink-300">Akun demo (password: <code>password123</code>)</div>
            <code>admin</code> Super Admin • <code>pusat</code> Admin Pusat • <code>manager</code> Manager Cabang<br />
            <code>kasir1</code> Kasir Jakarta • <code>kasir2</code> Kasir Bandung • <code>gudang</code> Gudang
          </div>
        </div>
      </div>
    </div>
  );
}
