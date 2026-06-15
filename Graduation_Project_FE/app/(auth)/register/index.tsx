import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  ScrollView, SafeAreaView, Platform, KeyboardAvoidingView, Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from './_register.styles';
import FeatureSlider from '../../../shared/components/FeatureSlider/FeatureSlider';
import { useRouter } from 'expo-router';
import { authService } from '../../../shared/api/services/auth.service';
import OtpModal from '../../../shared/components/OtpModal/OtpModal';
import SuccessModal from '../../../shared/components/SuccessModal/SuccessModal';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Trạng thái ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Lỗi
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Modal OTP & Success
  const [isOtpVisible, setIsOtpVisible] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // Validate định dạng email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Regex check: 8 chars, 1 uppercase, 1 lowercase, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;
  const isPasswordValid = passwordRegex.test(password);
  const isConfirmPasswordValid = isPasswordValid && password === confirmPassword && confirmPassword.length > 0;

  const handleRegisterClick = async () => {
    // Reset lỗi
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    let hasError = false;

    if (!name.trim()) {
      setNameError('Vui lòng nhập họ và tên');
      hasError = true;
    }
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
    } else if (!passwordRegex.test(password)) {
      setPasswordError('Mật khẩu ít nhất 8 ký tự, gồm chữ hoa, chữ thường và ký tự đặc biệt');
      hasError = true;
    }
    if (!confirmPassword) {
      setConfirmPasswordError('Vui lòng xác nhận mật khẩu');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp');
      hasError = true;
    }

    if (hasError) return;

    try {
      // Yêu cầu gửi OTP về email (bên trong gọi backend API)
      await authService.sendRegisterOtp({ email });
      setOtpError('');
      setIsOtpVisible(true);
    } catch (error: any) {
      const errorMessage = error?.message;
      if (errorMessage === 'Tài khoản email đã tồn tại!') {
        setEmailError('Email này đã được đăng ký');
      } else if (errorMessage === 'Tên đăng nhập này đã tồn tại!') {
        // Ta đang dùng email làm username luôn
        setEmailError('Tài khoản này đã được đăng ký');
      } else {
        Alert.alert('Lỗi', errorMessage || 'Không thể gửi mã OTP');
      }
    }
  };

  const handleVerifyOtp = async (otpValue: string) => {
    try {
      setOtpError('');
      // Backend đang yêu cầu username, ta truyền email vào username
      await authService.register({
        username: email,
        password: password,
        email: email,
        otp: otpValue
      });
      
      setIsOtpVisible(false);
      // Hiển thị modal thành công thay vì dùng Alert
      setIsSuccessModalVisible(true);
    } catch (error: any) {
      const errorMessage = error?.message;
      if (errorMessage === 'Mã OTP không hợp lệ hoặc đã được sử dụng!') {
        setOtpError('Mã OTP không hợp lệ');
      } else if (errorMessage === 'Mã OTP đã hết hạn!') {
        setOtpError('Mã OTP đã hết hạn');
      } else {
        setOtpError(errorMessage || 'Đăng ký thất bại');
      }
    }
  };

  const handleSuccessClose = () => {
    setIsSuccessModalVisible(false);
    // Chuyển hướng sang màn hình đăng nhập
    router.replace('/(auth)/login');
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
            <Text style={styles.brandSubtitle}>Nhập thông tin để đăng ký tài khoản mới</Text>

            <View style={styles.formContainer}>
              {/* Họ và tên */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Họ và tên</Text>
                <View style={[styles.inputContainer, nameError ? { borderColor: '#EF4444' } : {}]}>
                  <Feather name="user" size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Nhập họ và tên của bạn" 
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      if (nameError) setNameError('');
                    }}
                  />
                </View>
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
              </View>

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
                    placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)" 
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) setPasswordError('');
                    }}
                  />
                  {isPasswordValid && (
                    <Feather name="check" size={20} color="#10B981" style={{ marginRight: 8 }} />
                  )}
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Feather name={showPassword ? "eye" : "eye-off"} size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              </View>

              {/* Xác nhận mật khẩu */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Xác nhận mật khẩu</Text>
                <View style={[styles.inputContainer, confirmPasswordError ? { borderColor: '#EF4444' } : {}]}>
                  <Feather name="check-circle" size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Nhập lại mật khẩu" 
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (confirmPasswordError) setConfirmPasswordError('');
                    }}
                  />
                  {isConfirmPasswordValid && (
                    <Feather name="check" size={20} color="#10B981" style={{ marginRight: 8 }} />
                  )}
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                    <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
              </View>

              {/* Nút đăng ký */}
              <TouchableOpacity onPress={handleRegisterClick} style={styles.registerButton} activeOpacity={0.8}>
                <Text style={styles.registerButtonText}>Đăng ký tài khoản</Text>
              </TouchableOpacity>

              {/* Chuyển hướng đăng nhập */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Bạn đã có tài khoản? </Text>
                <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                  <Text style={styles.loginLink}>Đăng nhập ngay</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL OTP */}
      <OtpModal
        visible={isOtpVisible}
        email={email}
        errorMessage={otpError}
        onClose={() => setIsOtpVisible(false)}
        onVerify={handleVerifyOtp}
      />

      {/* MODAL THÀNH CÔNG */}
      <SuccessModal
        visible={isSuccessModalVisible}
        title="Đăng ký thành công!"
        message="Tài khoản của bạn đã được tạo thành công. Vui lòng đăng nhập để bắt đầu."
        onClose={handleSuccessClose}
      />
    </SafeAreaView>
  );
}
