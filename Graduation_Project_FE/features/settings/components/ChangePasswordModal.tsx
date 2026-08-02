import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PASTEL_PALETTE } from '../../../shared/constants/PastelPalette';
import { authService } from '../../../shared/api/services/auth.service';
import OtpModal from '../../../shared/components/OtpModal/OtpModal';
import SuccessModal from '../../../shared/components/SuccessModal/SuccessModal';
import { styles } from '../SettingsScreen.styles';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

export const ChangePasswordModal = ({ visible, onClose }: Props) => {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'change' | 'forgot'>('change');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentError, setCurrentError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [otpVisible, setOtpVisible] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setMode('change');
    setCurrentPassword('');
    setPassword('');
    setConfirmPassword('');
    setCurrentError('');
    setPasswordError('');
    setConfirmError('');
    setOtpValue('');
    setOtpError('');
    setOtpVisible(false);
    setSuccessVisible(false);
    AsyncStorage.getItem('userEmail').then(async (email) => {
      if (email) {
        setUserEmail(email);
        return;
      }
      try {
        const { userService } = await import('../../../shared/api/services/userService');
        const profile = await userService.getMyProfile();
        if (profile?.email) {
          setUserEmail(profile.email);
          await AsyncStorage.setItem('userEmail', profile.email);
        }
      } catch {
        // ignore
      }
    });
  }, [visible]);

  const isPasswordValid = PASSWORD_REGEX.test(password);
  const isConfirmValid = isPasswordValid && password === confirmPassword && confirmPassword.length > 0;

  const validateNewPasswords = () => {
    let hasError = false;
    setPasswordError('');
    setConfirmError('');

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu mới');
      hasError = true;
    } else if (!PASSWORD_REGEX.test(password)) {
      setPasswordError('Mật khẩu ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmError('Vui lòng xác nhận mật khẩu');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmError('Mật khẩu xác nhận không khớp');
      hasError = true;
    }

    return !hasError;
  };

  const handleChangePassword = async () => {
    setCurrentError('');
    if (!currentPassword) {
      setCurrentError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!validateNewPasswords()) return;

    setSubmitting(true);
    try {
      await authService.changePassword({
        currentPassword,
        newPassword: password,
      });
      setSuccessVisible(true);
    } catch (error: any) {
      const msg = error?.message || 'Không thể đổi mật khẩu';
      if (msg.toLowerCase().includes('sai mật khẩu') || msg.toLowerCase().includes('mật khẩu')) {
        setCurrentError(msg);
      } else {
        Alert.alert('Lỗi', msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPress = async () => {
    if (!userEmail) {
      Alert.alert('Lỗi', 'Không tìm thấy email tài khoản. Vui lòng đăng nhập lại.');
      return;
    }
    setSubmitting(true);
    try {
      await authService.forgotPassword({ email: userEmail });
      setOtpError('');
      setOtpVisible(true);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể gửi mã OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    try {
      setOtpError('');
      await authService.verifyOtp({ email: userEmail, otp, purpose: 'RESET_PASSWORD' });
      setOtpValue(otp);
      setOtpVisible(false);
      setMode('forgot');
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setConfirmError('');
    } catch (error: any) {
      setOtpError(error?.message || 'Mã OTP không hợp lệ');
    }
  };

  const handleResetPassword = async () => {
    if (!validateNewPasswords()) return;
    setSubmitting(true);
    try {
      await authService.resetPassword({
        email: userEmail,
        otp: otpValue,
        newPassword: password,
      });
      setSuccessVisible(true);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessVisible(false);
    onClose();
  };

  return (
    <>
      <Modal visible={visible && !otpVisible && !successVisible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.securityModalOverlay}>
          <TouchableOpacity style={styles.securityModalBackdrop} activeOpacity={1} onPress={onClose} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.securityModalSheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
          >
            <View style={styles.securityModalHandle} />
            <View style={styles.securityModalHeader}>
              <Text style={styles.securityModalTitle}>
                {mode === 'change' ? 'Đổi mật khẩu' : 'Đặt mật khẩu mới'}
              </Text>
              <TouchableOpacity style={styles.profileModalClose} onPress={onClose} activeOpacity={0.75}>
                <Feather name="x" size={18} color={PASTEL_PALETTE.title} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.securityModalHint}>
                {mode === 'change'
                  ? 'Nhập mật khẩu hiện tại và mật khẩu mới (giống quy tắc đăng ký).'
                  : 'Nhập mật khẩu mới sau khi xác thực OTP thành công.'}
              </Text>

              {mode === 'change' && (
                <View style={styles.securityField}>
                  <Text style={styles.securityLabel}>Mật khẩu hiện tại</Text>
                  <View style={[styles.securityInputWrap, !!currentError && styles.securityInputError]}>
                    <Feather name="lock" size={16} color={PASTEL_PALETTE.textMuted} />
                    <TextInput
                      style={styles.securityInput}
                      placeholder="Nhập mật khẩu cũ"
                      placeholderTextColor={PASTEL_PALETTE.textMuted}
                      secureTextEntry={!showCurrent}
                      value={currentPassword}
                      onChangeText={(t) => {
                        setCurrentPassword(t);
                        if (currentError) setCurrentError('');
                      }}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowCurrent((v) => !v)}>
                      <Feather name={showCurrent ? 'eye' : 'eye-off'} size={16} color={PASTEL_PALETTE.textMuted} />
                    </TouchableOpacity>
                  </View>
                  {!!currentError && <Text style={styles.securityError}>{currentError}</Text>}
                </View>
              )}

              <View style={styles.securityField}>
                <Text style={styles.securityLabel}>Mật khẩu mới</Text>
                <View style={[styles.securityInputWrap, !!passwordError && styles.securityInputError]}>
                  <Feather name="key" size={16} color={PASTEL_PALETTE.textMuted} />
                  <TextInput
                    style={styles.securityInput}
                    placeholder="Tối thiểu 8 ký tự"
                    placeholderTextColor={PASTEL_PALETTE.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (passwordError) setPasswordError('');
                    }}
                    autoCapitalize="none"
                  />
                  {isPasswordValid && <Feather name="check" size={16} color="#10B981" />}
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                    <Feather name={showPassword ? 'eye' : 'eye-off'} size={16} color={PASTEL_PALETTE.textMuted} />
                  </TouchableOpacity>
                </View>
                {!!passwordError && <Text style={styles.securityError}>{passwordError}</Text>}
              </View>

              <View style={styles.securityField}>
                <Text style={styles.securityLabel}>Nhập lại mật khẩu mới</Text>
                <View style={[styles.securityInputWrap, !!confirmError && styles.securityInputError]}>
                  <Feather name="check-circle" size={16} color={PASTEL_PALETTE.textMuted} />
                  <TextInput
                    style={styles.securityInput}
                    placeholder="Nhập lại mật khẩu"
                    placeholderTextColor={PASTEL_PALETTE.textMuted}
                    secureTextEntry={!showConfirm}
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      if (confirmError) setConfirmError('');
                    }}
                    autoCapitalize="none"
                  />
                  {isConfirmValid && <Feather name="check" size={16} color="#10B981" />}
                  <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
                    <Feather name={showConfirm ? 'eye' : 'eye-off'} size={16} color={PASTEL_PALETTE.textMuted} />
                  </TouchableOpacity>
                </View>
                {!!confirmError && <Text style={styles.securityError}>{confirmError}</Text>}
              </View>

              {mode === 'change' && (
                <TouchableOpacity onPress={handleForgotPress} disabled={submitting} style={styles.securityForgotLink}>
                  <Text style={styles.securityForgotText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.securityPrimaryBtn, submitting && { opacity: 0.7 }]}
                activeOpacity={0.85}
                disabled={submitting}
                onPress={mode === 'change' ? handleChangePassword : handleResetPassword}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.securityPrimaryBtnText}>
                    {mode === 'change' ? 'Đổi mật khẩu' : 'Đặt lại mật khẩu'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <OtpModal
        visible={otpVisible}
        email={userEmail}
        errorMessage={otpError}
        onClose={() => setOtpVisible(false)}
        onVerify={handleVerifyOtp}
      />

      <SuccessModal
        visible={successVisible}
        title="Đổi mật khẩu thành công!"
        message="Mật khẩu của bạn đã được cập nhật."
        onClose={handleSuccessClose}
      />
    </>
  );
};
