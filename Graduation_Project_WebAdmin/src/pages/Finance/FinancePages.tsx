import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Descriptions, Drawer, Empty, Input, Skeleton, Table, Tabs, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AuditOutlined, EyeOutlined, ReloadOutlined, SearchOutlined, WalletOutlined, WarningOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { apiClient } from '../../services/api';
import './FinancePages.css';

type DataRow = Record<string, unknown> & { id: number };
interface WalletDetail { wallet: DataRow; moneyIn: number; moneyOut: number; ledger: DataRow[]; transactions: DataRow[] }
interface Issue { type: string; severity: string; walletId?: number; accountNumber?: string; username?: string; transactionCode?: string; amount: number; description: string }
interface Reconciliation { walletCount: number; transactionCount: number; ledgerCount: number; totalWalletBalance: number; criticalCount: number; highCount: number; mediumCount: number; issues: Issue[] }
const money = (value: unknown) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
const date = (value: unknown) => value ? dayjs(String(value)).format('DD/MM/YYYY HH:mm') : '—';

export function WalletManagementPage() {
  const [rows, setRows] = useState<DataRow[]>([]); const [query, setQuery] = useState(''); const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<WalletDetail | null>(null); const [detailLoading, setDetailLoading] = useState(false);
  const load = useCallback(async () => { setLoading(true); try { const res = await apiClient.get('/api/v1/admin/operations/wallets'); setRows(res.data?.data ?? []); } catch { message.error('Không tải được danh sách ví'); } finally { setLoading(false); } }, []);
  // Initial server synchronization for this route.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  const open = async (id: number) => { setDetailLoading(true); setDetail({ wallet: { id }, moneyIn: 0, moneyOut: 0, ledger: [], transactions: [] }); try { const res = await apiClient.get(`/api/v1/admin/finance/wallets/${id}`); setDetail(res.data?.data); } catch { message.error('Không tải được chi tiết ví'); setDetail(null); } finally { setDetailLoading(false); } };
  const filtered = useMemo(() => { const q = query.toLowerCase().trim(); return rows.filter((row) => !q || Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q))); }, [query, rows]);
  const columns: ColumnsType<DataRow> = [
    { title: 'Ví', key: 'wallet', render: (_, row) => <div className="finance-main"><strong>{String(row.name ?? '—')}</strong><span>{String(row.accountNumber ?? 'Chưa có số tài khoản')}</span></div> },
    { title: 'Chủ sở hữu', key: 'owner', render: (_, row) => <div className="finance-main"><strong>{String(row.username ?? '—')}</strong><span>{String(row.email ?? '—')}</span></div> },
    { title: 'Loại', dataIndex: 'type', render: (v) => <Tag>{String(v)}</Tag> },
    { title: 'Số dư', dataIndex: 'balance', align: 'right', render: (v) => <strong className="finance-money">{money(v)}</strong> },
    { title: 'Trạng thái', dataIndex: 'status', render: (v) => <Tag color={v === 'ACTIVE' ? 'success' : 'error'}>{v === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}</Tag> },
    { title: '', width: 100, render: (_, row) => <Button type="link" icon={<EyeOutlined />} onClick={() => void open(row.id)}>Chi tiết</Button> },
  ];
  const ledgerColumns: ColumnsType<DataRow> = [
    { title: 'Mã', dataIndex: 'transactionCode', render: (v) => <code>{String(v)}</code> }, { title: 'Chiều', dataIndex: 'type', render: (v) => <Tag color={v === 'TOP_UP' ? 'success' : 'error'}>{v === 'TOP_UP' ? 'Tiền vào' : 'Tiền ra'}</Tag> }, { title: 'Số tiền', dataIndex: 'amount', align: 'right', render: money }, { title: 'Nội dung', dataIndex: 'note', ellipsis: true, render: (v) => String(v ?? '—') }, { title: 'Thời gian', dataIndex: 'createdAt', render: date },
  ];
  const txColumns: ColumnsType<DataRow> = [
    { title: 'Mã', dataIndex: 'transactionCode', render: (v) => <code>{String(v)}</code> }, { title: 'Loại', dataIndex: 'type', render: (v) => <Tag>{String(v)}</Tag> }, { title: 'Trạng thái', dataIndex: 'status', render: (v) => <Tag color={v === 'SUCCESS' ? 'success' : v === 'FAILED' ? 'error' : 'processing'}>{String(v)}</Tag> }, { title: 'Số tiền', dataIndex: 'amount', align: 'right', render: money }, { title: 'Thời gian', dataIndex: 'createdAt', render: date },
  ];
  return <main className="finance-page"><FinanceHero icon={<WalletOutlined />} eyebrow="Tài sản hệ thống" title="Ví và sổ cái" description="Theo dõi số dư, hạn mức và hai lớp ghi nhận giao dịch của từng ví." action={<Button icon={<ReloadOutlined />} loading={loading} onClick={() => void load()}>Làm mới</Button>} /><section className="finance-stats"><div><span>Tổng ví</span><strong>{rows.length}</strong></div><div><span>Tổng số dư</span><strong>{money(rows.reduce((s, r) => s + Number(r.balance || 0), 0))}</strong></div><div><span>Ví đang hoạt động</span><strong>{rows.filter((r) => r.status === 'ACTIVE').length}</strong></div></section><section className="finance-table"><div className="finance-toolbar"><Input allowClear prefix={<SearchOutlined />} placeholder="Tìm ví, số tài khoản hoặc người dùng" value={query} onChange={(e) => setQuery(e.target.value)} /></div>{loading ? <Skeleton active paragraph={{ rows: 9 }} /> : <Table rowKey="id" columns={columns} dataSource={filtered} scroll={{ x: 920 }} pagination={{ pageSize: 12, showSizeChanger: false }} locale={{ emptyText: <Empty description="Chưa có ví" /> }} />}</section><Drawer className="finance-drawer" width={880} title="Chi tiết ví và sổ cái" open={!!detail} onClose={() => setDetail(null)} loading={detailLoading} destroyOnClose>{detail && detail.wallet.name ? <><section className="finance-wallet-head"><div><span>{String(detail.wallet.type)}</span><h3>{String(detail.wallet.name)}</h3><p>{String(detail.wallet.username)} · {String(detail.wallet.email)}</p></div><strong>{money(detail.wallet.balance)}</strong></section><section className="finance-mini-stats"><div><span>Tổng tiền vào</span><strong>{money(detail.moneyIn)}</strong></div><div><span>Tổng tiền ra</span><strong>{money(detail.moneyOut)}</strong></div><div><span>Số tài khoản</span><strong>{String(detail.wallet.accountNumber ?? '—')}</strong></div></section><Descriptions bordered size="small" column={2} items={[{ key: 'limit', label: 'Hạn mức giao dịch', children: detail.wallet.limitEnabled ? money(detail.wallet.transactionLimit) : 'Không bật' }, { key: 'daily', label: 'Hạn mức ngày', children: detail.wallet.limitEnabled ? money(detail.wallet.dailyLimit) : 'Không bật' }, { key: 'created', label: 'Ngày tạo', children: date(detail.wallet.createdAt) }]} /><Tabs items={[{ key: 'ledger', label: `Sổ cái (${detail.ledger.length})`, children: <Table rowKey="id" size="small" columns={ledgerColumns} dataSource={detail.ledger} scroll={{ x: 760 }} pagination={{ pageSize: 10 }} /> }, { key: 'transactions', label: `Transaction (${detail.transactions.length})`, children: <Table rowKey="id" size="small" columns={txColumns} dataSource={detail.transactions} scroll={{ x: 720 }} pagination={{ pageSize: 10 }} /> }]} /></> : <Skeleton active />}</Drawer></main>;
}

