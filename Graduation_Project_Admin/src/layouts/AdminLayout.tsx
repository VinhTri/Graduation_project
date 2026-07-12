import React from 'react';
import { Layout, Menu, theme, ConfigProvider, Avatar, Dropdown, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TransactionOutlined,
  LogoutOutlined,
  BarChartOutlined,
  FileTextOutlined,
  SecurityScanOutlined,
  BellOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Content, Footer, Sider } = Layout;
const { Text } = Typography;

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleMenuClick = (key: string) => {
    if (key === 'logout') {
      localStorage.removeItem('admin_token');
      navigate('/login');
      return;
    }
    navigate(key);
  };

  const userMenu = {
    items: [
      {
        key: 'user-info',
        label: (
          <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Quản trị viên</span>
            <span style={{ color: '#64748B', fontSize: '0.8rem' }}>admin@smartspend.com</span>
          </div>
        ),
        disabled: true,
        style: { cursor: 'default' }
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: <span style={{ fontWeight: 500 }}>Hồ sơ cá nhân</span>,
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: <span style={{ fontWeight: 500 }}>Cài đặt hệ thống</span>,
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: <span style={{ fontWeight: 600 }}>Đăng xuất</span>,
        danger: true,
        onClick: () => handleMenuClick('logout'),
      },
    ],
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Menu: {
            itemSelectedBg: 'rgba(13, 148, 136, 0.4)',
            itemSelectedColor: '#fff',
            itemHoverBg: 'rgba(255, 255, 255, 0.08)',
            itemHoverColor: '#5EEAD4',
            itemColor: 'rgba(255, 255, 255, 0.65)',
            itemBorderRadius: 8,
            itemMarginInline: 12,
          },
        },
      }}
    >
      <Layout style={{ height: '100vh', overflow: 'hidden' }}>
        <Sider 
          breakpoint="lg" 
          collapsedWidth="0" 
          theme="dark"
          width={260}
          style={{ 
            height: '100vh', 
            overflow: 'auto',
            background: '#042f2e',
            backgroundImage: 'linear-gradient(rgba(13, 148, 136, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(13, 148, 136, 0.05) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            borderRight: '1px solid rgba(13, 148, 136, 0.2)',
            zIndex: 10
          }}
        >
          <div style={{ 
            height: 80, 
            display: 'flex', 
            alignItems: 'center', 
            padding: '0 24px',
            gap: 12,
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0D9488', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)' }}>
              <SecurityScanOutlined style={{ fontSize: 20, color: 'white' }} />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem', lineHeight: 1, letterSpacing: '-0.5px' }}>SmartSpend</div>
              <div style={{ color: '#5EEAD4', fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1.5, marginTop: 4 }}>ADMIN PORTAL</div>
            </div>
          </div>
          <div style={{ padding: '24px 0' }}>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[location.pathname]}
              onClick={({ key }) => handleMenuClick(key)}
              style={{ background: 'transparent', borderRight: 'none' }}
              items={[
                {
                  key: '/',
                  icon: <DashboardOutlined style={{ fontSize: 18 }} />,
                  label: <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Tổng quan</span>,
                },
                {
                  key: '/users',
                  icon: <UserOutlined style={{ fontSize: 18 }} />,
                  label: <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Người dùng</span>,
                },
                {
                  key: '/transactions',
                  icon: <TransactionOutlined style={{ fontSize: 18 }} />,
                  label: <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Giao dịch</span>,
                },
                {
                  key: '/reports',
                  icon: <BarChartOutlined style={{ fontSize: 18 }} />,
                  label: <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Báo cáo</span>,
                },
                {
                  key: '/posts',
                  icon: <FileTextOutlined style={{ fontSize: 18 }} />,
                  label: <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Bài viết</span>,
                },
              ]}
            />
          </div>
        </Sider>
        
        <Layout style={{ background: '#F8FAFC' }}>
          <Header style={{ 
            padding: '0 32px', 
            background: colorBgContainer, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            borderBottom: '1px solid #E2E8F0',
            height: 80,
            zIndex: 5
          }}>
            <div>
              {/* Optional: Add Breadcrumbs or Page Title here in the future */}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%', 
                background: '#F1F5F9', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                cursor: 'pointer',
                color: '#64748B',
                transition: 'all 0.2s'
              }}>
                <BellOutlined style={{ fontSize: 18 }} />
              </div>
              
              <Dropdown menu={userMenu} placement="bottomRight" arrow={{ pointAtCenter: true }} trigger={['click']}>
                <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '4px', borderRadius: '50%', transition: 'box-shadow 0.2s', border: '2px solid transparent' }} 
                     onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(13, 148, 136, 0.1)'}
                     onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
                  <Avatar style={{ backgroundColor: '#0D9488', border: '1px solid #fff' }} size={42} icon={<UserOutlined />} />
                </div>
              </Dropdown>
            </div>
          </Header>
          
          <Content style={{ padding: '32px', minHeight: 360, overflow: 'auto' }}>
            <Outlet />
          </Content>
          
          <Footer style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
            SmartSpend Admin Portal ©{new Date().getFullYear()}
          </Footer>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};
