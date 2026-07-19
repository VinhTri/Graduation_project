import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AlertOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
  WarningOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '../../services/api';
import './SePayReconciliation.css';

const { Title, Text, Paragraph } = Typography;

interface SePayTransactionRow {
  id: number;
  sepayId: number;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  content?: string;
  transferType?: string;
  transferAmount?: number;
  referenceCode?: string;
  parsedWalletAccount?: string;
  matchStatus: string;
  matchNote?: string;
  createdAt?: string;
  internalTransactionId?: number;
  internalTransactionCode?: string;
  internalAmount?: number;
  internalStatus?: string;
  username?: string;
  userEmail?: string;
  walletAccountNumber?: string;
}

interface ReconciliationIssue {
  issueType: string;
  severity: string;
  description: string;
  sepayRecordId?: number;
  sepayId?: number;
  sepayAmount?: number;
  internalTransactionId?: number;
  internalTransactionCode?: string;
  internalAmount?: number;
  username?: string;
  walletAccountNumber?: string;
  detectedAt?: string;
}

interface ReconciliationReport {
  runAt: string;
  totalSePayRecords: number;
  matchedCount: number;
  unmatchedCount: number;
  amountMismatchCount: number;
  ignoredCount: number;
  orphanInternalCount: number;
  unmatchedAmountTotal: number;
  mismatchAmountDelta: number;
  issues: ReconciliationIssue[];
}

const STATUS_META: Record<string, { color: string; label: string }> = {
  MATCHED: { color: 'success', label: 'Đã khớp' },
  UNMATCHED: { color: 'error', label: 'Chưa khớp' },
  AMOUNT_MISMATCH: { color: 'warning', label: 'Lệch số tiền' },
  IGNORED: { color: 'default', label: 'Bỏ qua' },
};

const ISSUE_META: Record<string, { color: string; label: string }> = {
  UNMATCHED_SEPAY: { color: 'red', label: 'SePay chưa cộng ví' },
  AMOUNT_MISMATCH: { color: 'orange', label: 'Lệch số tiền' },
  ORPHAN_INTERNAL: { color: 'gold', label: 'Nội bộ thiếu log SePay' },
};

