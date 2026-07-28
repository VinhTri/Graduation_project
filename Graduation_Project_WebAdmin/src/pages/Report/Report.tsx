import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Select,
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
  ReloadOutlined,
  DownloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import dayjs from 'dayjs';
import { apiClient } from '../../services/api';
import './Report.css';

const { Text } = Typography;

type TimeRange = '7days' | '30days' | '90days' | 'all';

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
  note?: string;
  createdAt: string;
  username?: string;
}

interface PostItem {
  id: number;
  title: string;
  active: boolean;
  createdAt?: string;
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

const STATUS_LABEL: Record<string, string> = {
  SUCCESS: 'Thành công',
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLOR: Record<string, string> = {
  SUCCESS: '#10b981',
  PENDING: '#f59e0b',
  PROCESSING: '#3b82f6',
  FAILED: '#ef4444',
  CANCELLED: '#94a3b8',
};

const CHART = {
  pink: '#f472b6',
  purple: '#8b5cf6',
  blue: '#60a5fa',
  green: '#34d399',
  orange: '#fb923c',
  red: '#f87171',
};

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
    value || 0
  );

const shortVND = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
};

const isUserActive = (u: UserItem) => u.active ?? u.isActive ?? true;

export const Report: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
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
      setUsers(userList);
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
      message.error(error?.response?.data?.message || 'Không tải được dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTx = useMemo(() => {
    if (timeRange === 'all') return transactions;
    const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    const from = dayjs().subtract(days, 'day').startOf('day');
    return transactions.filter((tx) => dayjs(tx.createdAt).isAfter(from));
  }, [transactions, timeRange]);

  const stats = useMemo(() => {
    const endUsers = users.filter((u) => u.role !== 'ADMIN');
    const activeUsers = endUsers.filter(isUserActive);
    const topUp = filteredTx.filter((t) => t.type === 'TOP_UP');
    const withdraw = filteredTx.filter((t) => t.type === 'WITHDRAW');
    const success = filteredTx.filter((t) => t.status === 'SUCCESS');
    const failed = filteredTx.filter((t) => t.status === 'FAILED');
    const pending = filteredTx.filter((t) => t.status === 'PENDING' || t.status === 'PROCESSING');

    const topUpAmount = topUp.reduce((s, t) => s + t.amount, 0);
    const withdrawAmount = withdraw.reduce((s, t) => s + t.amount, 0);
    const successRate = filteredTx.length
      ? Math.round((success.length / filteredTx.length) * 1000) / 10
      : 0;

    return {
      totalUsers: endUsers.length,
      activeUsers: activeUsers.length,
      inactiveUsers: endUsers.length - activeUsers.length,
      totalPosts: posts.length,
      activePosts: posts.filter((p) => p.active).length,
      txCount: filteredTx.length,
      topUpCount: topUp.length,
      withdrawCount: withdraw.length,
      topUpAmount,
      withdrawAmount,
      netFlow: topUpAmount - withdrawAmount,
      successCount: success.length,
      failedCount: failed.length,
      pendingCount: pending.length,
      successRate,
      totalWalletBalance,
    };
  }, [users, posts, filteredTx, totalWalletBalance]);

  const trendData = useMemo(() => {
    const days = timeRange === '7days' ? 7 : timeRange === '90days' ? 14 : 10;
    const bucketDays = timeRange === '90days' ? 90 : timeRange === 'all' ? 30 : timeRange === '7days' ? 7 : 30;
    const points = Math.min(days, bucketDays);
    const step = Math.max(1, Math.floor(bucketDays / points));

    return Array.from({ length: points }).map((_, i) => {
      const start = dayjs()
        .subtract(bucketDays - 1 - i * step, 'day')
        .startOf('day');
      const end = start.add(step, 'day');
      const inBucket = filteredTx.filter((tx) => {
        const d = dayjs(tx.createdAt);
        return (d.isAfter(start) || d.isSame(start)) && d.isBefore(end);
      });
      const nap = inBucket.filter((t) => t.type === 'TOP_UP').reduce((s, t) => s + t.amount, 0);
      const rut = inBucket.filter((t) => t.type === 'WITHDRAW').reduce((s, t) => s + t.amount, 0);
      return {
        name: start.format('DD/MM'),
        nap,
        rut,
        count: inBucket.length,
      };
    });
  }, [filteredTx, timeRange]);

  const typeBarData = useMemo(() => {
    const map = new Map<string, number>();
    filteredTx.forEach((tx) => {
      map.set(tx.type, (map.get(tx.type) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([type, count]) => ({
        type: TYPE_LABEL[type] || type,
        count,
        fill:
          type === 'TOP_UP'
            ? CHART.green
            : type === 'WITHDRAW'
              ? CHART.pink
              : type === 'TRANSFER'
                ? CHART.purple
                : CHART.blue,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredTx]);

  const statusPieData = useMemo(() => {
    const keys = ['SUCCESS', 'PENDING', 'PROCESSING', 'FAILED', 'CANCELLED'] as const;
    return keys
      .map((key) => ({
        name: STATUS_LABEL[key],
        value: filteredTx.filter((t) => t.status === key).length,
        color: STATUS_COLOR[key],
      }))
      .filter((x) => x.value > 0);
  }, [filteredTx]);

  const flowCards = [
    {
      key: 'topup',
      title: 'Luồng nạp tiền',
      desc: 'SePay / top-up vào ví',
      value: formatVND(stats.topUpAmount),
      meta: `${stats.topUpCount} giao dịch`,
      icon: <ArrowDownOutlined />,
      tone: 'green',
    },
    {
      key: 'withdraw',
      title: 'Luồng rút tiền',
      desc: 'PayOS / rút về ngân hàng',
      value: formatVND(stats.withdrawAmount),
      meta: `${stats.withdrawCount} giao dịch`,
      icon: <ArrowUpOutlined />,
      tone: 'pink',
    },
    {
      key: 'users',
      title: 'Người dùng',
      desc: 'Tài khoản end-user trong hệ thống',
      value: `${stats.activeUsers}/${stats.totalUsers}`,
      meta: `${stats.inactiveUsers} đang khóa`,
      icon: <UserOutlined />,
      tone: 'purple',
    },
    {
      key: 'posts',
      title: 'Nội dung / bài viết',
      desc: 'Nội dung hiển thị trên app',
      value: `${stats.activePosts}/${stats.totalPosts}`,
      meta: 'Đang active / tổng bài',
      icon: <FileTextOutlined />,
      tone: 'blue',
    },
  ];

  const highlightColumns = [
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
        const color =
          status === 'SUCCESS'
            ? 'success'
            : status === 'FAILED'
              ? 'error'
              : status === 'CANCELLED'
                ? 'default'
                : 'processing';
        return <Tag color={color}>{STATUS_LABEL[status] || status}</Tag>;
      },
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
  ];

  const topTx = useMemo(
    () =>
      [...filteredTx]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8),
    [filteredTx]
  );

  return (
    <div className="report-page">
      <div className="report-hero">
        <div>
          <div className="report-hero-kicker">
            <RiseOutlined /> Phân tích hệ thống SmartSpend
          </div>
          <h2>Báo cáo tổng quan vận hành</h2>
          <p>
            Tổng hợp theo các luồng sẵn có: nạp ví, rút ngân hàng, người dùng, bài viết và chất lượng
            giao dịch.
          </p>
        </div>
        <Space wrap>
          <Select
            value={timeRange}
            style={{ width: 160 }}
            onChange={(v: TimeRange) => setTimeRange(v)}
            options={[
              { value: '7days', label: '7 ngày qua' },
              { value: '30days', label: '30 ngày qua' },
              { value: '90days', label: '90 ngày qua' },
              { value: 'all', label: 'Toàn bộ dữ liệu' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            Làm mới
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} disabled>
            Xuất báo cáo
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[14, 14]} className="report-kpi-row">
          <Col xs={24} sm={12} xl={6}>
            <Card className="report-kpi">
              <div className="report-kpi-icon pink">
                <SwapOutlined />
              </div>
              <div>
                <span>Tổng giao dịch</span>
                <strong>{stats.txCount}</strong>
                <small>Trong kỳ đã chọn</small>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="report-kpi">
              <div className="report-kpi-icon green">
                <WalletOutlined />
              </div>
              <div>
                <span>Dòng tiền ròng</span>
                <strong>{formatVND(stats.netFlow)}</strong>
                <small>Nạp − Rút</small>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="report-kpi">
              <div className="report-kpi-icon purple">
                <CheckCircleOutlined />
              </div>
              <div>
                <span>Tỷ lệ thành công</span>
                <strong>{stats.successRate}%</strong>
                <small>
                  {stats.successCount} thành công / {stats.failedCount} thất bại
                </small>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card className="report-kpi">
              <div className="report-kpi-icon blue">
                <WalletOutlined />
              </div>
              <div>
                <span>Số dư ví hệ thống</span>
                <strong>{formatVND(stats.totalWalletBalance)}</strong>
                <small>Tổng balance người dùng</small>
              </div>
            </Card>
          </Col>
        </Row>

        <div className="report-section-label">Luồng nghiệp vụ chính</div>
        <Row gutter={[14, 14]}>
          {flowCards.map((item) => (
            <Col xs={24} md={12} xl={6} key={item.key}>
              <div className={`report-flow-card tone-${item.tone}`}>
                <div className="report-flow-icon">{item.icon}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  <strong>{item.value}</strong>
                  <span>{item.meta}</span>
                </div>
              </div>
            </Col>
          ))}
        </Row>

        <Row gutter={[14, 14]} style={{ marginTop: 14 }}>
          <Col xs={24} xl={16}>
            <Card
              className="report-chart-card"
              title="Xu hướng nạp / rút theo thời gian"
              extra={<Text type="secondary">Theo dữ liệu giao dịch gần nhất</Text>}
            >
              {trendData.every((d) => d.nap === 0 && d.rut === 0) ? (
                <Empty description="Chưa có dữ liệu giao dịch trong kỳ" />
              ) : (
                <div className="report-chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="napFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART.green} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={CHART.green} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="rutFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART.pink} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART.pink} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1e7f6" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis
                        tickFormatter={shortVND}
                        tickLine={false}
                        axisLine={false}
                        width={48}
                      />
                      <RechartsTooltip
                        formatter={(value) => formatVND(Number(value || 0))}
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #f3e8ff',
                          boxShadow: '0 8px 24px rgba(91,33,182,0.08)',
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="nap"
                        name="Nạp tiền"
                        stroke={CHART.green}
                        fill="url(#napFill)"
                        strokeWidth={3}
                      />
                      <Area
                        type="monotone"
                        dataKey="rut"
                        name="Rút tiền"
                        stroke={CHART.pink}
                        fill="url(#rutFill)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} xl={8}>
            <Card className="report-chart-card" title="Chất lượng giao dịch">
              {statusPieData.length === 0 ? (
                <Empty description="Chưa có dữ liệu trạng thái" />
              ) : (
                <>
                  <div className="report-chart-box short">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={58}
                          outerRadius={86}
                          paddingAngle={4}
                        >
                          {statusPieData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="report-progress-list">
                    <div>
                      <div className="report-progress-head">
                        <span>Thành công</span>
                        <span>{stats.successRate}%</span>
                      </div>
                      <Progress percent={stats.successRate} showInfo={false} strokeColor="#10b981" />
                    </div>
                    <div>
                      <div className="report-progress-head">
                        <span>Đang xử lý</span>
                        <span>{stats.pendingCount}</span>
                      </div>
                      <Progress
                        percent={
                          stats.txCount ? Math.round((stats.pendingCount / stats.txCount) * 100) : 0
                        }
                        showInfo={false}
                        strokeColor="#3b82f6"
                      />
                    </div>
                    <div>
                      <div className="report-progress-head">
                        <span>Thất bại</span>
                        <span>{stats.failedCount}</span>
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
                </>
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[14, 14]} style={{ marginTop: 14 }}>
          <Col xs={24} lg={10}>
            <Card className="report-chart-card" title="Phân bố theo loại giao dịch">
              {typeBarData.length === 0 ? (
                <Empty description="Chưa có giao dịch để phân tích" />
              ) : (
                <div className="report-chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={typeBarData} layout="vertical" margin={{ left: 8, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1e7f6" />
                      <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="type"
                        width={100}
                        tickLine={false}
                        axisLine={false}
                      />
                      <RechartsTooltip />
                      <Bar dataKey="count" name="Số GD" radius={[0, 8, 8, 0]}>
                        {typeBarData.map((entry) => (
                          <Cell key={entry.type} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card
              className="report-chart-card"
              title="Giao dịch nổi bật"
              extra={<Text type="secondary">Top theo số tiền</Text>}
            >
              <Table
                rowKey={(r) => `${r.transactionCode}-${r.createdAt}`}
                size="middle"
                pagination={false}
                columns={highlightColumns}
                dataSource={topTx}
                locale={{ emptyText: <Empty description="Chưa có giao dịch" /> }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};
