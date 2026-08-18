import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import RegisterStepShell from '@/features/auth/components/RegisterStepShell';
import PasswordRequirementList from '@/features/auth/components/PasswordRequirementList';
import { useRegisterDraft } from '@/features/auth/context/RegisterContext';
import { isPasswordValid } from '@/features/auth/constants/registerValidation';
import {
  AUTH_INPUT_ICON,
  AUTH_INPUT_PLACEHOLDER,
} from '@/shared/constants/authInputColors';
import { authScreenStyles as styles } from '@/shared/styles/authScreen.styles';
import { authService } from '@/shared/api/services/auth.service';

export default function RegisterPasswordScreen() {
  const router = useRouter();
  const { email, password, setPassword, startOtpCountdown } = useRegisterDraft();
  const [value, setValue] = useState(password);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      router.replace('/(auth)/register');
    }
  }, [email, router]);

  const passwordOk = isPasswordValid(value);
  const confirmOk = passwordOk && value === confirmPassword && confirmPassword.length > 0;

  async function handleContinue() {
    setConfirmPasswordError('');
    setSubmitError('');

    if (!passwordOk) return;

    if (!confirmPassword) {
      setConfirmPasswordError('Vui lòng xác nhận mật khẩu');
      return;
    }

    if (value !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      await authService.sendRegisterOtp({ email });
      setPassword(value);
      startOtpCountdown();
      router.push('/(auth)/register/otp');
    } catch (error: any) {
      const message = error?.message || 'Không thể gửi mã OTP';
      if (
        message === 'Email này đã được sử dụng!' ||
        message === 'Tài khoản email đã tồn tại!' ||
        message === 'Tên đăng nhập này đã tồn tại!' ||
        message.toLowerCase().includes('email') ||
        message.toLowerCase().includes('tồn tại')
      ) {
        setSubmitError('Email này đã được đăng ký. Vui lòng đăng nhập.');
      } else {
        setSubmitError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <RegisterStepShell step={2} subtitle="Tạo mật khẩu đăng nhập của bạn">
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mật khẩu đăng nhập</Text>
        <View
          style={[
            styles.inputContainer,
            value.length > 0 && !passwordOk ? styles.inputContainerInvalid : null,
          ]}
        >
          <Feather name="lock" size={18} color={AUTH_INPUT_ICON} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu đăng nhập"
            placeholderTextColor={AUTH_INPUT_PLACEHOLDER}
            secureTextEntry={!showPassword}
            value={value}
            onChangeText={setValue}
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
        <PasswordRequirementList password={value} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Xác nhận mật khẩu</Text>
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

      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (loading || !passwordOk) && styles.primaryButtonDisabled,
        ]}
        onPress={handleContinue}
        activeOpacity={0.8}
        disabled={loading || !passwordOk}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Tiếp tục</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
        style={{ alignItems: 'center', marginTop: 16 }}
      >
        <Text style={styles.linkAction}>Quay lại</Text>
      </TouchableOpacity>
    </RegisterStepShell>
  );
}
