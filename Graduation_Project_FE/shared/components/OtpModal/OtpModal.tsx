import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Modal, 
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from './OtpModal.styles';

interface OtpModalProps {
  visible: boolean;
  email: string;
  errorMessage?: string; // Lỗi truyền từ Component cha (như lỗi sai OTP)
  isSendingOtp?: boolean;
  onClose: () => void;
  onVerify: (otp: string) => void;
}

export default function OtpModal({ visible, email, errorMessage, isSendingOtp = false, onClose, onVerify }: OtpModalProps) {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 phút = 300 giây

  // Reset state mỗi khi Modal mở lại
  useEffect(() => {
    if (visible) {
      setOtp('');
      setTimeLeft(300);
    }
  }, [visible]);

  // Bộ đếm ngược thời gian
  useEffect(() => {
    if (!visible) return;

    if (timeLeft === 0) {
      Alert.alert("Hết hạn", "Mã OTP đã hết hạn, vui lòng thử lại.", [
        { text: "Đóng", onPress: onClose }
      ]);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, visible, onClose]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleVerify = () => {
    if (otp.length < 6) return;
    onVerify(otp);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <Feather name="mail" size={32} color="#109185" />
          </View>

          <Text style={styles.title}>Xác thực Email</Text>
          <Text style={styles.subtitle}>
            {isSendingOtp ? (
              'Đang gửi mã OTP gồm 6 chữ số về email:'
            ) : (
              'Đã gửi mã OTP gồm 6 chữ số về email:'
            )}
            {"\n"}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>

          <View style={styles.inputContainer}>
            {isSendingOtp ? (
              <View style={styles.sendingContainer}>
                <ActivityIndicator size="small" color="#109185" />
                <Text style={styles.sendingText}>Đang gửi mã OTP...</Text>
              </View>
            ) : (
              <TextInput
                style={[
                  styles.otpInput, 
                  errorMessage ? styles.otpInputError : null
                ]}
                placeholder="000000"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                editable={timeLeft > 0}
              />
            )}
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </View>

          {!isSendingOtp && (
            <Text style={[styles.timerText, timeLeft <= 60 ? styles.timerUrgent : null]}>
              {formatTime(timeLeft)}
            </Text>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.verifyButton, 
                (isSendingOtp || otp.length < 6 || timeLeft === 0) ? styles.verifyButtonDisabled : null
              ]} 
              onPress={handleVerify}
              disabled={isSendingOtp || otp.length < 6 || timeLeft === 0}
            >
              <Text style={styles.verifyButtonText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
