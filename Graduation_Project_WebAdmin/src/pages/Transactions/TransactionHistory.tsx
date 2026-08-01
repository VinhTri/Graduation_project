import React, { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Tag,
  Space,
  message,
  Card,
  Input,
  Select,
  Avatar,
  Empty,
  Tooltip,
  Button,
  Drawer,
  Descriptions,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  TransactionOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  WalletOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '../../services/api';
import './TransactionHistory.css';

interface AdminTransaction {
  id: number;
  transactionCode: string;
  type: string;
  status: string;
  amount: number;
  note?: string;
  categoryId?: number;
  userId?: number;
  username?: string;
  email?: string;
  walletId?: number;
  walletType?: string;
  createdAt: string;
}

const TYPE_LABEL: Record<string, string> = {
  TOP_UP: 'Nạp tiền',
  WITHDRAW: 'Rút tiền',
  TRANSFER: 'Chuyển khoản',
  RECEIVE_TRANSFER: 'Nhận chuyển',
  PAYMENT: 'Thanh toán',
  EXPENSE: 'Chi tiêu',
  INCOME: 'Thu nhập',
  BANK_LINK_FEE: 'Phí liên kết NH',
};

const TYPE_COLOR: Record<string, string> = {
  TOP_UP: 'green',
  WITHDRAW: 'magenta',
  TRANSFER: 'blue',
  RECEIVE_TRANSFER: 'cyan',
  PAYMENT: 'purple',
  EXPENSE: 'orange',
  INCOME: 'lime',
  BANK_LINK_FEE: 'gold',
};

const STATUS_META: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  SUCCESS: { color: 'success', label: 'Thành công', icon: <CheckCircleOutlined /> },
  COMPLETED: { color: 'success', label: 'Thành công', icon: <CheckCircleOutlined /> },
  PENDING: { color: 'processing', label: 'Chờ xử lý', icon: <ClockCircleOutlined /> },
  PROCESSING: { color: 'processing', label: 'Đang xử lý', icon: <ClockCircleOutlined /> },
  FAILED: { color: 'error', label: 'Thất bại', icon: <CloseCircleOutlined /> },
  CANCELLED: { color: 'default', label: 'Đã hủy', icon: <CloseCircleOutlined /> },
};

const WALLET_LABEL: Record<string, string> = {
  MAIN: 'Ví MAIN',
  CASH: 'Sổ tay CASH',
};

const OUTFLOW_TYPES = new Set(['WITHDRAW', 'TRANSFER', 'EXPENSE', 'PAYMENT', 'BANK_LINK_FEE']);

