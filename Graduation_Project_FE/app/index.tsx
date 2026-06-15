import { Redirect } from 'expo-router';

export default function Index() {
  // Chuyển hướng người dùng thẳng đến màn hình Đăng Nhập khi vừa mở app
  return <Redirect href="/(auth)/login" />;
}
