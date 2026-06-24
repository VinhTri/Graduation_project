import React from 'react';
import { Row, Col, Card, Statistic, Typography, Table } from 'antd';
import {
  UserOutlined,
  DollarCircleOutlined,
  TransactionOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

export const Dashboard: React.FC = () => {
  const recentTransactions = [
    { key: '1', id: 'TX001', type: 'Nạp tiền', amount: '500,000 đ', status: 'Thành công', date: '2026-06-18' },
    { key: '2', id: 'TX002', type: 'Rút tiền', amount: '200,000 đ', status: 'Chờ xử lý', date: '2026-06-18' },
    { key: '3', id: 'TX003', type: 'Nạp tiền', amount: '1,000,000 đ', status: 'Thành công', date: '2026-06-17' },
  ];

  const columns = [
    { title: 'Mã Giao dịch', dataIndex: 'id', key: 'id' },
    { title: 'Loại', dataIndex: 'type', key: 'type' },
    { title: 'Số tiền', dataIndex: 'amount', key: 'amount' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
    { title: 'Ngày tạo', dataIndex: 'date', key: 'date' },
  ];

  return (
    <div>
      <Title level={2}>Tổng quan hệ thống</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng Người Dùng"
              value={1128}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng Giao Dịch Trong Tháng"
              value={4560}
              prefix={<TransactionOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng Tiền Nạp (VND)"
              value={125000000}
              prefix={<DollarCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24, borderRadius: '12px' }}>
        <Title level={4}>Giao dịch gần đây</Title>
        <Table dataSource={recentTransactions} columns={columns} pagination={false} />
      </Card>
    </div>
  );
};
