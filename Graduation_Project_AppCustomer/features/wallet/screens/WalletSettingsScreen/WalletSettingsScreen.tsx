import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import Colors from "../../../../shared/constants/Colors";
import { PASTEL_PALETTE } from "../../../../shared/constants/PastelPalette";
import { PastelHeaderShell } from "../../../../shared/components/PastelHeaderShell";
import { styles } from "./WalletSettingsScreen.styles";
import { walletService } from "../../../../shared/api/services/walletService";
import { authService } from "../../../../shared/api/services/auth.service";
import { axiosClient } from "../../../../shared/api/axiosClient";
import { ENDPOINTS } from "../../../../shared/api/endpoints";
import { SuccessModal, ConfirmModal, PinModal, OtpModal, ResetPinModal } from "../../../../shared/components";

interface WalletSettingsScreenProps {
  walletId: number;
}

export default function WalletSettingsScreen({ walletId }: WalletSettingsScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State for limits
  const [isLimitEnabled, setIsLimitEnabled] = useState(false);
  const [transactionLimit, setTransactionLimit] = useState("");
  const [dailyLimit, setDailyLimit] = useState("");
  const [dailyTransactedAmount, setDailyTransactedAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [pinError, setPinError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isOtpModalVisible, setIsOtpModalVisible] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [forgotPinOtp, setForgotPinOtp] = useState("");
  const [isResetPinModalVisible, setIsResetPinModalVisible] = useState(false);
  const [resetPinError, setResetPinError] = useState("");
  const [successAfterAction, setSuccessAfterAction] = useState<"save_limits" | "reset_pin" | null>(null);
  const [resolvedWalletId, setResolvedWalletId] = useState<number | null>(null);
  const [savedSettings, setSavedSettings] = useState({
    isLimitEnabled: false,
    transactionLimit: "",
    dailyLimit: "",
  });
  const [pinAction, setPinAction] = useState<"save" | "disable">("save");

  // States for Modals
  const [successModalConfig, setSuccessModalConfig] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const [errorModalConfig, setErrorModalConfig] = useState({
    visible: false,
    title: "",
    message: "",
  });

  useFocusEffect(
    useCallback(() => {
      fetchWalletDetails();
    }, [walletId])
  );

  const fetchWalletDetails = async () => {
    try {
      setIsFetching(true);
      const [wallet, profileRes] = await Promise.all([
        walletService.getMyWallet(),
        axiosClient.get(ENDPOINTS.USER.PROFILE),
      ]);
      setResolvedWalletId(wallet.id);
      const nextIsLimitEnabled = wallet.isLimitEnabled || false;
      const nextTransactionLimit = wallet.transactionLimit ? wallet.transactionLimit.toString() : "";
      const nextDailyLimit = wallet.dailyLimit ? wallet.dailyLimit.toString() : "";
      setIsLimitEnabled(nextIsLimitEnabled);
      setTransactionLimit(nextTransactionLimit);
      setDailyLimit(nextDailyLimit);
      setSavedSettings({
        isLimitEnabled: nextIsLimitEnabled,
        transactionLimit: nextTransactionLimit,
        dailyLimit: nextDailyLimit,
      });
      setDailyTransactedAmount(wallet.dailyTransactedAmount || 0);
      setUserEmail(profileRes.data?.email || "");
    } catch (error) {
      console.log("Failed to fetch wallet details", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleAmountChange = (text: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    setter(numericValue);
  };

  const formatDisplayAmount = (val: string) => {
    if (!val) return "";
    return parseInt(val, 10).toLocaleString("vi-VN");
  };

  const handleLimitToggle = (nextValue: boolean) => {
    if (!nextValue && isLimitEnabled) {
      setPinAction("disable");
      setPinError("");
      setIsPinModalVisible(true);
      return;
    }
    setIsLimitEnabled(nextValue);
  };

  const handleSave = () => {
    const targetWalletId = resolvedWalletId ?? walletId;
    if (!targetWalletId || Number.isNaN(targetWalletId)) {
      setErrorModalConfig({
        visible: true,
        title: "Lỗi",
        message: "Không xác định được ví cần cập nhật. Vui lòng thử lại.",
      });
      return;
    }

    if (isLimitEnabled) {
      const transLimitNum = transactionLimit ? parseInt(transactionLimit, 10) : 0;
      const dailyLimitNum = dailyLimit ? parseInt(dailyLimit, 10) : 0;

      if (transLimitNum > dailyLimitNum && dailyLimitNum > 0) {
        setErrorModalConfig({
          visible: true,
          title: "Lỗi hợp lệ",
          message: "Hạn mức giao dịch không được lớn hơn hạn mức ngày."
        });
        return;
      }
    }

    setPinAction("save");
    setPinError("");
    setIsPinModalVisible(true);
  };

  const buildSettingsPayload = (pin: string, limitEnabled: boolean) => ({
    isLimitEnabled: limitEnabled,
    transactionLimit: limitEnabled && transactionLimit ? parseInt(transactionLimit, 10) : undefined,
    dailyLimit: limitEnabled && dailyLimit ? parseInt(dailyLimit, 10) : undefined,
    pinCode: pin,
  });

  const handlePinConfirm = async (pin: string) => {
    const targetWalletId = resolvedWalletId ?? walletId;
    if (!targetWalletId || Number.isNaN(targetWalletId)) return;
    setIsLoading(true);
    setPinError("");

    try {
      const limitEnabled = pinAction === "disable" ? false : isLimitEnabled;
      await walletService.updateWalletSettings(
        targetWalletId,
        buildSettingsPayload(pin, limitEnabled)
      );

      setIsLimitEnabled(limitEnabled);
      setSavedSettings({
        isLimitEnabled: limitEnabled,
        transactionLimit,
        dailyLimit,
      });
      setPinAction("save");
      setIsPinModalVisible(false);
      setSuccessAfterAction("save_limits");
      setSuccessModalConfig({
        visible: true,
        title: "Thành công",
        message: limitEnabled
          ? "Đã lưu cài đặt hạn mức thành công."
          : "Đã tắt thiết lập hạn mức giao dịch thành công.",
      });
    } catch (error: any) {
      const msg = error?.message || "Không thể lưu cài đặt hạn mức";
      if (msg.toLowerCase().includes("pin")) {
        setPinError(msg);
      } else {
        setIsPinModalVisible(false);
        setErrorModalConfig({
          visible: true,
          title: "Lỗi",
          message: msg,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPin = async () => {
    setIsPinModalVisible(false);
    setIsLoading(true);
    try {
      await authService.forgotPin();
      setOtpError("");
      setIsOtpModalVisible(true);
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể gửi mã OTP khôi phục mã PIN.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyForgotPinOtp = async (otp: string) => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleResetPinConfirm = async (newPinCode: string) => {
    setIsLoading(true);
    setResetPinError("");
    try {
      await authService.resetPin({
        otp: forgotPinOtp,
        newPinCode,
      });
      setIsResetPinModalVisible(false);
      setForgotPinOtp("");
      setSuccessAfterAction("reset_pin");
      setSuccessModalConfig({
        visible: true,
        title: "Thành công",
        message: "Đặt lại mã PIN thành công. Vui lòng nhập mã PIN mới để lưu cài đặt hạn mức.",
      });
    } catch (error: any) {
      setResetPinError(error.message || "Không thể đặt lại mã PIN.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalConfig((prev) => ({ ...prev, visible: false }));

    if (successAfterAction === "reset_pin") {
      setSuccessAfterAction(null);
      setPinError("");
      setIsPinModalVisible(true);
      return;
    }

    setSuccessAfterAction(null);
    router.back();
  };

  const hasChanges =
    isLimitEnabled !== savedSettings.isLimitEnabled ||
    transactionLimit !== savedSettings.transactionLimit ||
    dailyLimit !== savedSettings.dailyLimit;
  const hasInvalidEnabledForm = isLimitEnabled && !transactionLimit && !dailyLimit;
  const isSaveDisabled = !hasChanges || hasInvalidEnabledForm || isLoading;
  const pinModalTitle = pinAction === "disable" ? "Xác nhận tắt hạn mức" : "Xác nhận thiết lập hạn mức";
  const pinModalSubtitle =
    pinAction === "disable"
      ? "Vui lòng nhập mã PIN để tắt thiết lập hạn mức giao dịch cho ví của bạn."
      : "Vui lòng nhập mã PIN để lưu cài đặt hạn mức giao dịch cho ví của bạn.";

  if (isFetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: PASTEL_PALETTE.textMuted }}>Đang tải cấu hình ví...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>

            <PastelHeaderShell contentStyle={styles.header}>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back-outline" size={22} color={PASTEL_PALETTE.subtitle} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                  Cài đặt ví
                </Text>
              </View>
            </PastelHeaderShell>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quản lý hạn mức</Text>

                <View style={styles.card}>
                  <View style={styles.row}>
                    <View style={styles.rowLabelContainer}>
                      <Text style={styles.rowTitle}>Thiết lập hạn mức giao dịch</Text>
                      <Text style={styles.rowSubtitle}>
                        Giới hạn số tiền tối đa cho mỗi giao dịch và tổng giao dịch trong ngày
                      </Text>
                    </View>
                    <Switch
                      value={isLimitEnabled}
                      onValueChange={handleLimitToggle}
                      trackColor={{ false: PASTEL_PALETTE.border, true: PASTEL_PALETTE.accentSoft }}
                      thumbColor={isLimitEnabled ? PASTEL_PALETTE.accentDeep : PASTEL_PALETTE.white}
                      ios_backgroundColor={PASTEL_PALETTE.border}
                    />
                  </View>

                  {isLimitEnabled && (
                    <View>
                      <View style={styles.divider} />

                      <Text style={styles.rowTitle}>Tối đa mỗi lần giao dịch</Text>
                      <View style={styles.inputContainer}>
                        <Text style={styles.currencySymbol}>₫</Text>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          value={formatDisplayAmount(transactionLimit)}
                          onChangeText={(text) => handleAmountChange(text, setTransactionLimit)}
                          placeholder="VD: 5,000,000"
                          placeholderTextColor={PASTEL_PALETTE.textMuted}
                          maxLength={14}
                        />
                      </View>

                      <View style={{ height: 16 }} />

                      <Text style={styles.rowTitle}>Tối đa tổng cả ngày</Text>
                      <View style={styles.inputContainer}>
                        <Text style={styles.currencySymbol}>₫</Text>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          value={formatDisplayAmount(dailyLimit)}
                          onChangeText={(text) => handleAmountChange(text, setDailyLimit)}
                          placeholder="VD: 20,000,000"
                          placeholderTextColor={PASTEL_PALETTE.textMuted}
                          maxLength={14}
                        />
                      </View>

                      <View style={styles.divider} />

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.statLabel}>Đã giao dịch trong ngày</Text>
                          <Text style={styles.statValue}>{dailyTransactedAmount.toLocaleString("vi-VN")} ₫</Text>
                        </View>
                        
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                          <Text style={styles.statLabel}>Hạn mức còn lại</Text>
                          <Text style={styles.statValue}>
                            {dailyLimit ? Math.max(0, parseInt(dailyLimit, 10) - dailyTransactedAmount).toLocaleString("vi-VN") : "0"} ₫
                          </Text>
                        </View>
                      </View>
                      
                      {(() => {
                        const dailyLimitNum = dailyLimit ? parseInt(dailyLimit, 10) : 0;
                        let progressPercentage = 0;
                        if (dailyLimitNum > 0) {
                          progressPercentage = (dailyTransactedAmount / dailyLimitNum) * 100;
                          if (progressPercentage > 100) progressPercentage = 100;
                        }
                        return (
                          <View style={styles.progressTrack}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  backgroundColor: progressPercentage >= 100 ? Colors.error : PASTEL_PALETTE.accentDeep,
                                  width: `${progressPercentage}%`,
                                },
                              ]}
                            />
                          </View>
                        );
                      })()}
                    </View>
                  )}
                </View>
              </View>

              {/* Info Section */}
              <View style={styles.infoSection}>
                <Ionicons name="information-circle" size={24} color={PASTEL_PALETTE.accentDeep} />
                <Text style={styles.infoText}>
                  Tính năng thiết lập hạn mức giúp bạn kiểm soát chi tiêu tốt hơn.
                </Text>
              </View>

            </ScrollView>

            {/* Footer Action */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSaveDisabled && styles.saveButtonDisabled
                ]}
                disabled={isSaveDisabled}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={[styles.saveButtonText, isSaveDisabled && styles.saveButtonTextDisabled]}>
                  {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={successModalConfig.visible}
        title={successModalConfig.title}
        message={successModalConfig.message}
        variant="pastel"
        onClose={handleSuccessClose}
      />

      <ConfirmModal
        visible={errorModalConfig.visible}
        title={errorModalConfig.title}
        message={errorModalConfig.message}
        iconName="alert-circle"
        confirmText="Đóng"
        hideCancel={true}
        onConfirm={() => setErrorModalConfig(prev => ({ ...prev, visible: false }))}
        onCancel={() => setErrorModalConfig(prev => ({ ...prev, visible: false }))}
      />

      <PinModal
        visible={isPinModalVisible}
        onClose={() => {
          if (!isLoading) {
            setIsPinModalVisible(false);
            setPinAction("save");
          }
        }}
        onConfirm={handlePinConfirm}
        onForgotPin={handleForgotPin}
        errorMessage={pinError}
        title={pinModalTitle}
        subtitle={pinModalSubtitle}
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
