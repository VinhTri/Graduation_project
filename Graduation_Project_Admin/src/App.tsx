import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Login } from './pages/Login/Login';
import { Users } from './pages/Users/Users';
import { Report } from './pages/Report/Report';
import { ManagePosts } from './pages/Posts';

function App() {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#0D9488' } }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="posts" element={<ManagePosts />} />
            <Route path="transactions" element={<div>Trang quản lý giao dịch (Đang phát triển)</div>} />
            <Route path="reports" element={<Report />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
