import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api';

const { Title } = Typography;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Assuming backend returns token in data.data.token or similar structure
      const response = await apiClient.post('/api/v1/auth/login', {
        username: values.username,
        password: values.password,
      });
      
      const token = response.data?.data?.token || response.data?.token;
      if (token) {
        localStorage.setItem('admin_token', token);
        message.success('Đăng nhập thành công!');
        navigate('/');
      } else {
        message.error('Không tìm thấy token xác thực!');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      message.error(error.response?.data?.message || 'Đăng nhập thất bại, vui lòng kiểm tra lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3}>SmartSpend Admin</Title>
          <p>Đăng nhập hệ thống quản trị</p>
        </div>
        <Form
          name="admin_login"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập (Email)" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
