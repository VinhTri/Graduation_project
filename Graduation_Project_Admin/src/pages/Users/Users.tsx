import React, { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  message,
  Card,
  Typography,
  Drawer,
  Descriptions,
  Input,
  Select,
  Avatar,
  Tooltip,
  Popconfirm,
  Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  MailOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '../../services/api';
import './Users.css';

const { Text, Title } = Typography;

interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: string;
  active?: boolean;
  isActive?: boolean;
  createdAt: string;
}

interface TransactionHistory {
  transactionCode: string;
  type: string;
  status: string;
  amount: number;
  note: string;
  createdAt: string;
}

interface UserDetailsResponse {
  userInfo: UserResponse;
  totalBalance: number;
  recentTransactions: TransactionHistory[];
}

const TYPE_LABEL: Record<string, string> = {
  TOP_UP: 'Nạp tiền',
  WITHDRAW: 'Rút tiền',
  TRANSFER: 'Chuyển khoản',
  PAYMENT: 'Thanh toán',
  EXPENSE: 'Chi tiêu',
  INCOME: 'Thu nhập',
  BANK_LINK_FEE: 'Phí liên kết NH',
};

const STATUS_META: Record<string, { color: string; label: string }> = {
  SUCCESS: { color: 'success', label: 'Thành công' },
  COMPLETED: { color: 'success', label: 'Thành công' },
  PENDING: { color: 'processing', label: 'Chờ xử lý' },
  PROCESSING: { color: 'processing', label: 'Đang xử lý' },
  FAILED: { color: 'error', label: 'Thất bại' },
  CANCELLED: { color: 'default', label: 'Đã hủy' },
};

const isActiveUser = (u: UserResponse) => u.active ?? u.isActive ?? false;

