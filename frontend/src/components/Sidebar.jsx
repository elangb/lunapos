import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Boxes, Truck, Users, Store, ShieldCheck,
  Receipt, ShoppingBag, ArrowLeftRight, ClipboardList, Wallet, Percent, BarChart3, Barcode, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { useUiStore } from '../stores/ui';
import { useAuthStore } from '../stores/auth';

const MENU = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', perm: 'dashboard' },
  { to: '/pos', icon: ShoppingCart, label: 'Kasir POS', perm: 'sales' },
  { to: '/products', icon: Package, label: 'Barang', perm: 'products' },
  { to: '/master', icon: Boxes, label: 'Kategori / Merk / Satuan', perm: 'categories' },
  { to: '/suppliers', icon: Truck, label: 'Supplier', perm: 'suppliers' },
  { to: '/customers', icon: Users, label: 'Customer', perm: 'customers' },
  { to: '/branches', icon: Store, label: 'Cabang', perm: 'branches' },
  { to: '/users', icon: ShieldCheck, label: 'User & Hak Akses', perm: 'users' },
  { to: '/sales', icon: Receipt, label: 'Riwayat Penjualan', perm: 'sales' },
  { to: '/purchases', icon: ShoppingBag, label: 'Pembelian & Retur', perm: 'purchases' },
  { to: '/stock', icon: Package, label: 'Stok & Kartu Stok', perm: 'stock' },
  { to: '/transfers', icon: ArrowLeftRight, label: 'Mutasi Antar Cabang', perm: 'transfers' },
  { to: '/opname', icon: ClipboardList, label: 'Stok Opname', perm: 'opname' },
  { to: '/cash', icon: Wallet, label: 'Kas & Shift', perm: 'cash' },
  { to: '/promotions', icon: Percent, label: 'Promo', perm: 'promotions' },
  { to: '/reports', icon: BarChart3, label: 'Laporan', perm: 'reports' },
  { to: '/barcode', icon: Barcode, label: 'Cetak Barcode', perm: 'barcode' },
];

export default function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const can = useAuthStore((s) => s.can);

  const items = MENU.filter((m) => can(m.perm, 'view'));

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-60'} shrink-0 bg-ink-900 dark:bg-ink-950 text-ink-100 flex flex-col transition-all duration-200`}
    >
      <div className={`flex items-center gap-2 h-16 px-4 border-b border-ink-700/50 ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center font-black text-white text-sm shrink-0">LP</div>
        {!collapsed && <div className="font-extrabold text-lg tracking-tight">Luna<span className="text-primary-400">POS</span></div>}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            title={m.label}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-600 text-white shadow-soft'
                  : 'text-ink-300 hover:bg-ink-800 hover:text-white'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
          >
            <m.icon size={19} className="shrink-0" />
            {!collapsed && <span className="truncate">{m.label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={toggle}
        className="h-12 flex items-center justify-center gap-2 border-t border-ink-700/50 text-ink-400 hover:text-white text-xs font-semibold"
      >
        {collapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> Ciutkan</>}
      </button>
    </aside>
  );
}
