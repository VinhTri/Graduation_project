import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import RegisterStepShell from '@/features/auth/components/RegisterStepShell';
import { useRegisterDraft } from '@/features/auth/context/RegisterContext';
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette';
import {
  AUTH_INPUT_PLACEHOLDER,
  AUTH_INPUT_TEXT,
} from '@/shared/constants/authInputColors';
import { authScreenStyles as styles } from '@/shared/styles/authScreen.styles';
import { useOtpCountdown } from '@/features/auth/hooks/useOtpCountdown';
import { authService } from '@/shared/api/services/auth.service';
import { persistAuthSession } from '@/shared/services/session.service';

export default function RegisterOtpScreen() {
  const router = useRouter();
  const { email, password, otpExpiresAt, startOtpCountdown } = useRegisterDraft();
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const timeLeft = useOtpCountdown(otpExpiresAt);

  useEffect(() => {
    if (!email || !password) {
      router.replace('/(auth)/register');
    }
  }, [email, password, router]);

  useEffect(() => {
    if (!otpExpiresAt) {
      startOtpCountdown();
    }
  }, [otpExpiresAt, startOtpCountdown]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  async function handleResend() {
    if (resending || timeLeft > 0) return;
    setResending(true);
    setOtpError('');
    try {
      await authService.sendRegisterOtp({ email });
      startOtpCountdown();
      setOtp('');
    } catch (error: any) {
      setOtpError(error?.message || 'Không thể gửi lại OTP');
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit() {
    if (otp.length < 6) {
      setOtpError('Vui lòng nhập đủ 6 chữ số OTP');
      return;
    }

    if (timeLeft === 0) {
      setOtpError('Mã OTP đã hết hạn, vui lòng gửi lại');
      return;
    }

    setLoading(true);
    setOtpError('');
    try {
      const response = await authService.register({
        email,
        password,
        otp,
      });

      if (response.data?.token) {
        await persistAuthSession({
          token: response.data.token,
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
        });
      }

      router.replace('/(auth)/success?mode=register');
    } catch (error: any) {
      const message = error?.message || 'Đăng ký thất bại';
      if (message.toLowerCase().includes('otp')) {
        setOtpError('Mã OTP không hợp lệ hoặc đã hết hạn');
      } else {
        setOtpError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <RegisterStepShell step={3} subtitle="Bước 3/3 — Nhập mã OTP đã gửi về email">
      <View style={otpStyles.page}>
        <View style={otpStyles.centerWrap}>
          <View style={otpStyles.infoBox}>
            <View style={otpStyles.infoIconWrap}>
              <Feather name="mail" size={18} color={PASTEL_PALETTE.accentDeep} />
            </View>
            <Text style={otpStyles.infoText}>
              Mã OTP 6 chữ số đã gửi tới{'\n'}
              <Text style={otpStyles.emailHighlight}>{email}</Text>
            </Text>
          </View>

          <View style={otpStyles.inputGroup}>
            <Text style={otpStyles.label}>Mã OTP</Text>
            <View
              style={[
                otpStyles.inputContainer,
                otpError ? otpStyles.inputContainerError : null,
              ]}
            >
              <TextInput
                style={otpStyles.otpInput}
                placeholder="000000"
                placeholderTextColor={AUTH_INPUT_PLACEHOLDER}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                textAlign="center"
                onChangeText={(text) => {
                  setOtp(text.replace(/\D/g, ''));
                  if (otpError) setOtpError('');
                }}
              />
            </View>
            {otpError ? (
              <Text style={[styles.errorText, otpStyles.errorText]}>{otpError}</Text>
            ) : null}
          </View>

          <Text style={[otpStyles.timerText, timeLeft <= 60 && otpStyles.timerUrgent]}>
            {formatTime(timeLeft)}
          </Text>

          <TouchableOpacity
            onPress={handleResend}
            disabled={timeLeft > 0 || resending}
            style={otpStyles.resendButton}
          >
            <Text
              style={[
                styles.linkAction,
                (timeLeft > 0 || resending) && { opacity: 0.5 },
              ]}
            >
              {resending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Hoàn tất đăng ký</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={otpStyles.backButton}>
          <Text style={styles.linkAction}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    </RegisterStepShell>
  );
}

const otpStyles = StyleSheet.create({
  page: {
    flexGrow: 1,
    width: '100%',
  },
  centerWrap: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    minHeight: 320,
    paddingVertical: 16,
  },
  infoBox: {
    alignItems: 'center',
    backgroundColor: PASTEL_PALETTE.accentSoft,
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    width: '100%',
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PASTEL_PALETTE.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: PASTEL_PALETTE.textMuted,
    lineHeight: 22,
    textAlign: 'center',
  },
  emailHighlight: {
    color: PASTEL_PALETTE.accentDeep,
    fontWeight: '700',
  },
  inputGroup: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    borderRadius: 14,
    backgroundColor: PASTEL_PALETTE.bgSoft,
    height: 56,
    paddingHorizontal: 16,
  },
  inputContainerError: {
    borderColor: '#EF4444',
  },
  otpInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: AUTH_INPUT_TEXT,
    letterSpacing: 10,
    paddingVertical: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  errorText: {
    textAlign: 'center',
    alignSelf: 'center',
    marginTop: 8,
  },
  timerText: {
    fontSize: 16,
    color: PASTEL_PALETTE.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  timerUrgent: {
    color: '#EF4444',
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    alignItems: 'center',
    marginTop: 16,
  },
});
