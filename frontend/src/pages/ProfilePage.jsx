import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from '../utils/toast';
import { authApi } from '../api';
import { errMsg } from '../api/client';
import { useAuthStore } from '../stores/auth';
import PageHeader from '../components/PageHeader';
import Field from '../components/Field';

const schema = z.object({
  old_password: z.string().min(1, 'Password lama wajib'),
  new_password: z.string().min(6, 'Minimal 6 karakter'),
  confirm: z.string(),
}).refine((d) => d.new_password === d.confirm, { path: ['confirm'], message: 'Konfirmasi tidak cocok' });

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (d) => {
    try {
      await authApi.changePassword({ old_password: d.old_password, new_password: d.new_password });
      toast.success('Password berhasil diubah');
      reset();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="max-w-lg">
      <PageHeader title="Profil & Password" subtitle={`${user?.full_name} • ${user?.role_name}`} />
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm pb-4 border-b border-ink-100 dark:border-ink-700">
          <div><div className="text-ink-400">Username</div><div className="font-semibold">{user?.username}</div></div>
          <div><div className="text-ink-400">Cabang</div><div className="font-semibold">{user?.branch_name || 'Pusat'}</div></div>
        </div>
        <Field label="Password Lama" required>
          <input type="password" {...register('old_password')} className="input" />
          {errors.old_password && <p className="text-xs text-danger mt-1">{errors.old_password.message}</p>}
        </Field>
        <Field label="Password Baru" required>
          <input type="password" {...register('new_password')} className="input" />
          {errors.new_password && <p className="text-xs text-danger mt-1">{errors.new_password.message}</p>}
        </Field>
        <Field label="Konfirmasi Password" required>
          <input type="password" {...register('confirm')} className="input" />
          {errors.confirm && <p className="text-xs text-danger mt-1">{errors.confirm.message}</p>}
        </Field>
        <button type="submit" className="btn-primary w-full">Simpan Password</button>
      </form>
    </div>
  );
}
