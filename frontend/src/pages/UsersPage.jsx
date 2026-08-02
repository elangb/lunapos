import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from '../utils/toast';
import { swalConfirm, swalPrompt } from '../utils/confirm';
import { Plus, Pencil, Trash2, KeyRound, ShieldCheck } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Field, { SearchInput } from '../components/Field';
import PageHeader from '../components/PageHeader';
import { usersApi, branchesApi, authApi } from '../api';
import { errMsg } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { fmtDate } from '../utils/format';

const schema = z.object({
  username: z.string().min(3, 'Minimal 3 karakter'),
  full_name: z.string().min(1, 'Nama wajib'),
  role_id: z.coerce.number().min(1, 'Role wajib'),
  branch_id: z.coerce.number().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

const MENUS = ['dashboard', 'products', 'categories', 'brands', 'units', 'suppliers', 'customers', 'branches', 'users', 'sales', 'purchases', 'returns', 'transfers', 'opname', 'stock', 'cash', 'shifts', 'promotions', 'reports', 'barcode'];
const MENU_LABELS = {
  dashboard: 'Dashboard', products: 'Barang', categories: 'Kategori', brands: 'Merk', units: 'Satuan',
  suppliers: 'Supplier', customers: 'Customer', branches: 'Cabang', users: 'User', sales: 'Penjualan / POS',
  purchases: 'Pembelian', returns: 'Retur', transfers: 'Mutasi', opname: 'Stok Opname', stock: 'Stok',
  cash: 'Kas', shifts: 'Shift', promotions: 'Promo', reports: 'Laporan', barcode: 'Barcode',
};

export default function UsersPage() {
  const can = useAuthStore((s) => s.can);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [permRole, setPermRole] = useState(null);
  const [perms, setPerms] = useState([]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await usersApi.list({ page: p, search, limit: 15 });
      setData(res.data);
      setMeta(res.meta);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load(page);
    usersApi.roles().then((r) => setRoles(r.data));
    branchesApi.options().then((r) => setBranches(r.data));
  }, [page, search]);

  const openForm = (row = null) => {
    setEditing(row);
    reset(row ? { username: row.username, full_name: row.full_name, role_id: row.role_id, branch_id: row.branch_id || '', email: row.email || '', phone: row.phone || '' } : { username: '', full_name: '', role_id: 4, branch_id: '', email: '', phone: '' });
    setShowForm(true);
  };

  const onSubmit = async (d) => {
    try {
      if (editing) await usersApi.update(editing.id, d);
      else await usersApi.create(d);
      toast.success('User disimpan');
      setShowForm(false);
      load(page);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const openPerms = async (role) => {
    setPermRole(role);
    const res = await usersApi.getPermissions(role.id);
    setPerms(res.data);
  };

  const togglePerm = (menu, key) => {
    setPerms((prev) => prev.map((p) => (p.menu === menu ? { ...p, [key]: !p[key] } : p)));
  };

  const savePerms = async () => {
    try {
      await usersApi.updatePermissions(permRole.id, perms.map(({ menu, can_view, can_create, can_edit, can_delete }) => ({ menu, can_view, can_create, can_edit, can_delete })));
      toast.success('Hak akses disimpan');
      setPermRole(null);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const columns = useMemo(() => [
    { header: 'User', accessorKey: 'username', cell: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">{c.row.original.full_name.charAt(0)}</div>
          <div>
            <div className="font-semibold">{c.getValue()} {c.row.original.is_active ? '' : <span className="badge bg-ink-100 text-ink-400">nonaktif</span>}</div>
            <div className="text-xs text-ink-400">{c.row.original.full_name}</div>
          </div>
        </div>
      ) },
    { header: 'Role', accessorKey: 'role_name', cell: (c) => <span className="badge bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">{c.getValue()}</span> },
    { header: 'Cabang', accessorKey: 'branch_name', cell: (c) => c.getValue() || <span className="text-ink-400">Pusat</span> },
    { header: 'Kontak', accessorKey: 'email', cell: (c) => <span className="text-xs">{c.getValue() || '-'}</span> },
    { header: 'Login Terakhir', accessorKey: 'last_login_at', cell: (c) => c.getValue() ? fmtDate(c.getValue(), true) : '—' },
    {
      header: 'Aksi', accessorKey: 'id',
      cell: (c) => (
        <div className="flex gap-1">
          {can('users', 'edit') && (
            <>
              <button className="btn-ghost !p-1.5" title="Edit" onClick={() => openForm(c.row.original)}><Pencil size={15} /></button>
              <button className="btn-ghost !p-1.5" title="Reset password" onClick={async () => {
                const np = await swalPrompt({ title: 'Reset Password', text: 'Masukkan password baru (minimal 6 karakter):', inputValue: 'password123', inputPlaceholder: 'password baru', confirmText: 'Reset', validationMessage: 'Password wajib diisi' });
                if (np) {
                  try {
                    await authApi.resetPassword({ user_id: c.row.original.id, new_password: np });
                    toast.success('Password di-reset');
                  } catch (e) { toast.error(errMsg(e)); }
                }
              }}><KeyRound size={15} /></button>
            </>
          )}
          {can('users', 'delete') && (
            <button className="btn-ghost !p-1.5 text-danger" onClick={async () => {
              if (await swalConfirm({ text: `Nonaktifkan user "${c.row.original.username}"?`, confirmText: 'Ya, Nonaktifkan', danger: true })) {
                await usersApi.remove(c.row.original.id);
                toast.success('Dinonaktifkan'); load(page);
              }
            }}><Trash2 size={15} /></button>
          )}
        </div>
      ),
    },
  ], [can, page]);

  return (
    <div>
      <PageHeader title="User & Hak Akses" subtitle="Login, reset password, permission per menu per role"
        actions={can('users', 'create') && <button className="btn-primary" onClick={() => openForm()}><Plus size={17} /> Tambah User</button>} />
      <div className="flex flex-wrap gap-2 mb-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Cari user..." className="w-72" />
        <div className="flex gap-1.5 flex-wrap">
          {roles.map((r) => (
            <button key={r.id} onClick={() => openPerms(r)} className="btn-secondary !px-3 !py-1.5 text-xs" title="Atur hak akses role ini">
              <ShieldCheck size={13} /> {r.name}
            </button>
          ))}
        </div>
      </div>
      <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={setPage} />

      <Modal open={showForm} onClose={() => setShowForm(false)} title={`${editing ? 'Edit' : 'Tambah'} User`} size="md" footer={
        <>
          <button className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit(onSubmit)}>Simpan</button>
        </>
      }>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Username" required>
            <input {...register('username')} disabled={!!editing} className="input" />
            {errors.username && <p className="text-xs text-danger mt-1">{errors.username.message}</p>}
          </Field>
          <Field label="Nama Lengkap" required>
            <input {...register('full_name')} className="input" />
            {errors.full_name && <p className="text-xs text-danger mt-1">{errors.full_name.message}</p>}
          </Field>
          <Field label="Role" required>
            <select {...register('role_id')} className="input">
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Cabang">
            <select {...register('branch_id')} className="input">
              <option value="">Pusat (tanpa cabang)</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Email"><input {...register('email')} className="input" /></Field>
          <Field label="Telepon"><input {...register('phone')} className="input" /></Field>
          {!editing && <p className="text-xs text-ink-400 md:col-span-2">Password default: <code>password123</code> — user dapat mengganti sendiri.</p>}
        </div>
      </Modal>

      <Modal open={!!permRole} onClose={() => setPermRole(null)} title={`Hak Akses: ${permRole?.name}`} size="xl" footer={
        <>
          <button className="btn-secondary" onClick={() => setPermRole(null)}>Batal</button>
          <button className="btn-primary" onClick={savePerms}>Simpan Hak Akses</button>
        </>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-50 dark:bg-ink-900/60">
                <th className="th">Menu</th>
                <th className="th text-center">Lihat</th>
                <th className="th text-center">Tambah</th>
                <th className="th text-center">Edit</th>
                <th className="th text-center">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
              {MENUS.map((m) => {
                const p = perms.find((x) => x.menu === m) || { menu: m, can_view: 0, can_create: 0, can_edit: 0, can_delete: 0 };
                return (
                  <tr key={m}>
                    <td className="td font-semibold">{MENU_LABELS[m] || m}</td>
                    {['can_view', 'can_create', 'can_edit', 'can_delete'].map((k) => (
                      <td key={k} className="td text-center">
                        <input type="checkbox" checked={!!p[k]} onChange={() => togglePerm(m, k)} className="w-4 h-4 rounded accent-primary-600" />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
