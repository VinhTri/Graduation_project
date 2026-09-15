import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Checkbox } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api';
import './Login.css';

const { Title, Text } = Typography;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/admin/auth/login', {
        email: values.email.trim(),
        password: values.password,
      });

      const payload = response.data?.data || response.data;
      const token = payload?.token;

      if (!token) {
        message.error('Không tìm thấy token xác thực!');
        return;
      }

      localStorage.setItem('admin_token', token);
      message.success('Đăng nhập thành công!');
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      if (!error.response) {
        message.error(
          'Không kết nối được máy chủ. Hãy chạy api-web-admin (port 8082) rồi thử lại.'
        );
        return;
      }
      message.error(
        error.response?.data?.message || 'Đăng nhập thất bại, vui lòng kiểm tra lại!'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <img
        className="login-page-media"
        src="/brand/admin-login-hero.png"
        alt=""
        aria-hidden
      />
      <div className="login-page-overlay" />

      <header className="login-topbar">
        <div className="login-brand-row">
          <img
            className="login-brand-logo"
            src="/brand/smartspend-icon.png"
            alt="SmartSpend"
          />
          <div>
            <div className="login-brand-name">
              <span className="login-brand-smart">Smart</span>
              <span className="login-brand-spend">Spend</span>
            </div>
            <div className="login-brand-sub">Admin Portal</div>
          </div>
        </div>
      </header>

      <main className="login-main">
        <section className="login-intro" aria-label="Giới thiệu hệ thống">
          <div className="login-intro-kicker">
            <span className="login-intro-kicker-dot" />
            Cổng quản trị nội bộ
          </div>

          <h1 className="login-intro-title">
            Quản lý SmartSpend
            <br />
            <span className="login-intro-title-accent">thông minh &amp; tập trung</span>
          </h1>

          <p className="login-intro-desc">
            Một nơi duy nhất để giám sát người dùng, giao dịch và báo cáo —
            vận hành nhanh, rõ ràng, đồng bộ với ứng dụng SmartSpend.
          </p>

          <div className="login-intro-divider" aria-hidden />

          <ul className="login-intro-points">
            <li>
              <span className="login-intro-icon login-intro-icon-users">
                <TeamOutlined />
              </span>
              <div>
                <strong>Người dùng</strong>
                <span>Quản lý tài khoản và trạng thái hoạt động</span>
              </div>
            </li>
            <li>
              <span className="login-intro-icon login-intro-icon-secure">
                <LockOutlined />
              </span>
              <div>
                <strong>Giao dịch</strong>
                <span>Theo dõi nạp / rút an toàn theo thời gian thực</span>
              </div>
            </li>
            <li>
              <span className="login-intro-icon login-intro-icon-report">
                <BarChartOutlined />
              </span>
              <div>
                <strong>Báo cáo</strong>
                <span>Thống kê tổng quan giúp ra quyết định nhanh</span>
              </div>
            </li>
          </ul>
        </section>

        <section className="login-panel" aria-label="Đăng nhập">
          <div className="login-card">
            <div className="login-card-accent" aria-hidden />
            <div className="login-card-header">
              <div className="login-card-logo-wrap">
                <img className="login-card-logo" src="/brand/smartspend-icon-md.png" alt="SmartSpend" />
              </div>
              <Title level={4} className="login-card-title">
                Đăng nhập quản trị
              </Title>
              <Text className="login-card-sub">
                Truy cập cổng quản lý SmartSpend
              </Text>
            </div>

            <Form
              className="login-form"
              name="admin_login"
              onFinish={onFinish}
              layout="vertical"
              requiredMark={false}
              size="middle"
            >
              <Form.Item
                name="email"
                label={<span className="login-label">Địa chỉ email</span>}
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' },
                ]}
              >
                <Input
                  className="login-input"
                  prefix={
                    <span className="login-input-icon">
                      <UserOutlined />
                    </span>
                  }
                  placeholder="admin@smartspend.com"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span className="login-label">Mật khẩu</span>}
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                style={{ marginBottom: 10 }}
              >
                <Input.Password
                  className="login-input"
                  prefix={
                    <span className="login-input-icon">
                      <LockOutlined />
                    </span>
                  }
                  placeholder="••••••••"
                />
              </Form.Item>

              <div className="login-form-meta">
                <Checkbox className="login-remember">Ghi nhớ đăng nhập</Checkbox>
                <a href="#" className="login-forgot">
                  Quên mật khẩu?
                </a>
              </div>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  className="login-submit"
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                >
                  Đăng nhập hệ thống
                </Button>
              </Form.Item>
            </Form>

            <div className="login-card-footer">
              <SafetyCertificateOutlined />
              <span>Phiên đăng nhập được mã hóa an toàn</span>
            </div>
          </div>

          <div className="login-support">
            Gặp sự cố? <a href="#">Liên hệ hỗ trợ</a>
          </div>
        </section>
      </main>

      <footer className="login-footer">
        SMARTSPEND ADMIN © {new Date().getFullYear()}
      </footer>
    </div>
  );
};
