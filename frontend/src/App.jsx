import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/auth';
import { useUiStore } from './stores/ui';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import MasterDataPage from './pages/MasterDataPage';
import SuppliersPage from './pages/SuppliersPage';
import CustomersPage from './pages/CustomersPage';
import BranchesPage from './pages/BranchesPage';
import UsersPage from './pages/UsersPage';
import POSPage from './pages/POSPage';
import SalesPage from './pages/SalesPage';
import PurchasesPage from './pages/PurchasesPage';
import StockPage from './pages/StockPage';
import TransfersPage from './pages/TransfersPage';
import OpnamePage from './pages/OpnamePage';
import CashPage from './pages/CashPage';
import PromotionsPage from './pages/PromotionsPage';
import ReportsPage from './pages/ReportsPage';
import BarcodePage from './pages/BarcodePage';
import BackupPage from './pages/BackupPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const token = useAuthStore((s) => s.token);
  const dark = useUiStore((s) => s.dark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  if (!token) return <LoginPage />;

  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/master" element={<MasterDataPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/branches" element={<BranchesPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/transfers" element={<TransfersPage />} />
          <Route path="/opname" element={<OpnamePage />} />
          <Route path="/cash" element={<CashPage />} />
          <Route path="/promotions" element={<PromotionsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/barcode" element={<BarcodePage />} />
          <Route path="/backup" element={<BackupPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
