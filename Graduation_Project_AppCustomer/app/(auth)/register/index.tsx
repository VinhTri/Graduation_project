import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import RegisterStepShell from '@/features/auth/components/RegisterStepShell';
import { useRegisterDraft } from '@/features/auth/context/RegisterContext';
import { isValidGmail } from '@/features/auth/constants/registerValidation';
import {
  AUTH_INPUT_ICON,
  AUTH_INPUT_PLACEHOLDER,
} from '@/shared/constants/authInputColors';
import { authScreenStyles as styles } from '@/shared/styles/authScreen.styles';

export default function RegisterEmailScreen() {
  const router = useRouter();
  const { email, setEmail } = useRegisterDraft();
  const [value, setValue] = useState(email);
  const [error, setError] = useState('');

  function handleContinue() {
    setError('');

    if (!value.trim()) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }

    if (!isValidGmail(value.trim())) {
      setError('Định dạng email không hợp lệ (bắt buộc đuôi @gmail.com)');
      return;
    }

    setEmail(value.trim());
    router.push('/(auth)/register/password');
  }

  return (
    <RegisterStepShell step={1} subtitle="Bước 1/3 — Nhập Gmail để bắt đầu đăng ký">
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Địa chỉ Gmail</Text>
        <View style={[styles.inputContainer, error ? { borderColor: '#EF4444' } : {}]}>
          <Feather name="mail" size={18} color={AUTH_INPUT_ICON} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="example@gmail.com"
            placeholderTextColor={AUTH_INPUT_PLACEHOLDER}
            keyboardType="email-address"
            autoCapitalize="none"
            value={value}
            onChangeText={(text) => {
              setValue(text);
              if (error) setError('');
            }}
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleContinue} activeOpacity={0.8}>
        <Text style={styles.primaryButtonText}>Tiếp tục</Text>
      </TouchableOpacity>

      <View style={styles.linkRow}>
        <Text style={styles.linkText}>Bạn đã có tài khoản? </Text>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace('/(auth)/login');
          }}
        >
          <Text style={styles.linkAction}>Đăng nhập ngay</Text>
        </TouchableOpacity>
      </View>
    </RegisterStepShell>
  );
}
