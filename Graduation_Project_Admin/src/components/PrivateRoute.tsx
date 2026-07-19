import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const TOKEN_KEY = 'admin_token';

export function PrivateRoute() {
  const location = useLocation();
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
