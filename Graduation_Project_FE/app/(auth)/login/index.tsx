import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  ScrollView, SafeAreaView, Platform, KeyboardAvoidingView, Alert
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { styles } from './_login.styles';
import FeatureSlider from '../../../shared/components/FeatureSlider/FeatureSlider';
import { useRouter } from 'expo-router';
import { authService } from '../../../shared/api/services/auth.service';
import SuccessModal from '../../../shared/components/SuccessModal/SuccessModal';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Trạng thái ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  // State lưu lỗi
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // State Modal Thành công
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // Validate định dạng email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async () => {
    // Reset lỗi
    setEmailError('');
    setPasswordError('');
    let hasError = false;

    // Validate cục bộ
    if (!email) {
      setEmailError('Vui lòng nhập địa chỉ email');
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError('Định dạng email không hợp lệ (ví dụ: abc@gmail.com)');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu');
      hasError = true;
    } else if (password.length < 8) {
      setPasswordError('Mật khẩu phải chứa ít nhất 8 ký tự');
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await authService.login({ username: email, password });
      console.log('Đăng nhập thành công', response);
      // Hiển thị modal thành công thay vì dùng Alert
      setIsSuccessModalVisible(true);
    } catch (error: any) {
      // Bắt lỗi từ API
      const errorMessage = error?.message;
      if (errorMessage === 'Tài khoản chưa có trong hệ thống!') {
        setEmailError('Tài khoản chưa đăng ký vui lòng đăng ký để sử dụng');
      } else if (errorMessage === 'Sai mật khẩu!') {
        setPasswordError('Sai mật khẩu');
      } else {
        Alert.alert("Lỗi", errorMessage || "Đăng nhập thất bại");
      }
    }
  };

  const handleSuccessClose = () => {
    setIsSuccessModalVisible(false);
    // Sau khi đóng modal, chuyển hướng vào màn hình chính
    // router.replace('/(main)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* CÁC KHỐI TRÒN TRANG TRÍ ĐỂ TẠO HIỆU ỨNG BACKGROUND MỜ */}
      <View style={[styles.bgCircle, styles.circleTopLeft]} />
      <View style={[styles.bgCircle, styles.circleMiddleRight]} />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* ================= PHẦN TRÊN ================= */}
          <FeatureSlider />

          {/* ================= PHẦN DƯỚI (FORM) ================= */}
          <View style={styles.bottomSection}>
            <View style={styles.dragHandle} />
            
            <Text style={styles.brandTitle}>SmartSpend</Text>
            <Text style={styles.brandSubtitle}>Đăng nhập để quản lý tài chính cá nhân</Text>

            <View style={styles.formContainer}>
              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Địa chỉ Email</Text>
                <View style={[styles.inputContainer, emailError ? { borderColor: '#EF4444' } : {}]}>
                  <Feather name="mail" size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Nhập email của bạn" 
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (emailError) setEmailError('');
                    }}
                  />
                </View>
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </View>

              {/* Mật khẩu */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mật khẩu</Text>
                <View style={[styles.inputContainer, passwordError ? { borderColor: '#EF4444' } : {}]}>
                  <Feather name="lock" size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Nhập mật khẩu" 
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) setPasswordError('');
                    }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Feather name={showPassword ? "eye" : "eye-off"} size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              </View>

              {/* Quên mật khẩu */}
              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity>
                  <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </View>

              {/* Nút đăng nhập */}
              <TouchableOpacity onPress={handleLogin} style={styles.loginButton} activeOpacity={0.8}>
                <Text style={styles.loginButtonText}>Đăng nhập</Text>
              </TouchableOpacity>

              {/* Hoặc tiếp tục bằng (Tạm ẩn) */}
              {/*
              <View style={styles.dividerContainer}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>Hoặc tiếp tục bằng</Text>
                <View style={styles.line} />
              </View>

              <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                  <View style={styles.socialContent}>
                    <FontAwesome5 name="google" size={18} color="#EA4335" />
                    <Text style={styles.socialText}>Google</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                  <View style={styles.socialContent}>
                    <FontAwesome5 name="apple" size={18} color="#000000" />
                    <Text style={styles.socialText}>Apple</Text>
                  </View>
                </TouchableOpacity>
              </View>
              */}

              {/* Chuyển hướng đăng ký */}
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Bạn chưa có tài khoản? </Text>
                <TouchableOpacity onPress={() => router.replace("/(auth)/register")}>
                  <Text style={styles.registerLink}>Đăng ký ngay</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL THÀNH CÔNG */}
      <SuccessModal
        visible={isSuccessModalVisible}
        title="Đăng nhập thành công!"
        message="Chào mừng bạn quay lại với SmartSpend."
        onClose={handleSuccessClose}
      />
    </SafeAreaView>
  );
}
