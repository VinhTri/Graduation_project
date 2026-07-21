import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  ScrollView, Platform, KeyboardAvoidingView, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { styles } from './_forgot.styles';
import { AUTH_INPUT_ICON, AUTH_INPUT_PLACEHOLDER } from '../../../shared/constants/authInputColors';
import { AuthBrandHeader } from '../../../shared/components/AuthBrandHeader';
import FeatureSlider from '../../../shared/components/FeatureSlider/FeatureSlider';
import { useRouter } from 'expo-router';
import { authService } from '../../../shared/api/services/auth.service';
import OtpModal from '../../../shared/components/OtpModal/OtpModal';
import SuccessModal from '../../../shared/components/SuccessModal/SuccessModal';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  
  // State quản lý luồng (1: Nhập email, 2: Nhập mật khẩu mới)
  const [step, setStep] = useState<1 | 2>(1);
  
  // State dữ liệu
  const [email, setEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Trạng thái ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State lỗi
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Modal
  const [isOtpVisible, setIsOtpVisible] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // Validate định dạng email (chỉ cho phép @gmail.com)
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@gmail\.com$/.test(email);
  };

  // Regex check: 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  const isPasswordValid = passwordRegex.test(password);
  const isConfirmPasswordValid = isPasswordValid && password === confirmPassword && confirmPassword.length > 0;

  // BƯỚC 1: XỬ LÝ GỬI EMAIL ĐỂ NHẬN OTP
  const handleSendOtp = async () => {
    setEmailError('');
    if (!email) {
      setEmailError('Vui lòng nhập địa chỉ email');
      return;
    } else if (!isValidEmail(email)) {
      setEmailError('Định dạng email không hợp lệ (bắt buộc đuôi @gmail.com)');
      return;
    }

    try {
      await authService.forgotPassword({ email });
      setOtpError('');
      setIsOtpVisible(true);
    } catch (error: any) {
      const errorMessage = error?.message;
      if (errorMessage === 'Tài khoản chưa có trong hệ thống!') {
        setEmailError('Tài khoản chưa đăng ký vui lòng đăng ký để sử dụng');
      } else {
        Alert.alert('Lỗi', errorMessage || 'Không thể gửi mã OTP');
      }
    }
  };

  // BƯỚC 2: XÁC THỰC MÃ OTP (Từ Modal)
  const handleVerifyOtp = async (otp: string) => {
    try {
      setOtpError('');
      // Gọi API kiểm tra OTP trước khi cho phép sang bước đổi mật khẩu
      await authService.verifyOtp({ email, otp, purpose: 'RESET_PASSWORD' });
      
      // Nếu đúng, lưu mã OTP lại và chuyển sang bước 2 để đặt mật khẩu mới
      setOtpValue(otp);
      setIsOtpVisible(false);
      setStep(2);
    } catch (error: any) {
      const errorMessage = error?.message || 'Mã OTP không hợp lệ';
      setOtpError(errorMessage);
    }
  };

  // BƯỚC 3: XỬ LÝ ĐẶT LẠI MẬT KHẨU MỚI
  const handleResetPassword = async () => {
    setPasswordError('');
    setConfirmPasswordError('');
    let hasError = false;

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu mới');
      hasError = true;
    } else if (!passwordRegex.test(password)) {
      setPasswordError('Mật khẩu ít nhất 8 ký tự, gồm chữ hoa, thường, số và ký tự đặc biệt');
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
      await authService.resetPassword({
        email: email,
        otp: otpValue,
        newPassword: password
      });
      
      // Hiển thị modal thành công
      setIsSuccessModalVisible(true);
    } catch (error: any) {
      const errorMessage = error?.message;
      if (errorMessage === 'Mã OTP không hợp lệ hoặc đã hết hạn!') {
        Alert.alert('Lỗi OTP', 'Mã OTP không hợp lệ hoặc đã hết hạn, vui lòng thử lại.', [
          { text: 'Xác nhận', onPress: () => {
             setStep(1); 
             setOtpValue(''); 
             setPassword(''); 
             setConfirmPassword('');
          }}
        ]);
      } else {
        Alert.alert('Lỗi', errorMessage || 'Đặt lại mật khẩu thất bại');
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
      {/* Background */}
      <View style={[styles.bgCircle, styles.circleTopLeft]} />
      <View style={[styles.bgCircle, styles.circleMiddleRight]} />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <FeatureSlider />

          <View style={styles.bottomSection}>
            <View style={styles.dragHandle} />
            
            <AuthBrandHeader
              subtitle={step === 1 ? 'Khôi phục mật khẩu tài khoản' : 'Đặt lại mật khẩu mới an toàn'}
            />

            <View style={styles.formContainer}>
              
              {/* FORM BƯỚC 1: NHẬP EMAIL */}
              {step === 1 && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Địa chỉ Email</Text>
                    <View style={[styles.inputContainer, emailError ? { borderColor: '#EF4444' } : {}]}>
                      <Feather name="mail" size={18} color={AUTH_INPUT_ICON} style={styles.inputIcon} />
                      <TextInput 
                        style={styles.input} 
                        placeholder="Nhập email của bạn" 
                        placeholderTextColor={AUTH_INPUT_PLACEHOLDER}
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

                  <TouchableOpacity onPress={handleSendOtp} style={styles.primaryButton} activeOpacity={0.8}>
                    <Text style={styles.primaryButtonText}>Tiếp tục</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* FORM BƯỚC 2: NHẬP MẬT KHẨU MỚI */}
              {step === 2 && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mật khẩu mới</Text>
                    <View style={[styles.inputContainer, passwordError ? { borderColor: '#EF4444' } : {}]}>
                      <Feather name="lock" size={18} color={AUTH_INPUT_ICON} style={styles.inputIcon} />
                      <TextInput 
                        style={styles.input} 
                        placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)" 
                        placeholderTextColor={AUTH_INPUT_PLACEHOLDER}
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
                        <Feather name={showPassword ? "eye" : "eye-off"} size={18} color={AUTH_INPUT_ICON} />
                      </TouchableOpacity>
                    </View>
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
                    <View style={[styles.inputContainer, confirmPasswordError ? { borderColor: '#EF4444' } : {}]}>
                      <Feather name="check-circle" size={18} color={AUTH_INPUT_ICON} style={styles.inputIcon} />
                      <TextInput 
                        style={styles.input} 
                        placeholder="Nhập lại mật khẩu" 
                        placeholderTextColor={AUTH_INPUT_PLACEHOLDER}
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
                        <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={18} color={AUTH_INPUT_ICON} />
                      </TouchableOpacity>
                    </View>
                    {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
                  </View>

                  <TouchableOpacity onPress={handleResetPassword} style={styles.primaryButton} activeOpacity={0.8}>
                    <Text style={styles.primaryButtonText}>Đặt lại mật khẩu</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Chuyển hướng quay lại đăng nhập */}
              <View style={styles.linkRow}>
                <Text style={styles.linkText}>Nhớ mật khẩu rồi? </Text>
                <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                  <Text style={styles.linkAction}>Quay lại Đăng nhập</Text>
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
        title="Đổi mật khẩu thành công!"
        message="Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập bằng mật khẩu mới."
        onClose={handleSuccessClose}
      />
    </SafeAreaView>
  );
}