const avatarColor = (name: string) => {
  const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444'];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);

export const TransactionHistory = () => {
  const [rows, setRows] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<AdminTransaction | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/admin/transactions');
      const data = response.data?.data || response.data || [];
      setRows(Array.isArray(data) ? data : []);
    } catch (error: any) {
      message.error(error?.response?.data?.message || error?.message || 'Không thể tải lịch sử giao dịch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.transactionCode?.toLowerCase().includes(q) ||
        r.username?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.note?.toLowerCase().includes(q) ||
        String(r.userId ?? '').includes(q) ||
        String(r.id).includes(q)
      );
    });
  }, [rows, search, typeFilter, statusFilter]);

  const openDetail = (record: AdminTransaction) => {
    setSelected(record);
    setDrawerOpen(true);
  };

  const columns: ColumnsType<AdminTransaction> = [
    {
      title: 'Mã giao dịch',
      dataIndex: 'transactionCode',
      key: 'transactionCode',
      width: '26%',
      render: (code: string) => (
        <Tooltip title={code}>
          <span className="txh-code">{code}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: '22%',
      render: (amount: number, record) => {
        const isOut = OUTFLOW_TYPES.has(record.type);
        return (
          <span className={`txh-amount ${isOut ? 'out' : 'in'}`}>
            {isOut ? '−' : '+'}
            {formatVND(amount)}
          </span>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: '18%',
      render: (status: string) => {
        const meta = STATUS_META[status] || { color: 'default', label: status, icon: null };
        return (
          <Tag color={meta.color} icon={meta.icon} className="txh-tag">
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '20%',
      render: (v: string) => (
        <span className="txh-date">{v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—'}</span>
      ),
    },
    {
      title: 'Chi tiết',
      key: 'actions',
      width: '14%',
      align: 'center',
      render: (_, record) => (
        <Button type="link" className="txh-view-btn" icon={<EyeOutlined />} onClick={() => openDetail(record)}>
          Xem
        </Button>
      ),
    },
  ];

  const selectedIsOut = selected ? OUTFLOW_TYPES.has(selected.type) : false;
  const selectedStatus = selected
    ? STATUS_META[selected.status] || { color: 'default', label: selected.status, icon: null }
    : null;

  return (
    <div className="txh-page">
      <div className="txh-hero">
        <div>
          <div className="txh-hero-kicker">
            <TransactionOutlined /> Quản lý
          </div>
          <h2>Lịch sử giao dịch</h2>
        </div>
      </div>

      <Card className="txh-table-card" bordered={false}>
        <div className="txh-toolbar">
          <Input
            allowClear
            className="txh-search"
            placeholder="Tìm mã GD, username, email, ghi chú..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Space wrap>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 160 }}
              options={[
                { value: 'ALL', label: 'Tất cả loại' },
                ...Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label })),
              ]}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              options={[
                { value: 'ALL', label: 'Tất cả trạng thái' },
                { value: 'SUCCESS', label: 'Thành công' },
                { value: 'PENDING', label: 'Chờ xử lý' },
                { value: 'PROCESSING', label: 'Đang xử lý' },
                { value: 'FAILED', label: 'Thất bại' },
                { value: 'CANCELLED', label: 'Đã hủy' },
              ]}
            />
          </Space>
        </div>

        <div className="txh-table-wrap">
          <Table
            className="txh-table"
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={filtered}
            tableLayout="fixed"
            locale={{ emptyText: <Empty description="Chưa có giao dịch nào" /> }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `${total} giao dịch`,
            }}
          />
        </div>
      </Card>

      <Drawer
        className="txh-drawer"
        title="Chi tiết giao dịch"
        width={480}
        placement="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        {selected && (
          <div className="txh-drawer-body">
            <div className="txh-drawer-head">
              <div className={`txh-drawer-amount ${selectedIsOut ? 'out' : 'in'}`}>
                {selectedIsOut ? '−' : '+'}
                {formatVND(Number(selected.amount))}
              </div>
              <Space wrap>
                <Tag color={TYPE_COLOR[selected.type] || 'default'} className="txh-tag">
                  {TYPE_LABEL[selected.type] || selected.type}
                </Tag>
                {selectedStatus && (
                  <Tag color={selectedStatus.color} icon={selectedStatus.icon} className="txh-tag">
                    {selectedStatus.label}
                  </Tag>
                )}
              </Space>
              <span className="txh-drawer-code">{selected.transactionCode}</span>
            </div>

            <div className="txh-drawer-user">
              <Avatar
                size={48}
                icon={!selected.username ? <UserOutlined /> : undefined}
                style={{ background: avatarColor(selected.username || 'U') }}
              >
                {(selected.username || 'U').slice(0, 1).toUpperCase()}
              </Avatar>
              <div>
                <strong>{selected.username || '—'}</strong>
                <span>{selected.email || `ID ${selected.userId ?? '—'}`}</span>
              </div>
            </div>

            <Descriptions
              className="txh-desc"
              column={1}
              size="middle"
              items={[
                { key: 'id', label: 'ID giao dịch', children: `#${selected.id}` },
                { key: 'code', label: 'Mã giao dịch', children: selected.transactionCode },
                {
                  key: 'type',
                  label: 'Loại giao dịch',
                  children: TYPE_LABEL[selected.type] || selected.type,
                },
                {
                  key: 'amount',
                  label: 'Số tiền',
                  children: (
                    <span className={`txh-amount ${selectedIsOut ? 'out' : 'in'}`}>
                      {selectedIsOut ? '−' : '+'}
                      {formatVND(Number(selected.amount))}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  label: 'Trạng thái',
                  children: selectedStatus?.label || selected.status,
                },
                {
                  key: 'wallet',
                  label: 'Ví',
                  children: (
                    <Tag icon={<WalletOutlined />} className="txh-tag">
                      {WALLET_LABEL[selected.walletType || ''] || selected.walletType || '—'}
                    </Tag>
                  ),
                },
                {
                  key: 'user',
                  label: 'Người dùng',
                  children: selected.username || '—',
                },
                {
                  key: 'email',
                  label: 'Email',
                  children: selected.email || '—',
                },
                {
                  key: 'note',
                  label: 'Ghi chú',
                  children: selected.note || '—',
                },
                {
                  key: 'time',
                  label: 'Thời gian',
                  children: selected.createdAt
                    ? dayjs(selected.createdAt).format('DD/MM/YYYY HH:mm:ss')
                    : '—',
                },
              ]}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};
