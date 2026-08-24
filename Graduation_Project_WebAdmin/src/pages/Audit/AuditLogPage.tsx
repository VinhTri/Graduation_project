import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Empty, Input, Select, Skeleton, Table, Tag, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FileSearchOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { apiClient } from '../../services/api';
import './AuditLogPage.css';

interface AuditRow { id: number; adminId: number; adminEmail: string; action: string; targetType: string; targetId?: string; detail?: string; success: boolean; createdAt: string }
const ACTION_LABEL: Record<string, string> = { USER_STATUS_UPDATE: 'Khóa / mở tài khoản', SUPPORT_REPLY: 'Phản hồi hỗ trợ', SUPPORT_STATUS_UPDATE: 'Đổi trạng thái ticket', SEPAY_RECONCILIATION_RUN: 'Chạy đối soát SePay', SEPAY_MANUAL_CREDIT: 'Cộng tiền SePay thủ công', NOTIFICATION_SEND: 'Phát thông báo', FINANCE_CASE_CREATE: 'Mở hồ sơ tài chính', FINANCE_CASE_RESOLVE: 'Đóng hồ sơ tài chính', ADMIN_ACCESS_UPDATE: 'Thay đổi quyền Admin' };

export function AuditLogPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('ALL');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/v1/admin/audit-logs');
      const payload = response.data?.data ?? response.data ?? [];
      setRows(Array.isArray(payload) ? payload : []);
    } catch (error: unknown) {
      const apiMessage = axios.isAxiosError(error) ? error.response?.data?.message : null;
      message.error(apiMessage || 'Không tải được nhật ký quản trị');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const actions = useMemo(() => Array.from(new Set(rows.map((row) => row.action))), [rows]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((row) => (action === 'ALL' || row.action === action) && (!normalized || Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(normalized))));
  }, [action, query, rows]);
  const columns: ColumnsType<AuditRow> = [
    { title: 'Thời gian', dataIndex: 'createdAt', width: 165, render: (value: string) => <span className="audit-time">{dayjs(value).format('DD/MM/YYYY HH:mm:ss')}</span> },
    { title: 'Quản trị viên', dataIndex: 'adminEmail', width: 220, render: (value: string, row) => <div className="audit-admin"><strong>{value}</strong><small>ID {row.adminId}</small></div> },
    { title: 'Hành động', dataIndex: 'action', width: 210, render: (value: string) => <Tag color="geekblue">{ACTION_LABEL[value] || value}</Tag> },
    { title: 'Đối tượng', key: 'target', width: 180, render: (_, row) => <div className="audit-target"><strong>{row.targetType}</strong><small>{row.targetId ? `#${row.targetId}` : 'Toàn hệ thống'}</small></div> },
    { title: 'Chi tiết / lý do', dataIndex: 'detail', ellipsis: true, render: (value?: string) => value ? <Tooltip title={value}><span>{value}</span></Tooltip> : '—' },
    { title: 'Kết quả', dataIndex: 'success', width: 105, render: (value: boolean) => <Tag color={value ? 'success' : 'error'}>{value ? 'Thành công' : 'Thất bại'}</Tag> },
  ];

  return <main className="audit-page">
    <section className="audit-intro"><div className="audit-icon"><FileSearchOutlined /></div><div><span>Kiểm soát nội bộ</span><h2>Nhật ký quản trị</h2><p>Dấu vết bất biến cho những thao tác có ảnh hưởng đến người dùng, hỗ trợ và dòng tiền.</p></div><Button icon={<ReloadOutlined />} loading={loading} onClick={() => void load()}>Làm mới</Button></section>
    <section className="audit-facts"><div><small>Sự kiện gần nhất</small><strong>{rows.length}</strong><span>Tối đa 500 bản ghi</span></div><div><small>Quản trị viên</small><strong>{new Set(rows.map((row) => row.adminId)).size}</strong><span>Đã phát sinh thao tác</span></div><div><small>Thao tác tài chính</small><strong>{rows.filter((row) => row.action.includes('SEPAY')).length}</strong><span>Cần đối chiếu định kỳ</span></div></section>
    <section className="audit-table"><div className="audit-toolbar"><Input allowClear prefix={<SearchOutlined />} placeholder="Tìm admin, đối tượng hoặc nội dung" value={query} onChange={(event) => setQuery(event.target.value)} /><Select value={action} onChange={setAction} options={[{ value: 'ALL', label: 'Tất cả hành động' }, ...actions.map((value) => ({ value, label: ACTION_LABEL[value] || value }))]} /></div>{loading ? <div className="audit-loading"><Skeleton active paragraph={{ rows: 9 }} /></div> : <Table rowKey="id" columns={columns} dataSource={filtered} scroll={{ x: 1080 }} pagination={{ pageSize: 15, showSizeChanger: false, showTotal: (total) => `${total} sự kiện` }} locale={{ emptyText: <Empty description="Chưa có nhật ký phù hợp" /> }} />}</section>
  </main>;
}
