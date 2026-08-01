import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Button,
  Empty,
  Input,
  Select,
  Space,
  Tag,
  message,
} from 'antd';
import {
  CustomerServiceOutlined,
  SearchOutlined,
  SendOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '../../services/api';
import './Support.css';

interface SupportTicket {
  id: number;
  subject: string;
  status: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt?: string;
  userId?: number;
  username?: string;
  email?: string;
}

interface SupportMessage {
  id: number;
  content: string;
  senderType: string;
  senderId?: number;
  senderUsername?: string;
  createdAt?: string;
}

interface TicketDetail {
  ticket: SupportTicket;
  messages: SupportMessage[];
}

const STATUS_META: Record<string, { color: string; label: string }> = {
  OPEN: { color: 'processing', label: 'Mới' },
  IN_PROGRESS: { color: 'warning', label: 'Đang xử lý' },
  CLOSED: { color: 'default', label: 'Đã đóng' },
};

const avatarColor = (name: string) => {
  const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444'];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export const Support = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchTickets = async () => {
    try {
      setLoadingList(true);
      const response = await apiClient.get('/api/v1/admin/support/tickets');
      const data = response.data?.data || response.data || [];
      const list = Array.isArray(data) ? data : [];
      setTickets(list);
      if (list.length > 0 && selectedId == null) {
        setSelectedId(list[0].id);
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể tải danh sách hỗ trợ');
    } finally {
      setLoadingList(false);
    }
  };

  const fetchDetail = async (id: number) => {
    try {
      setLoadingDetail(true);
      const response = await apiClient.get(`/api/v1/admin/support/tickets/${id}`);
      const data = response.data?.data || response.data;
      if (data) setDetail(data);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể tải hội thoại');
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedId != null) {
      fetchDetail(selectedId);
      setReply('');
    }
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail?.messages]);

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.subject?.toLowerCase().includes(q) ||
        t.username?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.lastMessage?.toLowerCase().includes(q)
      );
    });
  }, [tickets, search, statusFilter]);

  const handleSend = async () => {
    if (!selectedId || !reply.trim()) return;
    try {
      setSending(true);
      await apiClient.post(`/api/v1/admin/support/tickets/${selectedId}/reply`, {
        content: reply.trim(),
      });
      setReply('');
      await Promise.all([fetchDetail(selectedId), fetchTickets()]);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không gửi được phản hồi');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedId) return;
    try {
      setUpdatingStatus(true);
      await apiClient.put(`/api/v1/admin/support/tickets/${selectedId}/status`, { status });
      await Promise.all([fetchDetail(selectedId), fetchTickets()]);
      message.success('Đã cập nhật trạng thái');
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không cập nhật được trạng thái');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const activeTicket = detail?.ticket;
  const activeStatus = activeTicket
    ? STATUS_META[activeTicket.status] || { color: 'default', label: activeTicket.status }
    : null;

  return (
    <div className="support-page">
      <div className="support-shell">
        <aside className="support-list">
          <div className="support-list-head">
            <div className="support-list-title">
              <CustomerServiceOutlined />
              <strong>Hỗ trợ người dùng</strong>
            </div>
            <Input
              allowClear
              className="support-search"
              placeholder="Tìm yêu cầu, user..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="support-status-filter"
              options={[
                { value: 'ALL', label: 'Tất cả trạng thái' },
                { value: 'OPEN', label: 'Mới' },
                { value: 'IN_PROGRESS', label: 'Đang xử lý' },
                { value: 'CLOSED', label: 'Đã đóng' },
              ]}
            />
          </div>

          <div className="support-list-body">
            {loadingList ? (
              <div className="support-empty">Đang tải...</div>
            ) : filteredTickets.length === 0 ? (
              <Empty description="Chưa có yêu cầu hỗ trợ" />
            ) : (
              filteredTickets.map((ticket) => {
                const meta = STATUS_META[ticket.status] || { color: 'default', label: ticket.status };
                const active = ticket.id === selectedId;
                const name = ticket.username || 'User';
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    className={`support-item${active ? ' is-active' : ''}`}
                    onClick={() => setSelectedId(ticket.id)}
                  >
                    <Avatar size={42} style={{ background: avatarColor(name) }}>
                      {name.slice(0, 1).toUpperCase()}
                    </Avatar>
                    <div className="support-item-main">
                      <div className="support-item-top">
                        <strong>{name}</strong>
                        <span>
                          {ticket.lastMessageAt
                            ? dayjs(ticket.lastMessageAt).format('DD/MM HH:mm')
                            : ''}
                        </span>
                      </div>
                      <div className="support-item-subject">{ticket.subject}</div>
                      <div className="support-item-bottom">
                        <p>{ticket.lastMessage || '—'}</p>
                        <Tag color={meta.color}>{meta.label}</Tag>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="support-chat">
          {!selectedId || !activeTicket ? (
            <div className="support-chat-empty">
              <CustomerServiceOutlined />
              <h3>Chọn một yêu cầu để trò chuyện</h3>
              <p>Phản hồi người dùng giống messenger — theo dõi và đóng ticket khi xong.</p>
            </div>
          ) : (
            <>
              <div className="support-chat-head">
                <div className="support-chat-user">
                  <Avatar size={44} style={{ background: avatarColor(activeTicket.username || 'U') }}>
                    {(activeTicket.username || 'U').slice(0, 1).toUpperCase()}
                  </Avatar>
                  <div>
                    <strong>{activeTicket.username}</strong>
                    <span>{activeTicket.email}</span>
                    <small>{activeTicket.subject}</small>
                  </div>
                </div>
                <Space wrap>
                  {activeStatus && <Tag color={activeStatus.color}>{activeStatus.label}</Tag>}
                  <Select
                    value={activeTicket.status}
                    loading={updatingStatus}
                    style={{ width: 150 }}
                    onChange={handleStatusChange}
                    options={[
                      { value: 'OPEN', label: 'Mới' },
                      { value: 'IN_PROGRESS', label: 'Đang xử lý' },
                      { value: 'CLOSED', label: 'Đã đóng' },
                    ]}
                  />
                </Space>
              </div>

              <div className="support-chat-body">
                {loadingDetail ? (
                  <div className="support-empty">Đang tải tin nhắn...</div>
                ) : (detail?.messages || []).length === 0 ? (
                  <Empty description="Chưa có tin nhắn" />
                ) : (
                  (detail?.messages || []).map((msg) => {
                    const isAdmin = msg.senderType === 'ADMIN';
                    return (
                      <div
                        key={msg.id}
                        className={`support-bubble-row${isAdmin ? ' is-admin' : ' is-user'}`}
                      >
                        {!isAdmin && (
                          <Avatar size={32} style={{ background: avatarColor(msg.senderUsername || 'U') }}>
                            {(msg.senderUsername || 'U').slice(0, 1).toUpperCase()}
                          </Avatar>
                        )}
                        <div className={`support-bubble${isAdmin ? ' admin' : ' user'}`}>
                          <p>{msg.content}</p>
                          <span>
                            {isAdmin ? 'Admin' : msg.senderUsername} ·{' '}
                            {msg.createdAt ? dayjs(msg.createdAt).format('DD/MM HH:mm') : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="support-chat-composer">
                <Input.TextArea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={
                    activeTicket.status === 'CLOSED'
                      ? 'Ticket đã đóng — gửi tin sẽ tiếp tục hội thoại...'
                      : 'Nhập phản hồi cho người dùng...'
                  }
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={sending}
                  disabled={!reply.trim()}
                  onClick={() => void handleSend()}
                >
                  Gửi
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
