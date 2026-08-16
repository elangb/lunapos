import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Boxes, Truck, Users, Store, ShieldCheck,
  Receipt, ShoppingBag, ArrowLeftRight, ClipboardList, Wallet, Percent, BarChart3, Barcode, ChevronsLeft, ChevronsRight, Zap, DatabaseBackup,
} from 'lucide-react';
import { useUiStore } from '../stores/ui';
import { useAuthStore } from '../stores/auth';

const MENU = [
  { group: 'Utama', items: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', perm: 'dashboard' },
    { to: '/pos', icon: ShoppingCart, label: 'Kasir POS', perm: 'sales', hot: true },
  ]},
  { group: 'Master Data', items: [
    { to: '/products', icon: Package, label: 'Barang', perm: 'products' },
    { to: '/master', icon: Boxes, label: 'Kategori / Merk / Satuan', perm: 'categories' },
    { to: '/suppliers', icon: Truck, label: 'Supplier', perm: 'suppliers' },
    { to: '/customers', icon: Users, label: 'Customer', perm: 'customers' },
    { to: '/branches', icon: Store, label: 'Cabang', perm: 'branches' },
    { to: '/users', icon: ShieldCheck, label: 'User & Hak Akses', perm: 'users' },
  ]},
  { group: 'Operasional', items: [
    { to: '/sales', icon: Receipt, label: 'Riwayat Penjualan', perm: 'sales' },
    { to: '/purchases', icon: ShoppingBag, label: 'Pembelian & Retur', perm: 'purchases' },
    { to: '/stock', icon: Package, label: 'Stok & Kartu Stok', perm: 'stock' },
    { to: '/transfers', icon: ArrowLeftRight, label: 'Mutasi Antar Cabang', perm: 'transfers' },
    { to: '/opname', icon: ClipboardList, label: 'Stok Opname', perm: 'opname' },
    { to: '/cash', icon: Wallet, label: 'Kas & Shift', perm: 'cash' },
  ]},
  { group: 'Lainnya', items: [
    { to: '/promotions', icon: Percent, label: 'Promo', perm: 'promotions' },
    { to: '/reports', icon: BarChart3, label: 'Laporan', perm: 'reports' },
    { to: '/barcode', icon: Barcode, label: 'Cetak Barcode', perm: 'barcode' },
    { to: '/backup', icon: DatabaseBackup, label: 'Backup Database', perm: 'backup' },
  ]},
];

export default function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const can = useAuthStore((s) => s.can);

  const groups = MENU
    .map((g) => ({ ...g, items: g.items.filter((m) => can(m.perm, 'view')) }))
    .filter((g) => g.items.length > 0);

  return (
    <aside
      className={`${collapsed ? 'w-[68px]' : 'w-64'} shrink-0 bg-white dark:bg-ink-950 text-ink-800 dark:text-ink-100 flex flex-col transition-all duration-300 border-r border-ink-100 dark:border-ink-800/60`}
    >
      {/* Brand */}
      <div className={`flex items-center gap-2.5 h-16 px-4 border-b border-ink-100 dark:border-ink-800/60 ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center font-black text-white text-sm shrink-0 shadow-soft shadow-primary-600/30">
          LP
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-extrabold text-lg tracking-tight text-ink-900 dark:text-white">Luna<span className="text-primary-500 dark:text-primary-400">POS</span></div>
            <div className="text-[10px] font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-widest">Point of Sale</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-4">
        {groups.map((g) => (
          <div key={g.group}>
            {!collapsed && (
              <div className="px-3 mb-1.5 text-[10px] font-bold text-ink-400 dark:text-ink-500 uppercase tracking-widest">{g.group}</div>
            )}
            <div className="space-y-0.5">
              {g.items.map((m) => (
                <NavLink
                  key={m.to}
                  to={m.to}
                  title={m.label}
                  end={m.to === '/'}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-soft shadow-primary-600/25'
                        : 'text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800/70 hover:text-ink-900 dark:hover:text-white'
                    } ${collapsed ? 'justify-center px-0' : ''}`
                  }
                >
                  <m.icon size={19} className="shrink-0" />
                  {!collapsed && <span className="truncate flex-1">{m.label}</span>}
                  {!collapsed && m.hot && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold bg-white/15 text-white rounded-full px-1.5 py-0.5 uppercase tracking-wide">
                      <Zap size={9} /> POS
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-ink-100 dark:border-ink-800/60 p-2.5">
        <button
          onClick={toggle}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold text-ink-400 dark:text-ink-500 hover:text-ink-700 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-ink-800/70 transition-colors"
        >
          {collapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> Ciutkan</>}
        </button>
      </div>
    </aside>
  );
}