export function FinanceReconciliationPage() {
  const [data, setData] = useState<Reconciliation | null>(null); const [loading, setLoading] = useState(true); const [severity, setSeverity] = useState('ALL');
  const load = useCallback(async () => { setLoading(true); try { const res = await apiClient.get('/api/v1/admin/finance/reconciliation'); setData(res.data?.data); } catch (error: unknown) { const msg = axios.isAxiosError(error) ? error.response?.data?.message : null; message.error(msg || 'Không chạy được đối soát sổ cái'); } finally { setLoading(false); } }, []);
  // Initial server synchronization for this route.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  const issues = (data?.issues || []).filter((item) => severity === 'ALL' || item.severity === severity);
  const columns: ColumnsType<Issue> = [
    { title: 'Mức độ', dataIndex: 'severity', width: 110, render: (v) => <Tag color={v === 'CRITICAL' ? 'error' : v === 'HIGH' ? 'volcano' : 'warning'} icon={<WarningOutlined />}>{String(v)}</Tag> }, { title: 'Loại sai lệch', dataIndex: 'type', width: 220, render: (v) => <strong>{String(v)}</strong> }, { title: 'Ví / người dùng', key: 'wallet', width: 210, render: (_, r) => <div className="finance-main"><strong>{r.username || '—'}</strong><span>{r.accountNumber || `Ví #${r.walletId ?? '—'}`}</span></div> }, { title: 'Mã giao dịch', dataIndex: 'transactionCode', width: 190, render: (v) => v ? <code>{v}</code> : '—' }, { title: 'Giá trị', dataIndex: 'amount', align: 'right', width: 150, render: money }, { title: 'Mô tả', dataIndex: 'description', ellipsis: true },
  ];
  return <main className="finance-page"><FinanceHero icon={<AuditOutlined />} eyebrow="Kiểm soát tài chính" title="Đối soát sổ cái" description="So khớp Transaction, WalletTransaction và số dư ví để phát hiện dữ liệu thiếu hoặc sai chiều." action={<Button type="primary" icon={<ReloadOutlined />} loading={loading} onClick={() => void load()}>Chạy đối soát</Button>} /><section className="finance-stats finance-stats-five"><div><span>Tổng số dư ví</span><strong>{money(data?.totalWalletBalance)}</strong></div><div><span>Ví</span><strong>{data?.walletCount ?? 0}</strong></div><div><span>Nghiêm trọng</span><strong className="critical">{data?.criticalCount ?? 0}</strong></div><div><span>Mức cao</span><strong className="high">{data?.highCount ?? 0}</strong></div><div><span>Cần xác minh</span><strong>{data?.mediumCount ?? 0}</strong></div></section><section className="finance-table"><div className="finance-toolbar finance-toolbar-right"><div><strong>{issues.length} sai lệch</strong><span>Transaction: {data?.transactionCount ?? 0} · Ledger: {data?.ledgerCount ?? 0}</span></div><Tabs activeKey={severity} onChange={setSeverity} items={[{ key: 'ALL', label: 'Tất cả' }, { key: 'CRITICAL', label: 'Critical' }, { key: 'HIGH', label: 'High' }, { key: 'MEDIUM', label: 'Medium' }]} /></div>{loading ? <Skeleton active paragraph={{ rows: 9 }} /> : <Table rowKey={(r) => `${r.type}-${r.walletId}-${r.transactionCode}`} columns={columns} dataSource={issues} scroll={{ x: 1150 }} pagination={{ pageSize: 15, showSizeChanger: false }} locale={{ emptyText: <Empty description="Không phát hiện sai lệch" /> }} />}</section></main>;
}

function FinanceHero({ icon, eyebrow, title, description, action }: { icon: ReactNode; eyebrow: string; title: string; description: string; action: ReactNode }) { return <section className="finance-hero"><div className="finance-hero-icon">{icon}</div><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{action}</section>; }
