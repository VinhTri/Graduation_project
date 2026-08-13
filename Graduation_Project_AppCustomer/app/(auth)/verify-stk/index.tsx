import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { styles } from '@/features/auth/styles/verify-stk.styles';
import { axiosClient } from '../../../shared/api/axiosClient';
import ConfirmModal from '../../../shared/components/ConfirmModal/ConfirmModal';
import SuccessModal from '../../../shared/components/SuccessModal/SuccessModal';
import Colors from '../../../shared/constants/Colors';

export default function VerifyStkScreen() {
  const router = useRouter();
  const [accountNumber, setAccountNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);

  useEffect(() => {
    fetchWalletInfo();
  }, []);

  const fetchWalletInfo = async () => {
    try {
      const res: any = await axiosClient.get('/api/v1/wallets/me');
      if (res.success && res.data) {
        setWallet(res.data);
        if (res.data.accountNumber) {
          // STK đã được thiết lập ở lần đăng nhập đầu -> không bắt xác thực lại,
          // vào thẳng app theo trạng thái mã PIN.
          await checkPinAndNavigate();
          return;
        }
        // Chưa có STK -> hiển thị màn thiết lập bên dưới.
      }
    } catch (err: any) {
      console.log('Error fetching wallet info:', err);
      Alert.alert('Lỗi', 'Không thể kết nối máy chủ để tải thông tin ví.');
    } finally {
      setLoading(false);
    }
  };

  const checkPinAndNavigate = async () => {
    try {
      const pinRes: any = await axiosClient.get('/api/v1/auth/pin-status');
      if (pinRes.data === true) {
        // Đã có mã PIN -> Đi thẳng vào trang chủ, không cần xác thực mã PIN khi đăng nhập
        router.replace('/(tabs)/home');
      } else {
        // Chưa có mã PIN -> Bắt buộc thiết lập mã PIN lần đầu để dùng khi giao dịch
        router.replace('/(auth)/setup-pin');
      }
    } catch (e) {
      router.replace('/(tabs)/home');
    }
  };

  const handleContinue = async () => {
    setError('');
    const cleanedStk = accountNumber.trim();
    if (!cleanedStk) {
      setError('Vui lòng nhập số tài khoản');
      return;
    }
    if (cleanedStk.length < 8 || cleanedStk.length > 15) {
      setError('Số tài khoản phải từ 8 đến 15 ký tự số');
      return;
    }

    setIsConfirmVisible(true);
  };

  const handleConfirmSetup = async () => {
    setIsConfirmVisible(false);
    setSubmitting(true);
    try {
      const res: any = await axiosClient.post('/api/v1/wallets/setup-account', {
        accountNumber: accountNumber.trim(),
      });
      if (res.success) {
        setIsSuccessVisible(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = async () => {
    setIsSuccessVisible(false);
    await checkPinAndNavigate();
  };

  const formatCardNumber = (num: string) => {
    if (!num) return "•••• •••• ••••";
    // Tách chuỗi số thành các cụm 4 chữ số cách nhau bởi khoảng trắng
    return num.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#109185" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.bgCircle, styles.circleTopLeft]} />
      <View style={[styles.bgCircle, styles.circleMiddleRight]} />
      <View style={styles.circleMiddleLeft} />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Phần tiêu đề và ví cố định ở phía trên */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
              <Text style={styles.title}>Cài đặt số tài khoản ví</Text>
              <Text style={styles.subtitle}>
                Tài khoản của bạn chưa được thiết lập số tài khoản ví. Vui lòng đặt số tài khoản của bạn để tiếp tục.
              </Text>

              {/* Visual Leather Wallet Card */}
              <View style={styles.walletCardContainer}>
                <View style={[styles.walletBody, { backgroundColor: '#F472B6' }]}>
                  <View style={styles.walletStitchBorder} />
                  <View style={styles.walletSlit} />
                  
                  {/* Wallet Flap */}
                  <View style={[styles.walletFlap, { backgroundColor: Colors.primary }]}>
                    <View style={styles.walletFlapStitch} />
                    <View style={styles.snapButton}>
                      <View style={styles.snapButtonInner}>
                        <View style={styles.snapDot} />
                      </View>
                    </View>
                  </View>

                  {/* Wallet Header Info */}
                  <View style={styles.headerRow}>
                    <View>
                      <Text style={styles.walletName}>{wallet?.name || "VÍ SMARTSPEND"}</Text>
                      <Text style={styles.cardNumber}>
                        {formatCardNumber(accountNumber)}
                      </Text>
                      <View style={styles.goldFoilBadge}>
                        <Text style={styles.goldFoilText}>PLATINUM MEMBER</Text>
                      </View>
                    </View>
                    <Ionicons name="wallet-outline" size={22} color="rgba(255,255,255,0.7)" />
                  </View>

                  {/* Wallet Balance Info */}
                  <View style={styles.balanceSection}>
                    <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
                    <Text style={styles.balanceValue}>
                      {wallet ? (wallet.balance.toLocaleString("vi-VN") + " ₫") : "0 ₫"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>

          {/* Form nhập liệu ở phía dưới */}
          <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, marginTop: 24 }}>
            {/* Input Form Header with Length Counter */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.inputLabel}>Số tài khoản ví</Text>
              {accountNumber.length > 0 && (
                <View style={[
                  styles.lengthBadge,
                  { backgroundColor: accountNumber.length >= 8 && accountNumber.length <= 15 ? 'rgba(16, 145, 133, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
                ]}>
                  <Text style={[
                    styles.lengthBadgeText,
                    { color: accountNumber.length >= 8 && accountNumber.length <= 15 ? Colors.primary : Colors.error }
                  ]}>
                    {accountNumber.length}/15 số
                  </Text>
                </View>
              )}
            </View>

            {/* Premium Input Container */}
            <View style={[
              styles.inputContainer,
              isFocused ? styles.inputActive : {},
              error ? styles.inputError : {}
            ]}>
              <Ionicons 
                name="wallet-outline" 
                size={20} 
                color={isFocused ? Colors.primary : '#9CA3AF'} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập 8 - 15 chữ số"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={accountNumber}
                maxLength={15}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '');
                  setAccountNumber(cleaned);
                  if (error) setError('');
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              {accountNumber.length > 0 && (
                <TouchableOpacity 
                  onPress={() => {
                    setAccountNumber('');
                    setError('');
                  }}
                  activeOpacity={0.6}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity 
              style={[styles.button, submitting || accountNumber.length < 8 ? styles.buttonDisabled : {}]}
              onPress={handleContinue}
              disabled={submitting || accountNumber.length < 8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Thiết lập tài khoản</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={isConfirmVisible}
        title="Xác nhận thiết lập"
        message={`Số tài khoản ví chỉ được thiết lập duy nhất MỘT lần và không thể thay đổi sau này.\n\nBạn có chắc chắn muốn đặt số tài khoản: ${accountNumber.trim()} không?`}
        iconName="help-circle"
        iconColor={Colors.primary}
        confirmText="Đồng ý"
        cancelText="Hủy"
        onConfirm={handleConfirmSetup}
        onCancel={() => setIsConfirmVisible(false)}
        isDestructive={false}
      />

      <SuccessModal
        visible={isSuccessVisible}
        title="Thiết lập thành công!"
        message="Số tài khoản ví của bạn đã được khởi tạo thành công."
        isAutoClose={true}
        onClose={handleSuccessClose}
      />
    </SafeAreaView>
  );
}
