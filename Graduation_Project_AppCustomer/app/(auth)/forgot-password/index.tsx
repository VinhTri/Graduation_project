import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authScreenStyles as styles } from '@/shared/styles/authScreen.styles';
import { registerScreenStyles as shell } from '@/features/auth/styles/registerScreen.styles';
import {
  AUTH_INPUT_ICON,
  AUTH_INPUT_PLACEHOLDER,
} from '@/shared/constants/authInputColors';
import AuthBrandHeader from '@/shared/components/AuthBrandHeader/AuthBrandHeader';
import { authService } from '@/shared/api/services/auth.service';
import OtpModal from '@/shared/components/OtpModal/OtpModal';
import SuccessModal from '@/shared/components/SuccessModal/SuccessModal';
import { isPasswordValid, isValidGmail } from '@/features/auth/constants/registerValidation';
import PasswordRequirementList from '@/features/auth/components/PasswordRequirementList';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isOtpVisible, setIsOtpVisible] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const passwordOk = isPasswordValid(password);
  const confirmOk = passwordOk && password === confirmPassword && confirmPassword.length > 0;

  const handleSendOtp = async () => {
    setEmailError('');
    if (!email) {
      setEmailError('Vui lòng nhập địa chỉ email');
      return;
    }
    if (!isValidGmail(email)) {
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

  const handleVerifyOtp = async (otp: string) => {
    try {
      setOtpError('');
      await authService.verifyOtp({ email, otp, purpose: 'RESET_PASSWORD' });
      setOtpValue(otp);
      setIsOtpVisible(false);
      setStep(2);
    } catch (error: any) {
      setOtpError(error?.message || 'Mã OTP không hợp lệ');
    }
  };

  const handleResetPassword = async () => {
    setPasswordError('');
    setConfirmPasswordError('');
    let hasError = false;

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu mới');
      hasError = true;
    } else if (!passwordOk) {
      setPasswordError('Mật khẩu chưa đủ điều kiện');
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
      await authService.resetPassword({ email, otp: otpValue, newPassword: password });
      setIsSuccessModalVisible(true);
    } catch (error: any) {
      const errorMessage = error?.message;
      if (errorMessage === 'Mã OTP không hợp lệ hoặc đã hết hạn!') {
        Alert.alert('Lỗi OTP', 'Mã OTP không hợp lệ hoặc đã hết hạn, vui lòng thử lại.', [
          {
            text: 'Xác nhận',
            onPress: () => {
              setStep(1);
              setOtpValue('');
              setPassword('');
              setConfirmPassword('');
            },
          },
        ]);
      } else {
        Alert.alert('Lỗi', errorMessage || 'Đặt lại mật khẩu thất bại');
      }
    }
  };

  return (
    <SafeAreaView style={shell.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={shell.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AuthBrandHeader
            subtitle={
              step === 1 ? 'Khôi phục mật khẩu tài khoản' : 'Đặt lại mật khẩu mới an toàn'
            }
          />

          <View style={[styles.formContainer, shell.formFlex]}>
            {step === 1 && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Địa chỉ Email</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      emailError ? { borderColor: '#EF4444' } : {},
                    ]}
                  >
                    <Feather
                      name="mail"
                      size={18}
                      color={AUTH_INPUT_ICON}
                      style={styles.inputIcon}
                    />
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

                <TouchableOpacity
                  onPress={handleSendOtp}
                  style={styles.primaryButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>Tiếp tục</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 2 && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mật khẩu mới</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      password.length > 0 && !passwordOk
                        ? styles.inputContainerInvalid
                        : null,
                    ]}
                  >
                    <Feather
                      name="lock"
                      size={18}
                      color={AUTH_INPUT_ICON}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Nhập mật khẩu mới"
                      placeholderTextColor={AUTH_INPUT_PLACEHOLDER}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (passwordError) setPasswordError('');
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Feather
                        name={showPassword ? 'eye' : 'eye-off'}
                        size={18}
                        color={AUTH_INPUT_ICON}
                      />
                    </TouchableOpacity>
                  </View>
                  <PasswordRequirementList password={password} />
                  {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      confirmPasswordError ? { borderColor: '#EF4444' } : {},
                    ]}
                  >
                    <Feather
                      name="check-circle"
                      size={18}
                      color={AUTH_INPUT_ICON}
                      style={styles.inputIcon}
                    />
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
                    {confirmOk && (
                      <Feather name="check" size={20} color="#10B981" style={{ marginRight: 8 }} />
                    )}
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeIcon}
                    >
                      <Feather
                        name={showConfirmPassword ? 'eye' : 'eye-off'}
                        size={18}
                        color={AUTH_INPUT_ICON}
                      />
                    </TouchableOpacity>
                  </View>
                  {confirmPasswordError ? (
                    <Text style={styles.errorText}>{confirmPasswordError}</Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  onPress={handleResetPassword}
                  style={[styles.primaryButton, !passwordOk && styles.primaryButtonDisabled]}
                  activeOpacity={0.8}
                  disabled={!passwordOk}
                >
                  <Text style={styles.primaryButtonText}>Đặt lại mật khẩu</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.linkRow}>
              <Text style={styles.linkText}>Nhớ mật khẩu rồi? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.linkAction}>Quay lại Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <OtpModal
        visible={isOtpVisible}
        email={email}
        errorMessage={otpError}
        onClose={() => setIsOtpVisible(false)}
        onVerify={handleVerifyOtp}
      />

      <SuccessModal
        visible={isSuccessModalVisible}
        title="Đổi mật khẩu thành công!"
        message="Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập bằng mật khẩu mới."
        onClose={() => {
          setIsSuccessModalVisible(false);
          router.replace('/(auth)/login');
        }}
      />
    </SafeAreaView>
  );
}
