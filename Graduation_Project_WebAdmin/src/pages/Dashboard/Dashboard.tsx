import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  Col,
  Row,
  Table,
  Tag,
  Typography,
  Button,
  Space,
  Spin,
  Empty,
  message,
  Progress,
} from 'antd';
import {
  UserOutlined,
  TransactionOutlined,
  DollarCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
  FileTextOutlined,
  WalletOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  BarChartOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api';
import './Dashboard.css';

const { Text } = Typography;

interface UserItem {
  id: number;
  username: string;
  email: string;
  role: string;
  active?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

interface TxItem {
  transactionCode: string;
  type: string;
  status: string;
  amount: number;
  createdAt: string;
  username?: string;
}

interface PostItem {
  id: number;
  title: string;
  active: boolean;
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
  PENDING: { color: 'processing', label: 'Chờ xử lý' },
  PROCESSING: { color: 'processing', label: 'Đang xử lý' },
  FAILED: { color: 'error', label: 'Thất bại' },
  CANCELLED: { color: 'default', label: 'Đã hủy' },
};

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);

const shortVND = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
};

const isActiveUser = (u: UserItem) => u.active ?? u.isActive ?? false;

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [transactions, setTransactions] = useState<TxItem[]>([]);
  const [totalWalletBalance, setTotalWalletBalance] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, postsRes] = await Promise.all([
        apiClient.get('/api/v1/admin/users'),
        apiClient.get('/api/v1/admin/posts'),
      ]);

      const userList: UserItem[] = usersRes.data?.data || usersRes.data || [];
      const postList: PostItem[] = postsRes.data?.data || postsRes.data || [];
      setUsers(Array.isArray(userList) ? userList : []);
      setPosts(Array.isArray(postList) ? postList : []);

      const targetUsers = userList.filter((u) => u.role !== 'ADMIN').slice(0, 80);
      const detailResults = await Promise.allSettled(
        targetUsers.map((u) => apiClient.get(`/api/v1/admin/users/${u.id}/details`))
      );

      let balanceSum = 0;
      const allTx: TxItem[] = [];

      detailResults.forEach((result, index) => {
        if (result.status !== 'fulfilled') return;
        const detail = result.value.data?.data || result.value.data;
        if (!detail) return;
        balanceSum += Number(detail.totalBalance || 0);
        const txs: TxItem[] = detail.recentTransactions || [];
        txs.forEach((tx) => {
          allTx.push({
            ...tx,
            amount: Number(tx.amount || 0),
            username: targetUsers[index]?.username || detail.userInfo?.username,
          });
        });
      });

      setTotalWalletBalance(balanceSum);
      setTransactions(allTx);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không tải được tổng quan hệ thống');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const endUsers = users.filter((u) => u.role !== 'ADMIN');
    const activeUsers = endUsers.filter(isActiveUser);
    const topUp = transactions.filter((t) => t.type === 'TOP_UP');
    const withdraw = transactions.filter((t) => t.type === 'WITHDRAW');
    const success = transactions.filter((t) => t.status === 'SUCCESS');
    const pending = transactions.filter((t) => t.status === 'PENDING' || t.status === 'PROCESSING');
    const failed = transactions.filter((t) => t.status === 'FAILED');

    const topUpAmount = topUp.reduce((s, t) => s + t.amount, 0);
    const withdrawAmount = withdraw.reduce((s, t) => s + t.amount, 0);
    const successRate = transactions.length
      ? Math.round((success.length / transactions.length) * 1000) / 10
      : 0;

    const newUsers7d = endUsers.filter(
      (u) => u.createdAt && dayjs(u.createdAt).isAfter(dayjs().subtract(7, 'day'))
    ).length;

    return {
      endUsers: endUsers.length,
      activeUsers: activeUsers.length,
      lockedUsers: endUsers.length - activeUsers.length,
      newUsers7d,
      totalPosts: posts.length,
      activePosts: posts.filter((p) => p.active).length,
      txCount: transactions.length,
      topUpCount: topUp.length,
      withdrawCount: withdraw.length,
      topUpAmount,
      withdrawAmount,
      netFlow: topUpAmount - withdrawAmount,
      successCount: success.length,
      pendingCount: pending.length,
      failedCount: failed.length,
      successRate,
      totalWalletBalance,
    };
  }, [users, posts, transactions, totalWalletBalance]);

  const trendData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const day = dayjs().subtract(6 - i, 'day').startOf('day');
      const next = day.add(1, 'day');
      const inDay = transactions.filter((tx) => {
        const d = dayjs(tx.createdAt);
        return (d.isAfter(day) || d.isSame(day)) && d.isBefore(next);
      });
      return {
        name: day.format('DD/MM'),
        nap: inDay.filter((t) => t.type === 'TOP_UP').reduce((s, t) => s + t.amount, 0),
        rut: inDay.filter((t) => t.type === 'WITHDRAW').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions]);

  const recentTx = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
        .slice(0, 8),
    [transactions]
  );

  const columns = [
    {
      title: 'Mã GD',
      dataIndex: 'transactionCode',
      key: 'transactionCode',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'Người dùng',
      dataIndex: 'username',
      key: 'username',
      render: (v: string) => v || '—',
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
      align: 'right' as const,
      render: (amount: number, row: TxItem) => (
        <Text strong style={{ color: row.type === 'WITHDRAW' ? '#e11d48' : '#059669' }}>
          {row.type === 'WITHDRAW' ? '-' : '+'}
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
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
  ];

  const quickLinks = [
    {
      title: 'Người dùng',
      desc: `${stats.activeUsers} đang hoạt động`,
      icon: <TeamOutlined />,
      path: '/users',
      tone: 'purple',
    },
    {
      title: 'Giao dịch',
      desc: `${stats.txCount} GD gần đây`,
      icon: <TransactionOutlined />,
      path: '/transactions',
      tone: 'pink',
    },
    {
      title: 'Bài viết',
      desc: `${stats.activePosts}/${stats.totalPosts} đang hiện`,
      icon: <FileTextOutlined />,
      path: '/posts',
      tone: 'blue',
    },
    {
      title: 'Báo cáo',
      desc: 'Phân tích chi tiết',
      icon: <BarChartOutlined />,
      path: '/reports',
      tone: 'green',
    },
  ];

  return (
    <div className="dash-page">
      <div className="dash-hero">
        <div>
          <div className="dash-hero-kicker">SmartSpend Admin</div>
          <h2>Tổng quan hệ thống</h2>
          <p>
            Theo dõi người dùng, ví, nạp/rút và nội dung — dữ liệu lấy trực tiếp từ các module
            đang vận hành.
          </p>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            Làm mới
          </Button>
          <Button type="primary" onClick={() => navigate('/reports')}>
            Xem báo cáo
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[14, 14]}>
          <Col xs={24} sm={12} xl={6}>
            <Card className="dash-kpi" bordered={false}>
              <div className="dash-kpi-icon purple">
                <UserOutlined />
              </div>
              <div>
                <span>Người dùng</span>
                <strong>{stats.endUsers}</strong>
                <small>
                  {stats.activeUsers} hoạt động · {stats.newUsers7d} mới/7 ngày
                </small>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="dash-kpi" bordered={false}>
              <div className="dash-kpi-icon green">
                <ArrowDownOutlined />
              </div>
              <div>
                <span>Tổng nạp</span>
                <strong>{formatVND(stats.topUpAmount)}</strong>
                <small>{stats.topUpCount} giao dịch nạp</small>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="dash-kpi" bordered={false}>
              <div className="dash-kpi-icon pink">
                <ArrowUpOutlined />
              </div>
              <div>
                <span>Tổng rút</span>
                <strong>{formatVND(stats.withdrawAmount)}</strong>
                <small>{stats.withdrawCount} giao dịch rút</small>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="dash-kpi" bordered={false}>
              <div className="dash-kpi-icon blue">
                <WalletOutlined />
              </div>
              <div>
                <span>Số dư ví hệ thống</span>
                <strong>{formatVND(stats.totalWalletBalance)}</strong>
                <small>Dòng tiền ròng {formatVND(stats.netFlow)}</small>
              </div>
            </Card>
          </Col>
        </Row>

        <div className="dash-section-label">Lối tắt quản trị</div>
        <Row gutter={[12, 12]}>
          {quickLinks.map((item) => (
            <Col xs={24} sm={12} xl={6} key={item.path}>
              <button
                type="button"
                className={`dash-quick tone-${item.tone}`}
                onClick={() => navigate(item.path)}
              >
                <span className="dash-quick-icon">{item.icon}</span>
                <span className="dash-quick-text">
                  <strong>{item.title}</strong>
                  <small>{item.desc}</small>
                </span>
              </button>
            </Col>
          ))}
        </Row>

        <Row gutter={[14, 14]} style={{ marginTop: 14 }}>
          <Col xs={24} xl={16}>
            <Card
              className="dash-panel"
              title="Xu hướng nạp / rút 7 ngày"
              extra={<Text type="secondary">Từ lịch sử giao dịch người dùng</Text>}
            >
              {trendData.every((d) => d.nap === 0 && d.rut === 0) ? (
                <Empty description="Chưa có giao dịch trong 7 ngày gần đây" />
              ) : (
                <div className="dash-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dashNap" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="dashRut" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f472b6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1e7f6" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={shortVND} tickLine={false} axisLine={false} width={48} />
                      <RechartsTooltip formatter={(v) => formatVND(Number(v || 0))} />
                      <Area
                        type="monotone"
                        dataKey="nap"
                        name="Nạp"
                        stroke="#34d399"
                        fill="url(#dashNap)"
                        strokeWidth={3}
                      />
                      <Area
                        type="monotone"
                        dataKey="rut"
                        name="Rút"
                        stroke="#f472b6"
                        fill="url(#dashRut)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} xl={8}>
            <Card className="dash-panel" title="Sức khỏe vận hành">
              <div className="dash-health">
                <div className="dash-health-item">
                  <div className="dash-health-top">
                    <CheckCircleOutlined style={{ color: '#10b981' }} />
                    <span>Tỷ lệ GD thành công</span>
                    <strong>{stats.successRate}%</strong>
                  </div>
                  <Progress percent={stats.successRate} showInfo={false} strokeColor="#10b981" />
                </div>
                <div className="dash-health-item">
                  <div className="dash-health-top">
                    <ClockCircleOutlined style={{ color: '#3b82f6' }} />
                    <span>Đang xử lý / chờ</span>
                    <strong>{stats.pendingCount}</strong>
                  </div>
                  <Progress
                    percent={
                      stats.txCount ? Math.round((stats.pendingCount / stats.txCount) * 100) : 0
                    }
                    showInfo={false}
                    strokeColor="#3b82f6"
                  />
                </div>
                <div className="dash-health-item">
                  <div className="dash-health-top">
                    <CloseCircleOutlined style={{ color: '#ef4444' }} />
                    <span>Giao dịch thất bại</span>
                    <strong>{stats.failedCount}</strong>
                  </div>
                  <Progress
                    percent={
                      stats.txCount ? Math.round((stats.failedCount / stats.txCount) * 100) : 0
                    }
                    showInfo={false}
                    strokeColor="#ef4444"
                  />
                </div>
              </div>

              <div className="dash-service-list">
                <div className="dash-service-row">
                  <span>
                    <ApiOutlined /> API Admin
                  </span>
                  <Tag color="success">Hoạt động</Tag>
                </div>
                <div className="dash-service-row">
                  <span>
                    <BankOutlined /> Nạp SePay
                  </span>
                  <Tag color={stats.topUpCount > 0 ? 'success' : 'default'}>
                    {stats.topUpCount > 0 ? 'Có dữ liệu' : 'Chưa có GD'}
                  </Tag>
                </div>
                <div className="dash-service-row">
                  <span>
                    <DollarCircleOutlined /> Rút PayOS
                  </span>
                  <Tag color={stats.withdrawCount > 0 ? 'success' : 'default'}>
                    {stats.withdrawCount > 0 ? 'Có dữ liệu' : 'Chưa có GD'}
                  </Tag>
                </div>
                <div className="dash-service-row">
                  <span>
                    <SafetyCertificateOutlined /> Tài khoản khóa
                  </span>
                  <Tag color={stats.lockedUsers > 0 ? 'warning' : 'success'}>
                    {stats.lockedUsers} user
                  </Tag>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[14, 14]} style={{ marginTop: 14 }}>
          <Col span={24}>
            <Card
              className="dash-panel"
              title="Giao dịch gần đây"
              extra={
                <Button type="link" onClick={() => navigate('/reports')}>
                  Xem phân tích
                </Button>
              }
            >
              <Table
                rowKey={(r) => `${r.transactionCode}-${r.createdAt}`}
                size="middle"
                pagination={false}
                columns={columns}
                dataSource={recentTx}
                locale={{ emptyText: <Empty description="Chưa có giao dịch" /> }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};
