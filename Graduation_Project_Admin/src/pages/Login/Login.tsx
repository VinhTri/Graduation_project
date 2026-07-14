import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, SecurityScanOutlined, DashboardOutlined, TeamOutlined, TransactionOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api';

const { Title, Text } = Typography;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
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
    <div style={{ display: 'flex', height: '100vh', width: '100%', fontFamily: "'Inter', sans-serif" }}>
      {/* Nửa trái - Branding */}
      <div style={{ 
        flex: 1, 
        backgroundColor: '#042f2e',
        backgroundImage: 'linear-gradient(rgba(13, 148, 136, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(13, 148, 136, 0.08) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 60px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '30%',
          width: '50%',
          height: '50%',
          background: 'rgba(13, 148, 136, 0.15)',
          filter: 'blur(100px)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, zIndex: 1 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0D9488', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <SecurityScanOutlined style={{ fontSize: 24, color: 'white' }} />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem', lineHeight: 1 }}>SmartSpend</div>
            <div style={{ color: '#5EEAD4', fontSize: '0.75rem', fontWeight: 600, letterSpacing: 1, marginTop: 4 }}>ADMIN PORTAL</div>
          </div>
        </div>

        {/* Center Content Wrapper */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 1 }}>
          {/* Text Area */}
          <div>
            <Title level={1} style={{ color: 'white', fontWeight: 700, fontSize: '2.5rem', margin: 0, lineHeight: 1.3 }}>
              Quản lý tài chính,<br/>thông minh & hiệu quả
            </Title>
            <Text style={{ color: '#99F6E4', fontSize: '1.1rem', display: 'block', marginTop: 16, maxWidth: 500 }}>
              Hệ thống quản trị nội bộ tự động, thống kê siêu tốc và theo dõi dòng tiền thời gian thực dành riêng cho quản trị viên SmartSpend.
            </Text>
          </div>

          {/* Center Glass Card */}
          <div style={{
            marginTop: 40,
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 24,
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: 500,
            boxSizing: 'border-box'
          }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(13, 148, 136, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16, border: '1px solid rgba(13,148,136,0.3)' }}>
               <SecurityScanOutlined style={{ fontSize: 40, color: '#5EEAD4' }} />
            </div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: '2.5rem', letterSpacing: '-0.5px' }}>SmartSpend</div>
            <div style={{ color: '#99F6E4', fontSize: '0.85rem', letterSpacing: 2, marginTop: 4 }}>FINANCE PLATFORM</div>
          </div>
          
        </div>

        {/* Bottom Elements */}
        <div style={{ zIndex: 1, marginTop: 'auto' }}>
          {/* Footer */}
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: 1 }}>
            SMARTSPEND ADMIN PORTAL &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>

      {/* Nửa phải - Form Đăng nhập */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        background: '#F8FAFC',
        padding: '40px'
      }}>
        <div style={{ 
          width: '100%', 
          maxWidth: 420, 
          background: 'white', 
          borderRadius: 24, 
          padding: '48px 40px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(13, 148, 136, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
              <LockOutlined style={{ fontSize: 24, color: '#0D9488' }} />
            </div>
            <Title level={3} style={{ color: '#0F172A', fontWeight: 700, margin: 0, marginBottom: 8 }}>
              Đăng nhập tài khoản
            </Title>
            <Text style={{ fontSize: '0.9rem', color: '#64748B' }}>
              Nhập thông tin tài khoản chủ quản được cấp phép
            </Text>
          </div>

          <Form
            name="admin_login"
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
            size="large"
          >
            <Form.Item
              name="username"
              label={<span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: 0.5 }}>ĐỊA CHỈ EMAIL</span>}
              rules={[{ required: true, message: 'Vui lòng nhập email!' }]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: '#94a3b8', marginRight: 8 }} />} 
                placeholder="admin@smartspend.com" 
                style={{ borderRadius: 12, padding: '12px 16px', background: '#F1F5F9', border: '1px solid transparent' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: 0.5 }}>MẬT KHẨU</span>}
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
              style={{ marginBottom: 16 }}
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#94a3b8', marginRight: 8 }} />} 
                placeholder="••••••••" 
                style={{ borderRadius: 12, padding: '12px 16px', background: '#F1F5F9', border: '1px solid transparent' }}
              />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <Checkbox style={{ color: '#64748B', fontSize: '0.85rem' }}>Ghi nhớ đăng nhập</Checkbox>
              <a href="#" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0D9488' }}>QUÊN MẬT KHẨU?</a>
            </div>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={loading}
                style={{ 
                  borderRadius: 12, 
                  height: 50, 
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  background: '#0D9488',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
                }}
              >
                Đăng nhập hệ thống
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Text style={{ fontSize: '0.85rem', color: '#64748B' }}>
            Gặp sự cố đăng nhập? <a href="#" style={{ color: '#0D9488', fontWeight: 600 }}>Liên hệ hỗ trợ</a>
          </Text>
        </div>
      </div>
    </div>
  );
};
