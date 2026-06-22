import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, message, Card, Typography, Drawer, Descriptions, Divider } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { apiClient } from '../../services/api';

const { Title, Text } = Typography;

interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
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
  recentTransactions: TransactionHistory[];
}

export const Users = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // States cho Drawer
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetailsResponse | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/admin/users');
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error: any) {
      message.error(error?.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await apiClient.put(`/api/v1/admin/users/${id}/toggle-status`);
      if (response.data.success) {
        message.success(response.data.message);
        fetchUsers();
      }
    } catch (error: any) {
      message.error(error?.message || 'Không thể thay đổi trạng thái');
    }
  };

  const handleViewDetails = async (id: number) => {
    setDrawerVisible(true);
    setDrawerLoading(true);
    try {
      const response = await apiClient.get(`/api/v1/admin/users/${id}/details`);
      if (response.data.success) {
        setSelectedUser(response.data.data);
      }
    } catch (error: any) {
      message.error('Không thể tải chi tiết người dùng');
      setDrawerVisible(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const columns: ColumnsType<UserResponse> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Tên Đăng Nhập',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Quyền Hạn',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'ADMIN' ? 'gold' : 'blue'}>
          {role === 'ADMIN' ? 'Quản Trị Viên' : 'Người Dùng'}
        </Tag>
      ),
    },
    {
      title: 'Ngày Tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date)
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'error'}>
          {active ? 'Hoạt động' : 'Bị Khóa'}
        </Tag>
      ),
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" ghost onClick={() => handleViewDetails(record.id)}>
            Chi tiết
          </Button>
          {record.role !== 'ADMIN' && (
            <Button
              type={record.active ? "primary" : "default"}
              danger={record.active}
              onClick={() => handleToggleStatus(record.id)}
            >
              {record.active ? 'Khóa' : 'Mở Khóa'}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const transactionColumns: ColumnsType<TransactionHistory> = [
    {
      title: 'Mã GD',
      dataIndex: 'transactionCode',
      key: 'transactionCode',
      render: (text) => <Text copyable>{text}</Text>
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'TOP_UP' ? 'green' : 'orange'}>
          {type === 'TOP_UP' ? 'Nạp tiền' : 'Rút tiền'}
        </Tag>
      )
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <Text type={record.type === 'TOP_UP' ? 'success' : 'danger'} strong>
          {record.type === 'TOP_UP' ? '+' : '-'}{amount.toLocaleString('vi-VN')} đ
        </Text>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let text = status;
        if (status === 'COMPLETED') { color = 'success'; text = 'Thành công'; }
        if (status === 'PENDING') { color = 'processing'; text = 'Đang chờ'; }
        if (status === 'FAILED') { color = 'error'; text = 'Thất bại'; }
        if (status === 'CANCELLED') { color = 'error'; text = 'Đã hủy'; }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date)
    }
  ];

  return (
    <Card style={{ margin: '24px', borderRadius: '12px' }}>
      <Title level={4} style={{ marginBottom: '24px' }}>Quản Lý Người Dùng</Title>
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Drawer
        title="Chi tiết Người Dùng"
        width={800}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        loading={drawerLoading}
      >
        {selectedUser && (
          <div>
            <Descriptions title="Thông tin cơ bản" bordered column={2}>
              <Descriptions.Item label="ID">{selectedUser.userInfo.id}</Descriptions.Item>
              <Descriptions.Item label="Tên Đăng Nhập"><strong>{selectedUser.userInfo.username}</strong></Descriptions.Item>
              <Descriptions.Item label="Email">{selectedUser.userInfo.email}</Descriptions.Item>
              <Descriptions.Item label="Phân quyền">
                <Tag color={selectedUser.userInfo.role === 'ADMIN' ? 'gold' : 'blue'}>
                  {selectedUser.userInfo.role === 'ADMIN' ? 'Quản Trị Viên' : 'Khách Hàng'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={selectedUser.userInfo.active ? 'success' : 'error'}>
                  {selectedUser.userInfo.active ? 'Hoạt động' : 'Bị Khóa'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tham gia">{formatDate(selectedUser.userInfo.createdAt)}</Descriptions.Item>
            </Descriptions>

            <Divider />
            
            <Card style={{ background: '#f0f2f5', marginBottom: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">Tổng số dư trong các ví</Text>
                <Title level={2} style={{ margin: 0, color: '#0ea5e9' }}>
                  {selectedUser.totalBalance.toLocaleString('vi-VN')} VNĐ
                </Title>
              </div>
            </Card>

            <Title level={5}>Lịch sử Giao Dịch (20 giao dịch gần nhất)</Title>
            <Table 
              columns={transactionColumns} 
              dataSource={selectedUser.recentTransactions} 
              rowKey="transactionCode"
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Drawer>
    </Card>
  );
}
