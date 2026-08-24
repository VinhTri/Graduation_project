import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { persistAuthSession } from '@/shared/services/session.service';
import { authScreenStyles as formStyles } from '@/shared/styles/authScreen.styles';
import { loginScreenStyles as styles } from '@/features/auth/styles/loginScreen.styles';
import {
  AUTH_INPUT_ICON,
  AUTH_INPUT_PLACEHOLDER,
} from '@/shared/constants/authInputColors';
import AuthBrandHeader from '@/shared/components/AuthBrandHeader/AuthBrandHeader';
import LoginFeatureSlider from '@/features/auth/components/LoginFeatureSlider/LoginFeatureSlider';
import { authService } from '@/shared/api/services/auth.service';
import { showAccountLockedAlert } from '@/features/auth/accountLock';

const isValidEmail = (email: string) => /^[^\s@]+@gmail\.com$/.test(email);

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');
    let hasError = false;

    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    if (!trimmedEmail) {
      setEmailError('Vui lòng nhập địa chỉ email');
      hasError = true;
    } else if (!isValidEmail(trimmedEmail)) {
      setEmailError('Định dạng email không hợp lệ (bắt buộc đuôi @gmail.com)');
      hasError = true;
    }

    if (!trimmedPassword) {
      setPasswordError('Vui lòng nhập mật khẩu');
      hasError = true;
    } else if (trimmedPassword.length < 8) {
      setPasswordError('Mật khẩu phải chứa ít nhất 8 ký tự');
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await authService.login({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (response.data?.token) {
        await persistAuthSession({
          token: response.data.token,
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
        });
      }

      if (response.data?.securityLocked) {
        router.replace('/(tabs)/home');
        setTimeout(() => {
          void showAccountLockedAlert(trimmedEmail);
        }, 300);
        return;
      }

      router.replace('/(auth)/success?mode=login');
    } catch (error: any) {
      const message = error?.message || 'Đăng nhập thất bại';
      const code = error?.code as string | undefined;
      const fieldErrors = error?.data as Record<string, string> | undefined;

      if (code === 'AUTH_1017') {
        await showAccountLockedAlert(trimmedEmail);
        return;
      }

      // Tài khoản chưa đăng ký
      if (
        code === 'AUTH_1001' ||
        message === 'Tài khoản chưa có trong hệ thống!' ||
        message.toLowerCase().includes('chưa có trong hệ thống')
      ) {
        setEmailError('Tài khoản chưa đăng ký vui lòng đăng ký để sử dụng');
        return;
      }

      // Sai mật khẩu
      if (
        code === 'AUTH_1006' ||
        message === 'Sai mật khẩu!' ||
        message.toLowerCase().includes('sai mật khẩu')
      ) {
        setPasswordError('Sai mật khẩu');
        return;
      }

      // Lỗi validate field từ BE
      if (fieldErrors?.email) {
        setEmailError(fieldErrors.email);
        return;
      }
      if (fieldErrors?.password) {
        setPasswordError(fieldErrors.password);
        return;
      }

      Alert.alert('Lỗi', message);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroWrap}>
            <LoginFeatureSlider />
            <SafeAreaView edges={['top']} style={styles.brandOverlay}>
              <AuthBrandHeader variant="compact" />
            </SafeAreaView>
          </View>

          <SafeAreaView edges={['bottom']} style={styles.bottomSection}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Đăng nhập</Text>
              <Text style={styles.formSubtitle}>
                Nhập email và mật khẩu để tiếp tục
              </Text>
            </View>

            <View style={[formStyles.formContainer, styles.loginFormContainer]}>
              <View style={formStyles.inputGroup}>
                <Text style={formStyles.label}>Địa chỉ Email</Text>
                <View
                  style={[
                    formStyles.inputContainer,
                    emailError ? { borderColor: '#EF4444' } : {},
                  ]}
                >
                  <Feather
                    name="mail"
                    size={18}
                    color={AUTH_INPUT_ICON}
                    style={formStyles.inputIcon}
                  />
                  <TextInput
                    style={formStyles.input}
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
                {emailError ? <Text style={formStyles.errorText}>{emailError}</Text> : null}
              </View>

              <View style={formStyles.inputGroup}>
                <Text style={formStyles.label}>Mật khẩu</Text>
                <View
                  style={[
                    formStyles.inputContainer,
                    passwordError ? { borderColor: '#EF4444' } : {},
                  ]}
                >
                  <Feather
                    name="lock"
                    size={18}
                    color={AUTH_INPUT_ICON}
                    style={formStyles.inputIcon}
                  />
                  <TextInput
                    style={formStyles.input}
                    placeholder="Nhập mật khẩu"
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
                    style={formStyles.eyeIcon}
                  >
                    <Feather
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={18}
                      color={AUTH_INPUT_ICON}
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? (
                  <Text style={formStyles.errorText}>{passwordError}</Text>
                ) : null}
              </View>

              <View style={formStyles.forgotPasswordContainer}>
                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text style={formStyles.forgotPasswordText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleLogin}
                style={formStyles.primaryButton}
                activeOpacity={0.8}
              >
                <Text style={formStyles.primaryButtonText}>Đăng nhập</Text>
              </TouchableOpacity>

              <View style={formStyles.linkRow}>
                <Text style={formStyles.linkText}>Bạn chưa có tài khoản? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                  <Text style={formStyles.linkAction}>Đăng ký ngay</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
