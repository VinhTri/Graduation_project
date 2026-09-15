import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Empty, Skeleton, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowDownOutlined, ArrowRightOutlined, ArrowUpOutlined, CheckCircleOutlined, ClockCircleOutlined, ReloadOutlined, TeamOutlined, WarningOutlined, WalletOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api';
import './Dashboard.css';

interface Metrics { users: number; activeUsers: number; lockedUsers: number; walletBalance: number; topUpAmount: number; withdrawAmount: number; transactions: number; successfulTransactions: number; pendingTransactions: number; failedTransactions: number; activeFunds: number; pendingSplitBills: number; overdueInvoices: number; openTickets: number; unreadNotifications: number }
interface TrendPoint { date: string; topUp: number; withdraw: number }
interface RecentTransaction { id: number; transactionCode: string; username?: string; type: string; status: string; amount: number; createdAt: string }
interface OperationAlert { type: string; title: string; count: number; route: string; severity: number }
interface DashboardData { metrics: Metrics; trend: TrendPoint[]; recentTransactions: RecentTransaction[]; alerts: OperationAlert[] }

const EMPTY_METRICS: Metrics = { users: 0, activeUsers: 0, lockedUsers: 0, walletBalance: 0, topUpAmount: 0, withdrawAmount: 0, transactions: 0, successfulTransactions: 0, pendingTransactions: 0, failedTransactions: 0, activeFunds: 0, pendingSplitBills: 0, overdueInvoices: 0, openTickets: 0, unreadNotifications: 0 };
const TYPE_LABEL: Record<string, string> = { TOP_UP: 'Nạp tiền', WITHDRAW: 'Rút tiền', TRANSFER: 'Chuyển tiền', RECEIVE_TRANSFER: 'Nhận tiền', PAYMENT: 'Thanh toán' };
const formatMoney = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
const shortMoney = (value: number) => value >= 1_000_000_000 ? `${(value / 1_000_000_000).toFixed(1)} tỷ` : value >= 1_000_000 ? `${(value / 1_000_000).toFixed(0)} tr` : value >= 1_000 ? `${(value / 1_000).toFixed(0)}k` : String(value);

