import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Login } from './pages/Login/Login';
import { Users } from './pages/Users/Users';
import { Report } from './pages/Report/Report';
import { ManagePosts } from './pages/Posts';
import { SePayReconciliation } from './pages/SePay';
import { TransactionHistory } from './pages/Transactions';
import { Support } from './pages/Support';
import { PrivateRoute, PublicOnlyRoute } from './components/PrivateRoute';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#F472B6',
          colorInfo: '#7C3AED',
          colorLink: '#7C3AED',
          colorBgLayout: '#FFF8FC',
          colorBgContainer: '#FFFFFF',
          colorBorderSecondary: '#F3E8FF',
          borderRadius: 14,
          fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        },
      }}
    >
      <BrowserRouter>
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
              <Route path="posts" element={<ManagePosts />} />
              <Route path="transaction-history" element={<TransactionHistory />} />
              <Route path="support" element={<Support />} />
              <Route path="transactions" element={<SePayReconciliation />} />
              <Route path="reports" element={<Report />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
