import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

export default function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/" replace />;
  return <Outlet />;
}