const avatarColor = (name: string) => {
  const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444'];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export const Users = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'LOCKED'>('ALL');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetailsResponse | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/admin/users');
      const data = response.data?.data || response.data || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      message.error(error?.response?.data?.message || error?.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const stats = useMemo(() => {
    const endUsers = users.filter((u) => u.role !== 'ADMIN');
    const active = endUsers.filter(isActiveUser).length;
    const locked = endUsers.length - active;
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    return {
      total: users.length,
      endUsers: endUsers.length,
      active,
      locked,
      admins,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const active = isActiveUser(u);
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (statusFilter === 'ACTIVE' && !active) return false;
      if (statusFilter === 'LOCKED' && active) return false;
      if (!q) return true;
      return (
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        String(u.id).includes(q)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  const handleToggleStatus = async (id: number) => {
    try {
      setTogglingId(id);
      const response = await apiClient.put(`/api/v1/admin/users/${id}/toggle-status`);
      if (response.data?.success !== false) {
        message.success(response.data?.message || 'Đã cập nhật trạng thái');
        fetchUsers();
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể thay đổi trạng thái');
    } finally {
      setTogglingId(null);
    }
  };

  const handleViewDetails = async (id: number) => {
    setDrawerVisible(true);
    setDrawerLoading(true);
    setSelectedUser(null);
    try {
      const response = await apiClient.get(`/api/v1/admin/users/${id}/details`);
      const data = response.data?.data || response.data;
      if (data) setSelectedUser(data);
    } catch {
      message.error('Không thể tải chi tiết người dùng');
      setDrawerVisible(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '—';
    return dayjs(date).format('DD/MM/YYYY HH:mm');
  };

  const formatVND = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const columns: ColumnsType<UserResponse> = [
    {
      title: 'Người dùng',
      key: 'user',
      render: (_, record) => (
        <div className="users-cell-user">
          <Avatar
            size={40}
            style={{ background: avatarColor(record.username || 'U'), flexShrink: 0 }}
          >
            {(record.username || 'U').slice(0, 1).toUpperCase()}
          </Avatar>
          <div>
            <strong>{record.username}</strong>
            <span>
              <MailOutlined /> {record.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      render: (id: number) => <Text type="secondary">#{id}</Text>,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role: string) =>
        role === 'ADMIN' ? (
          <Tag className="users-tag admin" icon={<SafetyCertificateOutlined />}>
            Quản trị
          </Tag>
        ) : (
          <Tag className="users-tag user" icon={<UserOutlined />}>
            Người dùng
          </Tag>
        ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => <span className="users-date">{formatDate(date)}</span>,
    },
    {
      title: 'Trạng thái',
      key: 'active',
      width: 130,
      render: (_, record) => {
        const active = isActiveUser(record);
        return (
          <span className={`users-status ${active ? 'on' : 'off'}`}>
            <i />
            {active ? 'Hoạt động' : 'Đã khóa'}
          </span>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 210,
      render: (_, record) => {
        const active = isActiveUser(record);
        return (
          <Space size={8}>
            <Tooltip title="Xem chi tiết">
              <Button
                className="users-btn-detail"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetails(record.id)}
              >
                Chi tiết
              </Button>
            </Tooltip>
            {record.role !== 'ADMIN' && (
              <Popconfirm
                title={active ? 'Khóa tài khoản này?' : 'Mở khóa tài khoản này?'}
                okText="Xác nhận"
                cancelText="Hủy"
                onConfirm={() => handleToggleStatus(record.id)}
              >
                <Button
                  danger={active}
                  type={active ? 'default' : 'primary'}
                  icon={active ? <LockOutlined /> : <UnlockOutlined />}
                  loading={togglingId === record.id}
                >
                  {active ? 'Khóa' : 'Mở'}
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  const transactionColumns: ColumnsType<TransactionHistory> = [
    {
      title: 'Mã GD',
      dataIndex: 'transactionCode',
      key: 'transactionCode',
      render: (text) => <Text copyable={{ text }}>{text}</Text>,
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'TOP_UP' ? 'success' : type === 'WITHDRAW' ? 'magenta' : 'purple'}>
          {TYPE_LABEL[type] || type}
        </Tag>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount: number, record) => (
        <Text strong style={{ color: record.type === 'WITHDRAW' ? '#e11d48' : '#059669' }}>
          {record.type === 'WITHDRAW' ? '-' : '+'}
          {formatVND(amount)}
        </Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const meta = STATUS_META[status] || { color: 'default', label: status };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date),
    },
  ];

  const detailActive = selectedUser ? isActiveUser(selectedUser.userInfo) : false;

  return (
    <div className="users-page">
      <div className="users-hero">
        <div>
          <div className="users-hero-kicker">
            <TeamOutlined /> Quản lý tài khoản
          </div>
          <h2>Danh sách người dùng</h2>
          <p>Theo dõi, khóa/mở khóa và xem chi tiết ví cùng lịch sử giao dịch của từng tài khoản.</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchUsers} loading={loading}>
          Làm mới
        </Button>
      </div>

      <div className="users-stats">
        <div className="users-stat-card">
          <div className="users-stat-icon total">
            <TeamOutlined />
          </div>
          <div>
            <span>Tổng tài khoản</span>
            <strong>{stats.total}</strong>
          </div>
        </div>
        <div className="users-stat-card">
          <div className="users-stat-icon active">
            <UserOutlined />
          </div>
          <div>
            <span>Đang hoạt động</span>
            <strong>{stats.active}</strong>
          </div>
        </div>
        <div className="users-stat-card">
          <div className="users-stat-icon locked">
            <StopOutlined />
          </div>
          <div>
            <span>Đã khóa</span>
            <strong>{stats.locked}</strong>
          </div>
        </div>
        <div className="users-stat-card">
          <div className="users-stat-icon admin">
            <SafetyCertificateOutlined />
          </div>
          <div>
            <span>Quản trị viên</span>
            <strong>{stats.admins}</strong>
          </div>
        </div>
      </div>

      <Card className="users-table-card" bordered={false}>
        <div className="users-toolbar">
          <Input
            allowClear
            className="users-search"
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tên, email hoặc ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Space wrap>
            <Select
              value={roleFilter}
              style={{ width: 150 }}
              onChange={setRoleFilter}
              options={[
                { value: 'ALL', label: 'Tất cả vai trò' },
                { value: 'USER', label: 'Người dùng' },
                { value: 'ADMIN', label: 'Quản trị' },
              ]}
            />
            <Select
              value={statusFilter}
              style={{ width: 150 }}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: 'Tất cả trạng thái' },
                { value: 'ACTIVE', label: 'Hoạt động' },
                { value: 'LOCKED', label: 'Đã khóa' },
              ]}
            />
          </Space>
        </div>

        <Table
          className="users-table"
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          scroll={{ x: 960 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `${total} người dùng`,
          }}
          locale={{ emptyText: <Empty description="Không tìm thấy người dùng" /> }}
        />
      </Card>

      <Drawer
        className="users-drawer"
        title={null}
        width={820}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        loading={drawerLoading}
        destroyOnClose
      >
        {selectedUser && (
          <div className="users-drawer-body">
            <div className="users-drawer-head">
              <Avatar
                size={64}
                style={{ background: avatarColor(selectedUser.userInfo.username || 'U') }}
              >
                {(selectedUser.userInfo.username || 'U').slice(0, 1).toUpperCase()}
              </Avatar>
              <div>
                <h3>{selectedUser.userInfo.username}</h3>
                <p>{selectedUser.userInfo.email}</p>
                <Space size={8} wrap>
                  <Tag className={`users-tag ${selectedUser.userInfo.role === 'ADMIN' ? 'admin' : 'user'}`}>
                    {selectedUser.userInfo.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                  </Tag>
                  <span className={`users-status ${detailActive ? 'on' : 'off'}`}>
                    <i />
                    {detailActive ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </Space>
              </div>
            </div>

            <div className="users-balance-card">
              <div className="users-balance-icon">
                <WalletOutlined />
              </div>
              <div>
                <span>Tổng số dư các ví</span>
                <Title level={2}>{formatVND(Number(selectedUser.totalBalance || 0))}</Title>
              </div>
            </div>

            <Descriptions
              className="users-desc"
              title="Thông tin cơ bản"
              column={2}
              size="middle"
              items={[
                { key: 'id', label: 'ID', children: `#${selectedUser.userInfo.id}` },
                { key: 'username', label: 'Tên đăng nhập', children: selectedUser.userInfo.username },
                { key: 'email', label: 'Email', children: selectedUser.userInfo.email },
                {
                  key: 'joined',
                  label: 'Ngày tham gia',
                  children: formatDate(selectedUser.userInfo.createdAt),
                },
              ]}
            />

            <div className="users-drawer-section">
              <h4>Lịch sử giao dịch gần đây</h4>
              <Table
                columns={transactionColumns}
                dataSource={selectedUser.recentTransactions || []}
                rowKey={(r) => `${r.transactionCode}-${r.createdAt}`}
                pagination={false}
                size="small"
                locale={{ emptyText: <Empty description="Chưa có giao dịch" /> }}
              />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
