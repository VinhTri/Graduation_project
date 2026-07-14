import React, { useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Select, Table, Tag } from 'antd';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { ArrowUpOutlined, ArrowDownOutlined, DollarCircleOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

export const Report: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7days');

  // Mock Data
  const lineChartData = [
    { name: 'T2', nạp: 40000000, rút: 24000000 },
    { name: 'T3', nạp: 30000000, rút: 13980000 },
    { name: 'T4', nạp: 20000000, rút: 98000000 },
    { name: 'T5', nạp: 27800000, rút: 39080000 },
    { name: 'T6', nạp: 18900000, rút: 48000000 },
    { name: 'T7', nạp: 23900000, rút: 38000000 },
    { name: 'CN', nạp: 34900000, rút: 43000000 },
  ];

  const pieChartData = [
    { name: 'Thành công', value: 85, color: '#52c41a' },
    { name: 'Đang xử lý', value: 10, color: '#faad14' },
    { name: 'Thất bại', value: 5, color: '#f5222d' },
  ];

  const recentBigTransactions = [
    { key: '1', user: 'nguyenvana', type: 'Nạp tiền', amount: 50000000, status: 'Thành công', time: '10 phút trước' },
    { key: '2', user: 'tranthib', type: 'Rút tiền', amount: 20000000, status: 'Đang xử lý', time: '1 giờ trước' },
    { key: '3', user: 'lequocc', type: 'Nạp tiền', amount: 15000000, status: 'Thành công', time: '2 giờ trước' },
    { key: '4', user: 'phamthid', type: 'Nạp tiền', amount: 10000000, status: 'Thất bại', time: '3 giờ trước' },
  ];

  const formatVND = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Báo Cáo Giao Dịch Toàn Hệ Thống</Title>
        <Select defaultValue="7days" style={{ width: 150 }} onChange={setTimeRange}>
          <Option value="today">Hôm nay</Option>
          <Option value="7days">7 ngày qua</Option>
          <Option value="30days">30 ngày qua</Option>
          <Option value="year">Năm nay</Option>
        </Select>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Tổng Lượng Giao Dịch"
              value={15234}
              valueStyle={{ color: '#0ea5e9', fontWeight: 600 }}
              prefix={<SyncOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="success"><ArrowUpOutlined /> 12%</Text> <Text type="secondary">so với kỳ trước</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Tổng Tiền Nạp"
              value={1250000000}
              formatter={(value) => formatVND(value as number)}
              valueStyle={{ color: '#52c41a', fontWeight: 600, fontSize: 22 }}
              prefix={<DollarCircleOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="success"><ArrowUpOutlined /> 8%</Text> <Text type="secondary">so với kỳ trước</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Tổng Tiền Rút"
              value={850000000}
              formatter={(value) => formatVND(value as number)}
              valueStyle={{ color: '#f5222d', fontWeight: 600, fontSize: 22 }}
              prefix={<DollarCircleOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="danger"><ArrowDownOutlined /> 3%</Text> <Text type="secondary">so với kỳ trước</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Tỷ lệ thành công"
              value={85}
              suffix="%"
              valueStyle={{ color: '#faad14', fontWeight: 600 }}
              prefix={<CheckCircleOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="success"><ArrowUpOutlined /> 1.5%</Text> <Text type="secondary">so với kỳ trước</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Lưu lượng giao dịch theo thời gian" bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis 
                    tickFormatter={(value) => `${value / 1000000}M`} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <RechartsTooltip formatter={(value: number) => formatVND(value)} />
                  <Legend verticalAlign="top" height={36}/>
                  <Line type="monotone" dataKey="nạp" name="Nạp tiền" stroke="#52c41a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="rút" name="Rút tiền" stroke="#f5222d" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Tỷ lệ trạng thái giao dịch" bordered={false} style={{ borderRadius: 12, height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => `${value}%`} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Các giao dịch nổi bật gần đây" bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Table 
              dataSource={recentBigTransactions} 
              pagination={false}
              columns={[
                { title: 'Người dùng', dataIndex: 'user', key: 'user', render: (text) => <strong>{text}</strong> },
                { title: 'Loại', dataIndex: 'type', key: 'type', render: (text) => <Tag color={text === 'Nạp tiền' ? 'green' : 'orange'}>{text}</Tag> },
                { title: 'Số tiền', dataIndex: 'amount', key: 'amount', render: (val, record) => (
                  <Text type={record.type === 'Nạp tiền' ? 'success' : 'danger'} strong>
                    {record.type === 'Nạp tiền' ? '+' : '-'}{formatVND(val)}
                  </Text>
                )},
                { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (text) => {
                  let color = text === 'Thành công' ? 'success' : text === 'Đang xử lý' ? 'processing' : 'error';
                  return <Tag color={color}>{text}</Tag>;
                }},
                { title: 'Thời gian', dataIndex: 'time', key: 'time' },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
