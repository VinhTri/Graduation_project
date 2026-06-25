import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, message, Card, Typography, Modal, Form, Input, Switch, ColorPicker, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { apiClient } from '../../services/api';

const { Title } = Typography;

interface PostResponse {
  id: number;
  title: string;
  imageUrl: string;
  targetLink: string;
  active: boolean;
  createdAt: string;
}

export const ManagePosts = () => {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<PostResponse | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/admin/posts');
      // Adjust according to standard backend response wrapper. 
      // If backend returns directly a list, use response.data.
      const data = response.data.data || response.data;
      setPosts(data);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Không thể tải danh sách bài viết';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Xóa bài viết',
      content: 'Bạn có chắc chắn muốn xóa bài viết này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await apiClient.delete(`/api/v1/admin/posts/${id}`);
          message.success('Đã xóa bài viết');
          fetchPosts();
        } catch (error: any) {
          const errorMsg = error?.response?.data?.message || error?.message || 'Lỗi khi xóa bài viết';
          message.error(errorMsg);
        }
      }
    });
  };

  const handleOpenModal = (post?: PostResponse) => {
    if (post) {
      setEditingPost(post);
      form.setFieldsValue({
        ...post
      });
    } else {
      setEditingPost(null);
      form.resetFields();
      form.setFieldsValue({
        active: true
      });
    }
    setModalVisible(true);
  };

  const handleSave = async (values: any) => {
    try {
      setSubmitting(true);
      const payload = {
        ...values
      };

      if (editingPost) {
        await apiClient.put(`/api/v1/admin/posts/${editingPost.id}`, payload);
        message.success('Cập nhật bài viết thành công');
      } else {
        await apiClient.post('/api/v1/admin/posts', payload);
        message.success('Tạo bài viết thành công');
      }
      setModalVisible(false);
      fetchPosts();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi lưu bài viết';
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setUploading(true);
      const res = await apiClient.post('/api/v1/admin/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // The backend returns { data: "http://localhost:9090/uploads/..." }
      const uploadedUrl = res.data?.data || res.data;
      
      // Update form field
      form.setFieldsValue({ imageUrl: uploadedUrl });
      message.success('Tải ảnh lên thành công!');
      onSuccess("Ok");
    } catch (err: any) {
      console.error(err);
      message.error('Lỗi khi tải ảnh lên');
      onError(err);
    } finally {
      setUploading(false);
    }
  };

  const columns: ColumnsType<PostResponse> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 120,
      render: (url: string) => (
        <div style={{ width: 80, height: 45, borderRadius: 4, overflow: 'hidden', border: '1px solid #d9d9d9' }}>
          <img src={url} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )
    },
    {
      title: 'Tiêu đề chính',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Đường dẫn (Link)',
      dataIndex: 'targetLink',
      key: 'targetLink',
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'error'}>
          {active ? 'Hiển thị' : 'Ẩn'}
        </Tag>
      ),
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" ghost onClick={() => handleOpenModal(record)}>
            Sửa
          </Button>
          <Button type="primary" danger onClick={() => handleDelete(record.id)}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card style={{ borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Title level={4} style={{ margin: 0 }}>Quản Lý Bài Viết Khám Phá</Title>
        <Button type="primary" onClick={() => handleOpenModal()}>
          + Thêm bài viết mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={posts}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingPost ? "Sửa bài viết" : "Thêm bài viết mới"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{ active: true, bgColor: '#8B5CF6' }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề bài viết (Dùng để quản lý)"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Hình ảnh (Upload hoặc Nhập URL)"
            required
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <Form.Item
                name="imageUrl"
                noStyle
                rules={[{ required: true, message: 'Vui lòng nhập link hình ảnh' }]}
              >
                <Input placeholder="https://example.com/image.png" style={{ flex: 1 }} />
              </Form.Item>
              <Upload
                customRequest={handleUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  Upload File
                </Button>
              </Upload>
            </div>
            <Form.Item
              shouldUpdate={(prevValues, currentValues) => prevValues.imageUrl !== currentValues.imageUrl}
              noStyle
            >
              {({ getFieldValue }) => {
                const url = getFieldValue('imageUrl');
                if (!url) return null;
                return (
                  <div style={{ marginTop: 12, height: 120, borderRadius: 8, overflow: 'hidden', border: '1px solid #d9d9d9' }}>
                    <img src={url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#f0f0f0' }} />
                  </div>
                );
              }}
            </Form.Item>
          </Form.Item>

          <Form.Item
            name="targetLink"
            label="Đường dẫn khi bấm vào (Target Link - Không bắt buộc)"
          >
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item
            name="active"
            label="Trạng thái hiển thị"
            valuePropName="checked"
          >
            <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginTop: 24, marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Lưu
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
