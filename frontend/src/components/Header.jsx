import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, LogOut, User, Menu, Calendar, ChevronDown, ShieldCheck } from 'lucide-react';
import { useUiStore } from '../stores/ui';
import { useAuthStore } from '../stores/auth';
import OfflineBadge from './OfflineBadge';

const PAGE_TITLES = {
  '/': 'Dashboard', '/pos': 'Kasir POS', '/products': 'Barang', '/master': 'Master Data',
  '/suppliers': 'Supplier', '/customers': 'Customer', '/branches': 'Cabang', '/users': 'User & Hak Akses',
  '/sales': 'Riwayat Penjualan', '/purchases': 'Pembelian & Retur', '/stock': 'Stok & Kartu Stok',
  '/transfers': 'Mutasi Antar Cabang', '/opname': 'Stok Opname', '/cash': 'Kas & Shift',
  '/promotions': 'Promo', '/reports': 'Laporan', '/barcode': 'Cetak Barcode', '/profile': 'Profil',
};

export default function Header() {
  const { dark, toggleDark, toggleSidebar } = useUiStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const now = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const pageTitle = PAGE_TITLES[location.pathname] || 'LunaPOS';

  return (
    <header className="h-16 shrink-0 bg-white/85 dark:bg-ink-900/85 backdrop-blur-md border-b border-ink-100 dark:border-ink-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="lg:hidden btn-ghost p-2" aria-label="Menu">
          <Menu size={20} />
        </button>
        <div className="hidden lg:block">
          <div className="text-sm font-bold leading-tight">{pageTitle}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-ink-400 font-medium">
            <Calendar size={11} />
            {now}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <OfflineBadge />
        <button
          onClick={toggleDark}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-ink-500 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          title="Dark mode"
        >
          {dark ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <div className="relative ml-1">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-ink-100/70 dark:hover:bg-ink-800 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 text-white flex items-center justify-center font-bold text-sm shadow-soft shadow-primary-600/25">
              {(user?.full_name || 'U').charAt(0)}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-bold leading-tight">{user?.full_name}</div>
              <div className="text-[11px] text-ink-400 flex items-center gap-1">
                <ShieldCheck size={10} />
                {user?.role_name}{user?.branch_name ? ` • ${user.branch_name}` : ' • Pusat'}
              </div>
            </div>
            <ChevronDown size={14} className="hidden md:block text-ink-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-52 card p-1.5 z-20 animate-scale-in shadow-strong">
                <div className="px-3 py-2 mb-1 border-b border-ink-100 dark:border-ink-800">
                  <div className="text-sm font-bold truncate">{user?.full_name}</div>
                  <div className="text-xs text-ink-400 truncate">{user?.username}</div>
                </div>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-ink-50 dark:hover:bg-ink-800">
                  <User size={16} /> Ubah Password
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-danger hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut size={16} /> Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
