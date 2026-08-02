import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, LogOut, User, Menu, Calendar } from 'lucide-react';
import { useUiStore } from '../stores/ui';
import { useAuthStore } from '../stores/auth';

export default function Header() {
  const { dark, toggleDark, toggleSidebar } = useUiStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const now = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="h-16 shrink-0 bg-white dark:bg-ink-800 border-b border-ink-100 dark:border-ink-700 flex items-center justify-between px-4 lg:px-6 shadow-soft">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="lg:hidden btn-ghost p-2">
          <Menu size={20} />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
          <Calendar size={15} />
          <span className="font-medium">{now}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={toggleDark} className="btn-ghost p-2.5" title="Dark mode">
          {dark ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl hover:bg-ink-50 dark:hover:bg-ink-700"
          >
            <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
              {(user?.full_name || 'U').charAt(0)}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-semibold leading-tight">{user?.full_name}</div>
              <div className="text-xs text-ink-400">{user?.role_name}{user?.branch_name ? ` • ${user.branch_name}` : ' • Pusat'}</div>
            </div>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 card p-1.5 z-20 animate-scale-in">
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-ink-50 dark:hover:bg-ink-700">
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
