import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Skeleton } from 'antd';
import { PrivateRoute, PublicOnlyRoute } from './components/PrivateRoute';

const AdminLayout = lazy(() => import('./layouts/AdminLayout').then((module) => ({ default: module.AdminLayout })));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard').then((module) => ({ default: module.Dashboard })));
const Login = lazy(() => import('./pages/Login/Login').then((module) => ({ default: module.Login })));
const Users = lazy(() => import('./pages/Users/Users').then((module) => ({ default: module.Users })));
const SePayReconciliation = lazy(() => import('./pages/SePay/SePayReconciliation').then((module) => ({ default: module.SePayReconciliation })));
const TransactionHistory = lazy(() => import('./pages/Transactions/TransactionHistory').then((module) => ({ default: module.TransactionHistory })));
const Support = lazy(() => import('./pages/Support/Support').then((module) => ({ default: module.Support })));
const AdminNotificationsPage = lazy(() => import('./pages/Notifications/AdminNotificationsPage').then((module) => ({ default: module.AdminNotificationsPage })));
const AuditLogPage = lazy(() => import('./pages/Audit/AuditLogPage').then((module) => ({ default: module.AuditLogPage })));

const RouteFallback = () => <div style={{ padding: 32, maxWidth: 1280, margin: '0 auto' }}><Skeleton active paragraph={{ rows: 12 }} /></div>;

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#EC4899',
          colorInfo: '#EC4899',
          colorLink: '#EC4899',
          colorBgLayout: '#FFF8FC',
          colorBgContainer: '#FFFFFF',
          colorBorderSecondary: '#F3E8FF',
          colorText: '#1F2937',
          colorTextSecondary: '#6B7280',
          colorFillAlter: '#FFF8FC',
          borderRadius: 12,
          fontFamily: "'Manrope', 'Avenir Next', system-ui, sans-serif",
        },
      }}
    >
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />

          <Route element={<PrivateRoute />}>
            <Route path="/" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="audit-logs" element={<AuditLogPage />} />
              <Route path="transaction-history" element={<TransactionHistory />} />
              <Route path="support" element={<Support />} />
              <Route path="transactions" element={<SePayReconciliation />} />
              {['wallets', 'reconciliation', 'control-center', 'finance-cases', 'risk-alerts'].map((path) => <Route key={path} path={path} element={<Navigate to="/transaction-history" replace />} />)}
              {['funds', 'split-bills', 'invoices', 'posts', 'finance-reports', 'reports', 'admin-access', 'budgets'].map((path) => <Route key={path} path={path} element={<Navigate to="/" replace />} />)}
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
