import React, { useEffect, useMemo, useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, ConfigProvider, Tooltip, Breadcrumb, Badge } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TransactionOutlined,
  CustomerServiceOutlined,
  LogoutOutlined,
  BellOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import './AdminLayout.css';

const { Header, Content, Sider } = Layout;

const SIDEBAR_COLLAPSED_KEY = 'admin_sidebar_collapsed';

const PAGE_META: Record<string, { title: string; parent?: string }> = {
  '/': { title: 'Tổng quan' },
  '/users': { title: 'Người dùng', parent: 'Quản lý' },
  '/notifications': { title: 'Thông báo', parent: 'Giao tiếp' },
  '/transaction-history': { title: 'Nạp & rút tiền', parent: 'Tài chính' },
  '/support': { title: 'Hỗ trợ người dùng', parent: 'Giao tiếp' },
  '/transactions': { title: 'Đối soát SePay', parent: 'Tài chính' },
  '/audit-logs': { title: 'Nhật ký quản trị', parent: 'Hệ thống' },
};

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [riskAlertCount, setRiskAlertCount] = useState(0);

  useEffect(() => {
    let active = true;
    apiClient.get('/api/v1/admin/control-center/alerts')
      .then((response) => { if (active) setRiskAlertCount(Array.isArray(response.data?.data) ? response.data.data.length : 0); })
      .catch(() => { /* Header alerts are non-blocking. */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      // ignore
    }
  }, [collapsed]);

  const pageMeta = useMemo(() => {
    return PAGE_META[location.pathname] ?? { title: 'SmartSpend Admin' };
  }, [location.pathname]);

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
          <div className="admin-dropdown-user">
            <strong>Quản trị viên</strong>
            <span>admin@smartspend.com</span>
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Đăng xuất',
        danger: true,
        onClick: () => handleMenuClick('logout'),
      },
    ],
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#EC4899',
          colorInfo: '#EC4899',
          colorBgLayout: '#FFF8FC',
          colorBgContainer: '#FFFFFF',
          colorBorderSecondary: '#F3E8FF',
          colorText: '#1F2937',
          colorTextSecondary: '#6B7280',
          colorFillAlter: '#FFF8FC',
          borderRadius: 10,
          fontFamily: "'Manrope', 'Avenir Next', system-ui, sans-serif",
        },
        components: {
          Menu: {
            itemBorderRadius: 8,
            itemHeight: 42,
            itemMarginInline: 8,
          },
          Table: {
            headerBg: '#F8FAFC',
          },
        },
      }}
    >
      <Layout className="admin-shell">
        <Sider
          className={`admin-sider${collapsed ? ' is-collapsed' : ''}`}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          collapsedWidth={72}
          width={240}
          theme="light"
        >
          <div className="admin-brand">
            <div className="admin-brand-row">
              <img src="/brand/smartspend-icon.png" alt="SmartSpend" />
              {!collapsed && (
                <div className="admin-brand-text">
                  <strong>
                    <span className="smart">Smart</span>
                    <span className="spend">Spend</span>
                  </strong>
                  <small>Hệ thống quản trị viên</small>
                </div>
              )}
            </div>
            <svg
              className="admin-brand-curve"
              viewBox="0 0 240 14"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path d="M0 2 C60 14, 180 14, 240 2" />
            </svg>
          </div>

          <div className="admin-menu-wrap">
            <Tooltip title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'} placement="right">
              <button
                type="button"
                className={`admin-sider-toggle${collapsed ? ' is-collapsed' : ''}`}
                onClick={() => setCollapsed((v) => !v)}
                aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
              >
                <span className="admin-sider-toggle-icon">
                  {collapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
                </span>
                <span className="admin-sider-toggle-label">
                  {collapsed ? 'Mở rộng' : 'Thu gọn'}
                </span>
              </button>
            </Tooltip>

            <Menu
              className="admin-menu"
              mode="inline"
              selectedKeys={[location.pathname]}
              onClick={({ key }) => handleMenuClick(key)}
              items={[
                {
                  key: 'group-main',
                  type: 'group',
                  label: collapsed ? '' : 'Chính',
                  children: [
                    { key: '/', icon: <DashboardOutlined />, label: 'Tổng quan' },
                  ],
                },
                {
                  key: 'group-manage',
                  type: 'group',
                  label: collapsed ? '' : 'Quản lý chính',
                  children: [
                    { key: '/users', icon: <UserOutlined />, label: 'Người dùng' },
                    { key: '/transaction-history', icon: <TransactionOutlined />, label: 'Nạp & rút tiền' },
                    { key: '/transactions', icon: <TransactionOutlined />, label: 'Đối soát SePay' },
                  ],
                },
                {
                  key: 'group-communication',
                  type: 'group',
                  label: collapsed ? '' : 'Giao tiếp',
                  children: [
                    { key: '/support', icon: <CustomerServiceOutlined />, label: 'Hỗ trợ' },
                  ],
                },
                {
                  key: 'group-system',
                  type: 'group',
                  label: collapsed ? '' : 'Hệ thống',
                  children: [
                    { key: '/audit-logs', icon: <AuditOutlined />, label: 'Nhật ký quản trị' },
                  ],
                },
              ]}
            />
          </div>
        </Sider>

        <Layout className="admin-main">
          <Header className="admin-header">
            <div className="admin-header-left">
              <div className="admin-header-meta">
                <Breadcrumb
                  className="admin-breadcrumb"
                  items={[
                    { title: <Link to="/">Admin</Link> },
                    ...(pageMeta.parent ? [{ title: pageMeta.parent }] : []),
                    { title: pageMeta.title },
                  ]}
                />
                <div className="admin-header-title-row">
                  <span className="admin-header-accent" />
                  <h1>{pageMeta.title}</h1>
                </div>
              </div>
            </div>

            <div className="admin-header-right">
              <Tooltip title="Giao dịch cần kiểm tra">
                <button type="button" className="admin-icon-btn" aria-label="Giao dịch cần kiểm tra" onClick={() => navigate('/transaction-history')}>
                  <Badge count={riskAlertCount} size="small" offset={[-2, 2]}>
                    <BellOutlined />
                  </Badge>
                </button>
              </Tooltip>
              <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
                <button type="button" className="admin-user-btn">
                  <Avatar size={36} icon={<UserOutlined />} className="admin-avatar" />
                  <span className="admin-user-text">
                    <strong>Admin</strong>
                    <small>Quản trị viên</small>
                  </span>
                </button>
              </Dropdown>
            </div>
          </Header>

          <Content className="admin-content">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};
