import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette';
import PinModal from '@/shared/components/PinModal/PinModal';
import ConfirmModal from '@/shared/components/ConfirmModal/ConfirmModal';
import { OtpModal, ResetPinModal } from '@/shared/components';
import { transactionService } from '@/shared/api/services/transactionService';
import { authService } from '@/shared/api/services/auth.service';
import { getCustomerProfile } from '@/shared/services';
import { styles } from './TransferConfirmScreen.styles';

export default function TransferConfirmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const amount = parseFloat((params.amount as string) || '0');
  const accountNumber = (params.accountNumber as string) || '';
  const receiverName = (params.receiverName as string) || '';
  const note = (params.note as string) || '';
  
  const categoryId = params.categoryId ? parseInt(params.categoryId as string, 10) : undefined;
  const categoryLabel = (params.categoryLabel as string) || '';
  const categoryIconStr = params.categoryIcon as string;
  const categoryIcon = (!categoryIconStr || categoryIconStr === 'undefined') ? 'pricetag' : categoryIconStr;
  
  const categoryColorStr = params.categoryColor as string;
  const categoryColor = (!categoryColorStr || categoryColorStr === 'undefined') ? '' : categoryColorStr;
  
  const categoryBgColorStr = params.categoryBgColor as string;
  const categoryBgColor = (!categoryBgColorStr || categoryBgColorStr === 'undefined') ? '' : categoryBgColorStr;

  const formattedAmount = amount.toLocaleString('vi-VN');

  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [pinError, setPinError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [userEmail, setUserEmail] = useState("");
  const [isOtpModalVisible, setIsOtpModalVisible] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [forgotPinOtp, setForgotPinOtp] = useState("");
  const [isResetPinModalVisible, setIsResetPinModalVisible] = useState(false);
  const [resetPinError, setResetPinError] = useState("");

  useEffect(() => {
    getCustomerProfile()
      .then((profile) => setUserEmail(profile.email || ""))
      .catch(() => setUserEmail(""));
  }, []);

  const handleConfirmPin = async (pin: string) => {
    try {
      setLoading(true);
      setPinError("");

      const requestData = {
        receiverAccountNumber: accountNumber,
        amount: amount,
        pinCode: pin,
        note: note,
        categoryId: categoryId
      };

      const res = await transactionService.internalTransfer(requestData);

      setIsPinModalVisible(false);

      setTimeout(() => {
        router.push({
          pathname: '/transfer/bill',
          params: {
            amount: amount,
            transactionCode: res.transactionCode,
            accountNumber: accountNumber,
            receiverName: res.receiverName || receiverName,
            note: note,
            createdAt: res.createdAt,
            categoryLabel: categoryLabel,
            categoryIcon: categoryIcon,
            categoryColor: categoryColor,
            categoryBgColor: categoryBgColor
          }
        });
      }, 300);

    } catch (error: any) {
      console.log("Lỗi chuyển tiền:", error);
      const msg = error?.message || error?.response?.data?.message;
      if (msg && msg.toLowerCase().includes("pin")) {
        setPinError(msg);
      } else {
        setIsPinModalVisible(false);
        setTimeout(() => {
          setErrorMessage(msg || "Có lỗi xảy ra khi chuyển tiền.");
          setErrorModalVisible(true);
        }, 500);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPin = async () => {
    setIsPinModalVisible(false);
    setPinError("");
    setLoading(true);
    try {
      await authService.forgotPin();
      setIsOtpModalVisible(true);
      setOtpError("");
    } catch {
      Alert.alert("Lỗi", "Không thể gửi mã OTP khôi phục mã PIN.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyForgotPinOtp = async (otp: string) => {
    setLoading(true);
    try {
      await authService.verifyOtp({
        email: userEmail,
        otp,
        purpose: "RESET_PIN",
      });
      setOtpError("");
      setForgotPinOtp(otp);
      setIsOtpModalVisible(false);
      setTimeout(() => setIsResetPinModalVisible(true), 300);
    } catch (error: any) {
      setOtpError(error.message || "Mã OTP không chính xác");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPinConfirm = async (newPinCode: string) => {
    setLoading(true);
    try {
      await authService.resetPin({
        otp: forgotPinOtp,
        newPinCode,
      });
      setIsResetPinModalVisible(false);
      setResetPinError("");
      Alert.alert(
        "Thành công",
        "Đặt lại mã PIN thành công. Vui lòng bấm Xác nhận chuyển tiền để tiếp tục.",
      );
    } catch (error: any) {
      setResetPinError(error.message || "Không thể đặt lại mã PIN");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={[PASTEL_PALETTE.headerStart, PASTEL_PALETTE.headerMid, PASTEL_PALETTE.headerEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top }]}
        >
          <View style={[styles.headerTopRow, { marginTop: 12 }]}>
            <View style={styles.leftSection}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back-outline" size={24} color={PASTEL_PALETTE.subtitle} />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>Xác nhận giao dịch</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Số tiền chuyển</Text>
            <Text style={styles.amountValue}>
              {formattedAmount} <Text style={styles.currency}>₫</Text>
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Người nhận</Text>
            <Text style={styles.detailValue}>{receiverName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Số tài khoản</Text>
            <Text style={styles.detailValue}>{accountNumber}</Text>
          </View>

          {!!note && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Lời nhắn</Text>
              <Text style={styles.detailValue} numberOfLines={3}>{note}</Text>
            </View>
          )}

          {!!categoryId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Danh mục</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: categoryBgColor || PASTEL_PALETTE.lavenderSoft, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                  <Ionicons name={categoryIcon as any} size={16} color={categoryColor || PASTEL_PALETTE.accentDeep} />
                </View>
                <Text style={[styles.detailValue, { flex: 0, textAlign: 'left' }]} numberOfLines={1}>{categoryLabel}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phí giao dịch</Text>
            <Text style={[styles.detailValue, { color: PASTEL_PALETTE.success }]}>Miễn phí</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24), flexDirection: 'row', gap: 12 }]}>
        <TouchableOpacity 
          style={[styles.confirmButton, { flex: 1, backgroundColor: PASTEL_PALETTE.background, borderWidth: 1, borderColor: PASTEL_PALETTE.border, shadowOpacity: 0 }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.confirmButtonText, { color: PASTEL_PALETTE.title }]}>Quay lại</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.confirmButton, { flex: 2 }]}
          onPress={() => setIsPinModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmButtonText}>Xác nhận chuyển tiền</Text>
        </TouchableOpacity>
      </View>

      <PinModal
        visible={isPinModalVisible}
        onClose={() => {
          setIsPinModalVisible(false);
          setPinError("");
        }}
        onConfirm={handleConfirmPin}
        onForgotPin={handleForgotPin}
        errorMessage={pinError}
        title="Xác thực giao dịch"
        subtitle="Vui lòng nhập mã PIN bảo mật để hoàn tất chuyển tiền."
      />

      <ConfirmModal
        visible={errorModalVisible}
        title="Lỗi"
        message={errorMessage}
        iconName="alert-circle"
        iconColor="#EF4444"
        confirmText="Đã hiểu"
        isDestructive={false}
        hideCancel={true}
        confirmButtonColor={PASTEL_PALETTE.accentDeep}
        onConfirm={() => setErrorModalVisible(false)}
        onCancel={() => setErrorModalVisible(false)}
      />

      <OtpModal
        visible={isOtpModalVisible}
        email={userEmail}
        errorMessage={otpError}
        onClose={() => setIsOtpModalVisible(false)}
        onVerify={handleVerifyForgotPinOtp}
      />

      <ResetPinModal
        visible={isResetPinModalVisible}
        onClose={() => setIsResetPinModalVisible(false)}
        onConfirm={handleResetPinConfirm}
        errorMessage={resetPinError}
      />
    </View>
  );
}
