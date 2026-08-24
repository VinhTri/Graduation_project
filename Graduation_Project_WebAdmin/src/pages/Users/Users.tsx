import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  message,
  Card,
  Typography,
  Drawer,
  Input,
  Select,
  Tooltip,
  Empty,
  Modal,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  MailOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  ExclamationCircleOutlined,
  BankOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { apiClient } from '../../services/api';
import { UserAvatar } from '../../components/UserAvatar';
import './Users.css';

const { Text } = Typography;

interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: string;
  active?: boolean;
  isActive?: boolean;
  createdAt: string;
  avatarUrl?: string;
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
  totalTopUp?: number;
  totalWithdraw?: number;
  recentTransactions: TransactionHistory[];
  bankAccounts?: BankAccount[];
}

interface BankAccount { id: number; bankCode: string; bankName: string; accountNumber: string; accountName: string; default: boolean; isDefault?: boolean; createdAt: string }

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
  const [statusTarget, setStatusTarget] = useState<UserResponse | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [historyRows, setHistoryRows] = useState<TransactionHistory[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/admin/users');
      const data = response.data?.data || response.data || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      const apiMessage = axios.isAxiosError(error) ? error.response?.data?.message : null;
      message.error(apiMessage || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUsers();
  }, [fetchUsers]);

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

  const handleUpdateStatus = async () => {
    if (!statusTarget || statusReason.trim().length < 5) {
      message.warning('Vui lòng nhập lý do ít nhất 5 ký tự');
      return;
    }
    try {
      setTogglingId(statusTarget.id);
      const response = await apiClient.put(`/api/v1/admin/users/${statusTarget.id}/status`, {
        active: !isActiveUser(statusTarget),
        reason: statusReason.trim(),
      });
      if (response.data?.success !== false) {
        message.success(response.data?.message || 'Đã cập nhật trạng thái');
        setSelectedUser((current) => current && current.userInfo.id === statusTarget.id
          ? { ...current, userInfo: { ...current.userInfo, active: !isActiveUser(statusTarget), isActive: !isActiveUser(statusTarget) } }
          : current);
        setStatusTarget(null);
        setStatusReason('');
        await fetchUsers();
      }
    } catch (error: unknown) {
      const apiMessage = axios.isAxiosError(error) ? error.response?.data?.message : null;
      message.error(apiMessage || 'Không thể thay đổi trạng thái');
    } finally {
      setTogglingId(null);
    }
  };

  const handleViewDetails = async (id: number) => {
    setDrawerVisible(true);
    setDrawerLoading(true);
    setSelectedUser(null);
    try {
      const [response, historyResponse] = await Promise.all([
        apiClient.get(`/api/v1/admin/users/${id}/details`),
        apiClient.get(`/api/v1/admin/users/${id}/transactions?page=0&size=10`),
      ]);
      const data = response.data?.data || response.data;
      if (data) setSelectedUser(data);
      const history = historyResponse.data?.data || historyResponse.data;
      setHistoryRows(history?.content || []); setHistoryTotal(Number(history?.totalElements || 0)); setHistoryPage(1);
    } catch {
      message.error('Không thể tải chi tiết người dùng');
      setDrawerVisible(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  const changeHistoryPage = async (page: number) => {
    if (!selectedUser) return;
    setHistoryLoading(true);
    try {
      const response = await apiClient.get(`/api/v1/admin/users/${selectedUser.userInfo.id}/transactions?page=${page - 1}&size=10`);
      const data = response.data?.data || response.data;
      setHistoryRows(data?.content || []); setHistoryTotal(Number(data?.totalElements || 0)); setHistoryPage(page);
    } catch { message.error('Không thể tải trang lịch sử giao dịch'); }
    finally { setHistoryLoading(false); }
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
          <UserAvatar name={record.username} avatarUrl={record.avatarUrl} size={40} color={avatarColor(record.username || 'U')} />
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
                <Button
                  danger={active}
                  type={active ? 'default' : 'primary'}
                  icon={active ? <LockOutlined /> : <UnlockOutlined />}
                  loading={togglingId === record.id}
                  onClick={() => { setStatusTarget(record); setStatusReason(''); }}
                >
                  {active ? 'Khóa' : 'Mở'}
                </Button>
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
  const isLocking = !!statusTarget && isActiveUser(statusTarget);
  const reasonPresets = isLocking
    ? ['Phát hiện hoạt động bất thường', 'Vi phạm điều khoản sử dụng', 'Cần xác minh thông tin tài khoản']
    : ['Đã hoàn tất xác minh', 'Đã xử lý vi phạm', 'Mở lại theo yêu cầu hỗ trợ'];

  return (
    <div className="users-page">
      <div className="users-hero">
        <div>
          <div className="users-hero-kicker">
            <TeamOutlined /> Quản lý tài khoản
          </div>
          <h2>Danh sách người dùng</h2>
        </div>
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
        width={760}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        loading={drawerLoading}
        destroyOnClose
      >
        {selectedUser && (
          <div className="users-drawer-body">
            <header className="users-profile-head">
              <div className="users-profile-identity">
                <UserAvatar name={selectedUser.userInfo.username} avatarUrl={selectedUser.userInfo.avatarUrl} size={58} color={avatarColor(selectedUser.userInfo.username || 'U')} />
                <div><span>Hồ sơ người dùng · #{selectedUser.userInfo.id}</span><h3>{selectedUser.userInfo.username}</h3><p><MailOutlined /> {selectedUser.userInfo.email}</p></div>
              </div>
              <div className="users-profile-actions">
                <Tag className={`users-tag ${selectedUser.userInfo.role === 'ADMIN' ? 'admin' : 'user'}`}>{selectedUser.userInfo.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}</Tag>
                <span className={`users-status ${detailActive ? 'on' : 'off'}`}><i />{detailActive ? 'Hoạt động' : 'Đã khóa'}</span>
                {selectedUser.userInfo.role !== 'ADMIN' && <Button danger={detailActive} icon={detailActive ? <LockOutlined /> : <UnlockOutlined />} onClick={() => { setStatusTarget(selectedUser.userInfo); setStatusReason(''); }}>{detailActive ? 'Khóa tài khoản' : 'Mở tài khoản'}</Button>}
              </div>
            </header>

            <div className="users-money-grid">
              <div className="users-balance-card users-balance-card--main">
                <div className="users-balance-card-top"><div className="users-balance-icon users-balance-icon--logo"><img src="/brand/smartspend-icon.png" alt="SmartSpend" /></div><span>Số dư hiện tại</span></div>
                <strong>{formatVND(Number(selectedUser.totalBalance || 0))}</strong>
                <small>Số dư ví chính của người dùng</small>
              </div>
              <div className="users-balance-card users-balance-card--topup">
                <div className="users-balance-icon users-balance-icon--topup"><ArrowDownOutlined /></div>
                <div><span>Đã nạp thành công</span><strong>{formatVND(Number(selectedUser.totalTopUp || 0))}</strong></div>
              </div>
              <div className="users-balance-card users-balance-card--withdraw">
                <div className="users-balance-icon users-balance-icon--withdraw"><ArrowUpOutlined /></div>
                <div><span>Đã rút thành công</span><strong>{formatVND(Number(selectedUser.totalWithdraw || 0))}</strong></div>
              </div>
            </div>

            <section className="users-profile-meta">
              <div><span>Mã người dùng</span><strong>#{selectedUser.userInfo.id}</strong></div>
              <div><span>Ngày tham gia</span><strong>{formatDate(selectedUser.userInfo.createdAt)}</strong></div>
              <div><span>Tổng lịch sử nạp / rút</span><strong>{historyTotal}</strong></div>
            </section>

            <section className="users-bank-section">
              <div className="users-section-heading"><div><span>Liên kết tài chính</span><h4>Ngân hàng đã liên kết</h4></div><Tag>{selectedUser.bankAccounts?.length || 0} tài khoản</Tag></div>
              {(selectedUser.bankAccounts || []).length ? <div className="users-bank-list">{selectedUser.bankAccounts!.map((bank) => <article className="users-bank-card" key={bank.id}><div className="users-bank-icon"><BankOutlined /></div><div><div><strong>{bank.bankName}</strong>{(bank.default ?? bank.isDefault) && <Tag color="magenta">Mặc định</Tag>}</div><span>{bank.accountNumber}</span><small>{bank.accountName} · {bank.bankCode}</small></div></article>)}</div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa liên kết ngân hàng" />}
            </section>

            <div className="users-drawer-section">
              <div className="users-section-heading"><div><span>Hoạt động ví</span><h4>Lịch sử nạp / rút</h4></div><Tag>{historyTotal} giao dịch</Tag></div>
              <Table
                className="users-detail-table"
                columns={transactionColumns}
                dataSource={historyRows}
                rowKey={(r) => `${r.transactionCode}-${r.createdAt}`}
                loading={historyLoading}
                pagination={{ current: historyPage, pageSize: 10, total: historyTotal, showSizeChanger: false, onChange: (page) => void changeHistoryPage(page), showTotal: (total) => `${total} giao dịch` }}
                size="small"
                scroll={{ x: 650 }}
                locale={{ emptyText: <Empty description="Chưa có giao dịch" /> }}
              />
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        className={`users-status-modal ${isLocking ? 'is-locking' : 'is-unlocking'}`}
        title={null}
        width={560}
        centered
        open={!!statusTarget}
        footer={null}
        onCancel={() => { setStatusTarget(null); setStatusReason(''); }}
        destroyOnClose
      >
        <header className="users-status-modal-head">
          <div className="users-status-modal-icon">{isLocking ? <LockOutlined /> : <UnlockOutlined />}</div>
          <div><span>{isLocking ? 'Kiểm soát tài khoản' : 'Khôi phục truy cập'}</span><h3>{isLocking ? 'Khóa tài khoản người dùng' : 'Mở khóa tài khoản'}</h3><p>{isLocking ? 'Người dùng sẽ không thể tiếp tục sử dụng hệ thống.' : 'Người dùng sẽ có thể đăng nhập và sử dụng lại hệ thống.'}</p></div>
        </header>
        <div className="users-status-target"><UserAvatar name={statusTarget?.username} avatarUrl={statusTarget?.avatarUrl} size={42} color={avatarColor(statusTarget?.username || 'U')} /><div><strong>{statusTarget?.username}</strong><span>{statusTarget?.email}</span></div><Tag>#{statusTarget?.id}</Tag></div>
        <div className="users-status-warning"><ExclamationCircleOutlined /><span>Hành động và lý do sẽ được lưu trong nhật ký quản trị để phục vụ kiểm tra.</span></div>
        <label className="users-status-reason">
          <span>Lý do {isLocking ? 'khóa tài khoản' : 'mở khóa'} <i>Bắt buộc</i></span>
          <div className="users-reason-presets">{reasonPresets.map((reason) => <Button key={reason} size="small" type={statusReason === reason ? 'primary' : 'default'} onClick={() => setStatusReason(reason)}>{reason}</Button>)}</div>
          <Input.TextArea value={statusReason} onChange={(event) => setStatusReason(event.target.value)} maxLength={300} showCount rows={4} placeholder="Nhập lý do cụ thể, tối thiểu 5 ký tự..." />
        </label>
        <footer className="users-status-modal-actions"><Button onClick={() => { setStatusTarget(null); setStatusReason(''); }}>Hủy bỏ</Button><Button type="primary" danger={isLocking} icon={isLocking ? <LockOutlined /> : <UnlockOutlined />} loading={togglingId === statusTarget?.id} disabled={statusReason.trim().length < 5} onClick={() => void handleUpdateStatus()}>{isLocking ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}</Button></footer>
      </Modal>
    </div>
  );
};
