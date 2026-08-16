import { useEffect, useMemo, useState } from 'react';
import { Database, Download, Trash2, RefreshCw, HardDrive, Table2, FileClock, AlertTriangle } from 'lucide-react';
import toast from '../utils/toast';
import { swalConfirm } from '../utils/confirm';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { backupApi } from '../api';
import { errMsg } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { fmtDate, downloadBlob } from '../utils/format';

export default function BackupPage() {
  const can = useAuthStore((s) => s.can);
  const [files, setFiles] = useState([]);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [f, i] = await Promise.all([backupApi.files(), backupApi.info()]);
      setFiles(f.data || []);
      setInfo(i.data);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const createBackup = async () => {
    setCreating(true);
    try {
      const res = await backupApi.create();
      toast.success(`Backup berhasil: ${res.data.filename}`);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setCreating(false);
    }
  };

  const download = async (filename) => {
    try {
      const blob = await backupApi.download(filename);
      downloadBlob(blob, filename);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const restore = async (filename) => {
    const ok = await swalConfirm({
      title: 'Restore Database',
      text: `Seluruh data saat ini akan diganti dengan isi backup ${filename}. Tindakan ini tidak dapat dibatalkan. Lanjutkan?`,
      confirmText: 'Ya, Restore',
      cancelText: 'Batal',
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await backupApi.restore(filename);
      toast.success(res.message || 'Database berhasil di-restore');
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const remove = async (filename) => {
    const ok = await swalConfirm({
      title: 'Hapus Backup',
      text: `Hapus file backup ${filename}?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      danger: true,
    });
    if (!ok) return;
    try {
      await backupApi.remove(filename);
      toast.success('Backup dihapus');
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const columns = useMemo(() => [
    {
      header: 'File', accessorKey: 'filename',
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0"><Database size={17} /></div>
          <div>
            <div className="font-mono text-xs font-semibold">{c.getValue()}</div>
            <div className="text-xs text-ink-400">{fmtDate(c.row.original.created_at, true)}</div>
          </div>
        </div>
      ),
    },
    { header: 'Ukuran', accessorKey: 'size_label', cell: (c) => <span className="text-sm font-medium">{c.getValue()}</span> },
    {
      header: 'Aksi', accessorKey: 'id',
      cell: (c) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => download(c.row.original.filename)} className="btn-ghost p-2" title="Unduh">
            <Download size={16} />
          </button>
          {can('backup', 'edit') && (
            <button onClick={() => restore(c.row.original.filename)} className="btn-ghost p-2 text-amber-600 dark:text-amber-400" title="Restore">
              <RefreshCw size={16} />
            </button>
          )}
          {can('backup', 'delete') && (
            <button onClick={() => remove(c.row.original.filename)} className="btn-ghost p-2 text-red-500" title="Hapus">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ], [can]);

  return (
    <div>
      <PageHeader
        title="Backup Database"
        subtitle="Buat, unduh, dan pulihkan cadangan database LunaPOS"
        actions={
          can('backup', 'create') && (
            <button onClick={createBackup} disabled={creating} className="btn-primary">
              <Database size={16} />
              {creating ? 'Membuat...' : 'Buat Backup Sekarang'}
            </button>
          )
        }
      />

      {/* Info DB */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center"><Database size={18} /></div>
          <div>
            <div className="text-xs text-ink-400 font-semibold uppercase tracking-wide">Database</div>
            <div className="font-bold">{info?.database || '-'}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><HardDrive size={18} /></div>
          <div>
            <div className="text-xs text-ink-400 font-semibold uppercase tracking-wide">Ukuran</div>
            <div className="font-bold">{info ? `${info.size_mb} MB` : '-'}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center"><Table2 size={18} /></div>
          <div>
            <div className="text-xs text-ink-400 font-semibold uppercase tracking-wide">Tabel</div>
            <div className="font-bold">{info?.tables ?? '-'}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center"><FileClock size={18} /></div>
          <div>
            <div className="text-xs text-ink-400 font-semibold uppercase tracking-wide">Backup Tersimpan</div>
            <div className="font-bold">{info?.backup_count ?? '-'}</div>
          </div>
        </div>
      </div>

      {can('backup', 'edit') && (
        <div className="card p-4 mb-6 flex items-start gap-3 border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-ink-600 dark:text-ink-300">
            <b>Restore</b> akan mengganti seluruh data saat ini dengan isi file backup. Pastikan Anda sudah membuat backup terbaru sebelum melakukan restore.
          </p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={files}
        loading={loading}
        emptyText="Belum ada backup. Klik 'Buat Backup Sekarang' untuk membuat cadangan pertama."
      />
    </div>
  );
}