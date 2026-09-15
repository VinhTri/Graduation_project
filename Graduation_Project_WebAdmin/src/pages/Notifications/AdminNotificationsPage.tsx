import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Empty, Form, Input, Modal, Select, Skeleton, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { BellOutlined, ReloadOutlined, SearchOutlined, SendOutlined, TeamOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { apiClient } from '../../services/api';
import './AdminNotificationsPage.css';

interface NotificationRow { id: number; name: string; description: string; username: string; email: string; type: string; status: string; createdAt: string }
interface UserRow { id: number; username: string; email: string; role: string; active?: boolean; isActive?: boolean }
interface FormValues { title: string; message: string; audience: 'ALL' | 'USER'; userId?: number }

export function AdminNotificationsPage() {
  const [form] = Form.useForm<FormValues>();
  const audience = Form.useWatch('audience', form);
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [notificationsResponse, usersResponse] = await Promise.all([
        apiClient.get('/api/v1/admin/operations/notifications'),
        apiClient.get('/api/v1/admin/users'),
      ]);
      const notifications = notificationsResponse.data?.data ?? notificationsResponse.data ?? [];
      const userList = usersResponse.data?.data ?? usersResponse.data ?? [];
      setRows(Array.isArray(notifications) ? notifications : []);
      setUsers(Array.isArray(userList) ? userList.filter((user: UserRow) => user.role === 'USER') : []);
    } catch (error: unknown) {
      const apiMessage = axios.isAxiosError(error) ? error.response?.data?.message : null;
      message.error(apiMessage || 'Không tải được trung tâm thông báo');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((row) => (status === 'ALL' || row.status === status) && (!normalized || `${row.name} ${row.description} ${row.username} ${row.email} ${row.type}`.toLowerCase().includes(normalized)));
  }, [query, rows, status]);
  const unread = rows.filter((row) => row.status === 'UNREAD').length;
  const activeUsers = users.filter((user) => user.active ?? user.isActive ?? false).length;

  const send = async (values: FormValues) => {
    setSending(true);
    try {
      const response = await apiClient.post('/api/v1/admin/notifications/send', values);
      message.success(response.data?.message || 'Đã gửi thông báo');
      setComposerOpen(false);
      form.resetFields();
      await load();
    } catch (error: unknown) {
      const apiMessage = axios.isAxiosError(error) ? error.response?.data?.message : null;
      message.error(apiMessage || 'Không thể gửi thông báo');
    } finally { setSending(false); }
  };
  const columns: ColumnsType<NotificationRow> = [
    { title: 'Thông báo', key: 'content', width: 390, render: (_, row) => <div className="notice-content"><strong>{row.name}</strong><span>{row.description}</span></div> },
    { title: 'Người nhận', key: 'receiver', width: 230, render: (_, row) => <div className="notice-user"><strong>{row.username}</strong><span>{row.email}</span></div> },
    { title: 'Loại', dataIndex: 'type', width: 180, render: (value: string) => <Tag>{value}</Tag> },
    { title: 'Trạng thái', dataIndex: 'status', width: 120, render: (value: string) => <Tag color={value === 'UNREAD' ? 'processing' : 'default'}>{value === 'UNREAD' ? 'Chưa đọc' : 'Đã đọc'}</Tag> },
    { title: 'Thời gian', dataIndex: 'createdAt', width: 165, render: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm') },
  ];

  return <main className="notice-page">
    <section className="notice-hero"><div><span>Kênh giao tiếp</span><h2>Thông báo hệ thống</h2><p>Phát thông tin vận hành đến đúng người nhận và theo dõi trạng thái tiếp cận.</p></div><div><Button icon={<ReloadOutlined />} loading={loading} onClick={() => void load()}>Làm mới</Button><Button type="primary" icon={<SendOutlined />} onClick={() => { form.setFieldsValue({ audience: 'USER' }); setComposerOpen(true); }}>Soạn thông báo</Button></div></section>
    <section className="notice-stats"><div><BellOutlined /><span>Đã phát</span><strong>{rows.length}</strong></div><div><SearchOutlined /><span>Chưa đọc</span><strong>{unread}</strong></div><div><TeamOutlined /><span>Người dùng hoạt động</span><strong>{activeUsers}</strong></div></section>
    <section className="notice-table"><div className="notice-toolbar"><Input allowClear prefix={<SearchOutlined />} placeholder="Tìm nội dung hoặc người nhận" value={query} onChange={(event) => setQuery(event.target.value)} /><Select value={status} onChange={setStatus} options={[{ value: 'ALL', label: 'Tất cả trạng thái' }, { value: 'UNREAD', label: 'Chưa đọc' }, { value: 'READ', label: 'Đã đọc' }]} /></div>{loading ? <div className="notice-loading"><Skeleton active paragraph={{ rows: 9 }} /></div> : <Table rowKey="id" columns={columns} dataSource={filtered} scroll={{ x: 1080 }} pagination={{ pageSize: 12, showSizeChanger: false }} locale={{ emptyText: <Empty description="Chưa có thông báo" /> }} />}</section>
    <Modal className="notice-modal" title="Soạn thông báo in-app" open={composerOpen} onCancel={() => setComposerOpen(false)} footer={null} destroyOnClose><Form form={form} layout="vertical" initialValues={{ audience: 'USER' }} onFinish={(values) => void send(values)}><Form.Item name="audience" label="Người nhận" rules={[{ required: true }]}><Select options={[{ value: 'USER', label: 'Một người dùng' }, { value: 'ALL', label: `Toàn bộ người dùng hoạt động (${activeUsers})` }]} /></Form.Item>{audience === 'USER' && <Form.Item name="userId" label="Chọn người dùng" rules={[{ required: true, message: 'Vui lòng chọn người nhận' }]}><Select showSearch optionFilterProp="label" placeholder="Tìm tên hoặc email" options={users.map((user) => ({ value: user.id, label: `${user.username} · ${user.email}` }))} /></Form.Item>}<Form.Item name="title" label="Tiêu đề" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tiêu đề' }, { max: 120 }]}><Input maxLength={120} showCount placeholder="Ví dụ: Bảo trì hệ thống định kỳ" /></Form.Item><Form.Item name="message" label="Nội dung" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập nội dung' }, { max: 500 }]}><Input.TextArea maxLength={500} showCount autoSize={{ minRows: 5, maxRows: 8 }} placeholder="Viết nội dung rõ ràng, ngắn gọn và có hướng dẫn nếu người dùng cần thao tác." /></Form.Item><div className="notice-modal-actions"><Button onClick={() => setComposerOpen(false)}>Hủy</Button><Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={sending}>Gửi thông báo</Button></div></Form></Modal>
  </main>;
}