export const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({ metrics: EMPTY_METRICS, trend: [], recentTransactions: [], alerts: [] });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/v1/admin/dashboard/overview');
      const payload = response.data?.data ?? response.data;
      setData({ metrics: { ...EMPTY_METRICS, ...(payload?.metrics || {}) }, trend: payload?.trend || [], recentTransactions: payload?.recentTransactions || [], alerts: payload?.alerts || [] });
    } catch (error: unknown) {
      const apiMessage = axios.isAxiosError(error) ? error.response?.data?.message : null;
      message.error(apiMessage || 'Không tải được tổng quan vận hành');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const successRate = useMemo(() => data.metrics.transactions ? Math.round(data.metrics.successfulTransactions * 1000 / data.metrics.transactions) / 10 : 0, [data.metrics]);
  const columns: ColumnsType<RecentTransaction> = [
    { title: 'Mã giao dịch', dataIndex: 'transactionCode', render: (value: string) => <strong className="dashboard-code">{value}</strong> },
    { title: 'Người dùng', dataIndex: 'username', render: (value?: string) => value || '—' },
    { title: 'Loại', dataIndex: 'type', render: (value: string) => <Tag>{TYPE_LABEL[value] || value}</Tag> },
    { title: 'Số tiền', dataIndex: 'amount', align: 'right', render: (value: number, row) => <strong className={row.type === 'WITHDRAW' ? 'money-out' : 'money-in'}>{row.type === 'WITHDRAW' ? '−' : '+'}{formatMoney(value)}</strong> },
    { title: 'Trạng thái', dataIndex: 'status', render: (value: string) => <Tag color={value === 'SUCCESS' ? 'success' : value === 'FAILED' ? 'error' : 'processing'}>{value === 'SUCCESS' ? 'Thành công' : value === 'FAILED' ? 'Thất bại' : 'Đang chờ'}</Tag> },
    { title: 'Thời gian', dataIndex: 'createdAt', render: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm') },
  ];

  if (loading) return <div className="dashboard-loading"><Skeleton active paragraph={{ rows: 14 }} /></div>;

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy"><span>Trung tâm vận hành · {dayjs().format('DD/MM/YYYY')}</span><h2>Dòng tiền rõ ràng.<br />Sự cố được nhìn thấy sớm.</h2><p>Dữ liệu tổng hợp trực tiếp từ sổ cái, ví MAIN và các nghiệp vụ người dùng.</p></div>
        <div className="dashboard-hero-balance"><small>Tổng số dư ví MAIN</small><strong>{formatMoney(data.metrics.walletBalance)}</strong><span>{data.metrics.activeUsers} người dùng đang hoạt động</span><Button icon={<ReloadOutlined />} onClick={() => void load()}>Đồng bộ</Button></div>
      </section>

      <section className="dashboard-kpis">
        <button onClick={() => navigate('/users')}><TeamOutlined /><span>Người dùng</span><strong>{data.metrics.users.toLocaleString('vi-VN')}</strong><small>{data.metrics.lockedUsers} đang khóa</small></button>
        <button onClick={() => navigate('/transaction-history')}><ArrowDownOutlined /><span>Tổng nạp</span><strong>{formatMoney(data.metrics.topUpAmount)}</strong><small>Giao dịch thành công</small></button>
        <button onClick={() => navigate('/transaction-history')}><ArrowUpOutlined /><span>Tổng rút</span><strong>{formatMoney(data.metrics.withdrawAmount)}</strong><small>Giao dịch thành công</small></button>
        <button onClick={() => navigate('/transaction-history')}><WalletOutlined /><span>Tỷ lệ thành công</span><strong>{successRate}%</strong><small>{data.metrics.transactions} giao dịch</small></button>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-panel dashboard-chart-panel"><header><div><span>Dòng tiền 7 ngày</span><h3>Nạp và rút khỏi hệ thống</h3></div><button onClick={() => navigate('/transaction-history')}>Xem giao dịch <ArrowRightOutlined /></button></header><div className="dashboard-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.trend} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}><defs><linearGradient id="topUpArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7C3AED" stopOpacity=".34"/><stop offset="1" stopColor="#7C3AED" stopOpacity="0"/></linearGradient><linearGradient id="withdrawArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b76e5d" stopOpacity=".24"/><stop offset="1" stopColor="#b76e5d" stopOpacity="0"/></linearGradient></defs><CartesianGrid vertical={false} stroke="#e9eeeb" strokeDasharray="4 5" /><XAxis dataKey="date" tickFormatter={(value) => dayjs(value).format('DD/MM')} axisLine={false} tickLine={false} /><YAxis tickFormatter={shortMoney} axisLine={false} tickLine={false} width={58} /><Tooltip formatter={(value) => formatMoney(Number(value || 0))} labelFormatter={(value) => dayjs(value).format('DD/MM/YYYY')} /><Area type="monotone" dataKey="topUp" name="Nạp" stroke="#EC4899" strokeWidth={2.5} fill="url(#topUpArea)" /><Area type="monotone" dataKey="withdraw" name="Rút" stroke="#a85d4c" strokeWidth={2.5} fill="url(#withdrawArea)" /></AreaChart></ResponsiveContainer></div></article>
        <aside className="dashboard-panel dashboard-alerts"><header><div><span>Cần chú ý</span><h3>Hàng đợi hỗ trợ tài chính</h3></div></header>{data.alerts.filter((alert) => ['/transaction-history', '/transactions', '/support'].includes(alert.route)).length === 0 ? <div className="dashboard-clear"><CheckCircleOutlined /><strong>Không có cảnh báo</strong><span>Các giao dịch nạp và rút đang vận hành bình thường.</span></div> : data.alerts.filter((alert) => ['/transaction-history', '/transactions', '/support'].includes(alert.route)).map((alert) => <button key={alert.type} onClick={() => navigate(alert.route)}><span className={alert.severity > 1 ? 'is-critical' : ''}>{alert.severity > 1 ? <WarningOutlined /> : <ClockCircleOutlined />}</span><div><strong>{alert.title}</strong><small>{alert.count} mục cần kiểm tra</small></div><ArrowRightOutlined /></button>)}</aside>
      </section>

      <section className="dashboard-ops-strip">
        <button onClick={() => navigate('/transaction-history')}><span>Giao dịch chờ xử lý</span><strong>{data.metrics.pendingTransactions}</strong></button>
        <button onClick={() => navigate('/transaction-history')}><span>Giao dịch thất bại</span><strong>{data.metrics.failedTransactions}</strong></button>
        <button onClick={() => navigate('/support')}><span>Yêu cầu hỗ trợ chưa đóng</span><strong>{data.metrics.openTickets}</strong></button>
        <button onClick={() => navigate('/notifications')}><span>Thông báo chưa đọc</span><strong>{data.metrics.unreadNotifications}</strong></button>
      </section>

      <section className="dashboard-panel dashboard-table"><header><div><span>Nạp và rút gần nhất</span><h3>Giao dịch cần theo dõi</h3></div><button onClick={() => navigate('/transaction-history')}>Xem tất cả <ArrowRightOutlined /></button></header><Table rowKey="id" columns={columns} dataSource={data.recentTransactions.filter((item) => item.type === 'TOP_UP' || item.type === 'WITHDRAW')} pagination={false} scroll={{ x: 880 }} locale={{ emptyText: <Empty description="Chưa có giao dịch nạp hoặc rút" /> }} /></section>
    </main>
  );
};