const formatVnd = (value?: number | null) =>
  value == null
    ? '—'
    : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export const SePayReconciliation: React.FC = () => {
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [rows, setRows] = useState<SePayTransactionRow[]>([]);
  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [creditOpen, setCreditOpen] = useState(false);
  const [creditTarget, setCreditTarget] = useState<SePayTransactionRow | null>(null);
  const [creditAccount, setCreditAccount] = useState('');
  const [crediting, setCrediting] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await apiClient.get('/api/v1/admin/sepay/transactions');
      setRows(res.data?.data ?? []);
    } catch {
      message.error('Không tải được lịch sử SePay');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const loadReport = useCallback(async (persist = false) => {
    setLoadingReport(true);
    try {
      const res = persist
        ? await apiClient.post('/api/v1/admin/sepay/reconciliation/run')
        : await apiClient.get('/api/v1/admin/sepay/reconciliation');
      setReport(res.data?.data ?? null);
      if (persist) {
        message.success('Đã chạy đối soát và cập nhật trạng thái');
        await loadHistory();
      }
    } catch {
      message.error('Không chạy được đối soát');
    } finally {
      setLoadingReport(false);
    }
  }, [loadHistory]);

  useEffect(() => {
    void loadHistory();
    void loadReport(false);
  }, [loadHistory, loadReport]);

  const filteredRows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter && row.matchStatus !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        row.sepayId,
        row.content,
        row.referenceCode,
        row.username,
        row.internalTransactionCode,
        row.parsedWalletAccount,
        row.walletAccountNumber,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, statusFilter, keyword]);

  const openCredit = (row: SePayTransactionRow) => {
    setCreditTarget(row);
    setCreditAccount(row.parsedWalletAccount || row.walletAccountNumber || '');
    setCreditOpen(true);
  };

  const submitCredit = async () => {
    if (!creditTarget) return;
    setCrediting(true);
    try {
      await apiClient.post(`/api/v1/admin/sepay/transactions/${creditTarget.id}/credit`, {
        walletAccountNumber: creditAccount || undefined,
      });
      message.success('Đã cộng tiền thủ công vào ví');
      setCreditOpen(false);
      await Promise.all([loadHistory(), loadReport(false)]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Cộng tiền thất bại';
      message.error(msg);
    } finally {
      setCrediting(false);
    }
  };

  const historyColumns: ColumnsType<SePayTransactionRow> = [
    {
      title: 'SePay ID',
      dataIndex: 'sepayId',
      width: 110,
      render: (v) => <Text code>{v}</Text>,
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      width: 160,
      render: (v?: string) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—'),
    },
    {
      title: 'Số tiền',
      dataIndex: 'transferAmount',
      width: 140,
      render: (v?: number) => <Text strong>{formatVnd(v)}</Text>,
    },
    {
      title: 'Nội dung CK',
      dataIndex: 'content',
      ellipsis: true,
      render: (v?: string) => v || '—',
    },
    {
      title: 'STK ví (parse)',
      dataIndex: 'parsedWalletAccount',
      width: 130,
      render: (v?: string) => v || '—',
    },
    {
      title: 'Giao dịch nội bộ',
      key: 'internal',
      width: 180,
      render: (_, row) =>
        row.internalTransactionCode ? (
          <div>
            <Text code>{row.internalTransactionCode}</Text>
            <div>
              <Text type="secondary">{formatVnd(row.internalAmount)}</Text>
            </div>
          </div>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Người dùng',
      dataIndex: 'username',
      width: 120,
      render: (v?: string) => v || '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'matchStatus',
      width: 130,
      render: (status: string) => {
        const meta = STATUS_META[status] ?? { color: 'default', label: status };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'matchNote',
      ellipsis: true,
      render: (v?: string) => v || '—',
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, row) =>
        row.matchStatus === 'UNMATCHED' ? (
          <Button size="small" type="link" icon={<WalletOutlined />} onClick={() => openCredit(row)}>
            Cộng ví
          </Button>
        ) : null,
    },
  ];

  const issueColumns: ColumnsType<ReconciliationIssue> = [
    {
      title: 'Loại lệch',
      dataIndex: 'issueType',
      width: 180,
      render: (type: string) => {
        const meta = ISSUE_META[type] ?? { color: 'default', label: type };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Mức độ',
      dataIndex: 'severity',
      width: 100,
      render: (v: string) => (
        <Tag color={v === 'HIGH' ? 'red' : 'orange'} icon={<WarningOutlined />}>
          {v}
        </Tag>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: 'SePay',
      key: 'sepay',
      width: 140,
      render: (_, row) =>
        row.sepayId != null ? (
          <div>
            <Text code>{row.sepayId}</Text>
            <div>{formatVnd(row.sepayAmount)}</div>
          </div>
        ) : (
          '—'
        ),
    },
    {
      title: 'Nội bộ',
      key: 'internal',
      width: 160,
      render: (_, row) =>
        row.internalTransactionCode ? (
          <div>
            <Text code>{row.internalTransactionCode}</Text>
            <div>{formatVnd(row.internalAmount)}</div>
          </div>
        ) : (
          '—'
        ),
    },
    {
      title: 'Ví / User',
      key: 'user',
      width: 150,
      render: (_, row) => (
        <div>
          <div>{row.username || '—'}</div>
          <Text type="secondary">{row.walletAccountNumber || '—'}</Text>
        </div>
      ),
    },
    {
      title: '',
      key: 'fix',
      width: 110,
      render: (_, issue) =>
        issue.sepayRecordId && issue.issueType === 'UNMATCHED_SEPAY' ? (
          <Button
            size="small"
            type="link"
            onClick={() => {
              const target = rows.find((r) => r.id === issue.sepayRecordId);
              if (target) openCredit(target);
              else message.warning('Không tìm thấy bản ghi SePay tương ứng');
            }}
          >
            Xử lý
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="sepay-page">
      <div className="sepay-hero">
        <div>
          <div className="sepay-hero-kicker">SePay Integration</div>
          <Title level={2}>Đối soát giao dịch cổng thanh toán</Title>
          <Paragraph>
            Theo dõi webhook SePay và so khớp với Transaction nội bộ để phát hiện tiền vào ngân hàng
            nhưng chưa cộng ví.
          </Paragraph>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => void loadHistory()} loading={loadingHistory}>
            Làm mới lịch sử
          </Button>
          <Button
            type="primary"
            icon={<SyncOutlined />}
            loading={loadingReport}
            onClick={() => void loadReport(true)}
          >
            Chạy đối soát
          </Button>
        </Space>
      </div>

      <Row gutter={[14, 14]} className="sepay-stats">
        <Col xs={12} md={6} lg={4}>
          <Card className="sepay-stat-card">
            <Statistic title="Tổng log SePay" value={report?.totalSePayRecords ?? rows.length} />
          </Card>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Card className="sepay-stat-card sepay-stat-ok">
            <Statistic
              title="Đã khớp"
              value={report?.matchedCount ?? 0}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Card className="sepay-stat-card sepay-stat-bad">
            <Statistic
              title="Chưa khớp"
              value={report?.unmatchedCount ?? 0}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Card className="sepay-stat-card sepay-stat-warn">
            <Statistic title="Lệch số tiền" value={report?.amountMismatchCount ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Card className="sepay-stat-card">
            <Statistic title="Orphan nội bộ" value={report?.orphanInternalCount ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Card className="sepay-stat-card">
            <Statistic
              title="Tiền chưa cộng ví"
              value={report?.unmatchedAmountTotal ?? 0}
              formatter={(v) => formatVnd(Number(v))}
            />
          </Card>
        </Col>
      </Row>

      <Card className="sepay-panel">
        <Tabs
          items={[
            {
              key: 'history',
              label: 'Lịch sử Webhook / SePay',
              children: (
                <>
                  <div className="sepay-toolbar">
                    <Input
                      allowClear
                      prefix={<SearchOutlined />}
                      placeholder="Tìm SePay ID, nội dung, mã GD, user..."
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      style={{ maxWidth: 360 }}
                    />
                    <Select
                      allowClear
                      placeholder="Lọc trạng thái"
                      style={{ width: 180 }}
                      value={statusFilter}
                      onChange={setStatusFilter}
                      options={Object.entries(STATUS_META).map(([value, meta]) => ({
                        value,
                        label: meta.label,
                      }))}
                    />
                  </div>
                  <Table
                    rowKey="id"
                    loading={loadingHistory}
                    columns={historyColumns}
                    dataSource={filteredRows}
                    scroll={{ x: 1200 }}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    locale={{ emptyText: <Empty description="Chưa có webhook SePay nào" /> }}
                  />
                </>
              ),
            },
            {
              key: 'reconcile',
              label: `Kết quả đối soát${report?.issues?.length ? ` (${report.issues.length})` : ''}`,
              children: (
                <>
                  <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                    Báo cáo lần chạy:{' '}
                    {report?.runAt ? dayjs(report.runAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
                    . Các khoản HIGH thường là tiền đã vào ngân hàng nhưng hệ thống chưa cộng ví.
                  </Paragraph>
                  <Table
                    rowKey={(r) =>
                      `${r.issueType}-${r.sepayRecordId ?? 'x'}-${r.internalTransactionId ?? 'y'}-${r.detectedAt}`
                    }
                    loading={loadingReport}
                    columns={issueColumns}
                    dataSource={report?.issues ?? []}
                    scroll={{ x: 1100 }}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: <Empty description="Không phát hiện lệch" /> }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="Cộng tiền thủ công vào ví"
        open={creditOpen}
        onCancel={() => setCreditOpen(false)}
        onOk={() => void submitCredit()}
        confirmLoading={crediting}
        okText="Xác nhận cộng ví"
      >
        <Paragraph>
          SePay ID <Text code>{creditTarget?.sepayId}</Text> —{' '}
          <Text strong>{formatVnd(creditTarget?.transferAmount)}</Text>
        </Paragraph>
        <Paragraph type="secondary">{creditTarget?.content || creditTarget?.matchNote}</Paragraph>
        <Input
          placeholder="STK ví nội bộ (NAP ...)"
          value={creditAccount}
          onChange={(e) => setCreditAccount(e.target.value)}
        />
      </Modal>
    </div>
  );
};
