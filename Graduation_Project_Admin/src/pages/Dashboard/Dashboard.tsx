import React from 'react';
import { Row, Col, Card, Typography, Table, Tag, Space, Button } from 'antd';
import {
  UserOutlined,
  DollarCircleOutlined,
  TransactionOutlined,
  ArrowUpOutlined,
  MoreOutlined,
  FilterOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export const Dashboard: React.FC = () => {
  const recentTransactions = [
    { key: '1', id: 'TX001', type: 'Nạp tiền', amount: '+ 500,000 đ', status: 'success', date: '2026-07-12 14:30' },
    { key: '2', id: 'TX002', type: 'Rút tiền', amount: '- 200,000 đ', status: 'pending', date: '2026-07-12 10:15' },
    { key: '3', id: 'TX003', type: 'Nạp tiền', amount: '+ 1,000,000 đ', status: 'success', date: '2026-07-11 09:45' },
    { key: '4', id: 'TX004', type: 'Thanh toán', amount: '- 150,000 đ', status: 'success', date: '2026-07-10 16:20' },
    { key: '5', id: 'TX005', type: 'Nạp tiền', amount: '+ 2,500,000 đ', status: 'failed', date: '2026-07-10 08:00' },
  ];

  const columns = [
    { 
      title: 'Mã Giao dịch', 
      dataIndex: 'id', 
      key: 'id',
      render: (text: string) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{text}</span>,
    },
    { 
      title: 'Loại', 
      dataIndex: 'type', 
      key: 'type',
      render: (text: string) => <Text type="secondary">{text}</Text>
    },
    { 
      title: 'Số tiền', 
      dataIndex: 'amount', 
      key: 'amount',
      render: (text: string) => (
        <span style={{ fontWeight: 700, color: text.startsWith('+') ? '#059669' : '#DC2626' }}>
          {text}
        </span>
      )
    },
    { 
      title: 'Ngày tạo', 
      dataIndex: 'date', 
      key: 'date',
      render: (text: string) => <Text type="secondary">{text}</Text>
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        let color = '';
        let text = '';
        if (status === 'success') { color = 'success'; text = 'Thành công'; }
        if (status === 'pending') { color = 'warning'; text = 'Chờ xử lý'; }
        if (status === 'failed') { color = 'error'; text = 'Thất bại'; }
        return <Tag color={color} style={{ borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>{text}</Tag>;
      }
    },
    {
      title: '',
      key: 'action',
      render: () => <Button type="text" icon={<MoreOutlined />} />
    }
  ];

  // Custom Metric Card Component
  const MetricCard = ({ title, value, icon, color, trend, trendValue }: any) => (
    <Card 
      bordered={false} 
      style={{ 
        borderRadius: 16, 
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        height: '100%'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Text style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: 600, letterSpacing: 0.5 }}>{title}</Text>
          <Title level={2} style={{ margin: '8px 0 0 0', fontWeight: 800, color: '#0F172A' }}>{value}</Title>
        </div>
        <div style={{ 
          width: 48, 
          height: 48, 
          borderRadius: 12, 
          background: `${color}15`, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          {React.cloneElement(icon, { style: { fontSize: 24, color: color } })}
        </div>
      </div>
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Tag color={trend === 'up' ? 'success' : 'error'} style={{ borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px' }}>
          {trend === 'up' ? <ArrowUpOutlined /> : <ArrowUpOutlined style={{ transform: 'rotate(180deg)' }} />}
          <span style={{ fontWeight: 600 }}>{trendValue}</span>
        </Tag>
        <Text style={{ fontSize: '0.8rem', color: '#94A3B8' }}>so với tháng trước</Text>
      </div>
    </Card>
  );

  return (
    <div>
      {/* Welcome Section */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
            Tổng quan hệ thống
          </Title>
          <Text style={{ color: '#64748B', fontSize: '1rem', marginTop: 4, display: 'block' }}>
            Chào mừng trở lại, Quản trị viên! Đây là tình hình hoạt động hôm nay.
          </Text>
        </div>
        <div>
          <Button type="primary" size="large" style={{ borderRadius: 8, background: '#0D9488', fontWeight: 600, boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)' }}>
            Tải báo cáo
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={8}>
          <MetricCard 
            title="TỔNG NGƯỜI DÙNG" 
            value="12,450" 
            icon={<UserOutlined />} 
            color="#0D9488" 
            trend="up" 
            trendValue="12.5%" 
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <MetricCard 
            title="GIAO DỊCH TRONG THÁNG" 
            value="8,234" 
            icon={<TransactionOutlined />} 
            color="#3B82F6" 
            trend="up" 
            trendValue="8.2%" 
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <MetricCard 
            title="TỔNG DÒNG TIỀN (VND)" 
            value="4.5B" 
            icon={<DollarCircleOutlined />} 
            color="#8B5CF6" 
            trend="up" 
            trendValue="24.1%" 
          />
        </Col>
      </Row>

      {/* Main Content Area */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          {/* Recent Transactions Table */}
          <Card 
            bordered={false} 
            style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' }}
            title={<span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Giao dịch gần đây</span>}
            extra={<Button type="text" icon={<FilterOutlined />}>Lọc</Button>}
          >
            <Table 
              dataSource={recentTransactions} 
              columns={columns} 
              pagination={false} 
              rowKey="id"
              size="middle"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          {/* System Status / Quick Actions Placeholder */}
          <Card 
            bordered={false} 
            style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', height: '100%' }}
            title={<span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Trạng thái hệ thống</span>}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ padding: 16, background: '#F0FDF4', borderRadius: 12, border: '1px solid #BBF7D0' }}>
                <div style={{ fontWeight: 700, color: '#166534', marginBottom: 4 }}>Dịch vụ Thanh toán</div>
                <div style={{ fontSize: '0.85rem', color: '#15803D' }}>Hoạt động ổn định (99.9% Uptime)</div>
              </div>
              <div style={{ padding: 16, background: '#F0FDF4', borderRadius: 12, border: '1px solid #BBF7D0' }}>
                <div style={{ fontWeight: 700, color: '#166534', marginBottom: 4 }}>Dịch vụ Xác thực</div>
                <div style={{ fontSize: '0.85rem', color: '#15803D' }}>Hoạt động ổn định (Tải 12%)</div>
              </div>
              <div style={{ padding: 16, background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A' }}>
                <div style={{ fontWeight: 700, color: '#92400E', marginBottom: 4 }}>Đồng bộ Ngân hàng</div>
                <div style={{ fontSize: '0.85rem', color: '#B45309' }}>Đang bảo trì định kỳ (Dự kiến 15p)</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
