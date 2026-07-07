import React from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TransactionOutlined,
  LogoutOutlined,
  BarChartOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Content, Footer, Sider } = Layout;

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick = (key: string) => {
    if (key === 'logout') {
      // Handle logout logic here
      navigate('/login');
      return;
    }
    navigate(key);
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider breakpoint="lg" collapsedWidth="0" style={{ height: '100vh', overflow: 'auto' }}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
          SmartSpend Admin
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => handleMenuClick(key)}
          items={[
            {
              key: '/',
              icon: <DashboardOutlined />,
              label: 'Tổng quan',
            },
            {
              key: '/users',
              icon: <UserOutlined />,
              label: 'Người dùng',
            },
            {
              key: '/transactions',
              icon: <TransactionOutlined />,
              label: 'Giao dịch',
            },
            {
              key: '/reports',
              icon: <BarChartOutlined />,
              label: 'Báo cáo',
            },
            {
              key: '/posts',
              icon: <FileTextOutlined />,
              label: 'Bài viết',
            },
            {
              type: 'divider',
            },
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: 'Đăng xuất',
              danger: true,
            },
          ]}
        />
      </Sider>
      <Layout style={{ overflowY: 'auto' }}>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div style={{ padding: '0 24px', fontSize: 18, fontWeight: 600 }}>
            Hệ thống Quản trị SmartSpend
          </div>
        </Header>
        <Content style={{ margin: '24px', minHeight: 360 }}>
          <Outlet />
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          SmartSpend Admin ©{new Date().getFullYear()} Created by Graduation Team
        </Footer>
      </Layout>
    </Layout>
  );
};
