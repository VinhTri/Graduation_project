import React, { useState, useEffect } from "react";
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
import { useRouter } from "expo-router";
import Colors from "../../../../shared/constants/Colors";
import { styles } from "./WalletSettingsScreen.styles";
import { walletService } from "../../../../shared/api/services/walletService";
import { SuccessModal, ConfirmModal } from "../../../../shared/components";

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

  useEffect(() => {
    fetchWalletDetails();
  }, [walletId]);

  const fetchWalletDetails = async () => {
    try {
      setIsFetching(true);
      // Currently, getMyWallet returns the default wallet. We should probably fetch the specific wallet,
      // but if the API only supports 'me' right now, we use that as fallback.
      // Ideally backend would have /api/v1/wallets/{id}
      const wallet = await walletService.getMyWallet();
      setIsLimitEnabled(wallet.isLimitEnabled || false);
      if (wallet.transactionLimit) {
        setTransactionLimit(wallet.transactionLimit.toString());
      }
      if (wallet.dailyLimit) {
        setDailyLimit(wallet.dailyLimit.toString());
      }
      setDailyTransactedAmount(wallet.dailyTransactedAmount || 0);
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

  const handleSave = async () => {
    if (!walletId) return;

    // Validation
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

    setIsLoading(true);

    try {
      await walletService.updateWalletSettings(walletId, {
        isLimitEnabled: isLimitEnabled,
        transactionLimit: transactionLimit ? parseInt(transactionLimit, 10) : undefined,
        dailyLimit: dailyLimit ? parseInt(dailyLimit, 10) : undefined
      });

      setSuccessModalConfig({
        visible: true,
        title: "Thành công",
        message: "Đã lưu cài đặt hạn mức thành công.",
      });
    } catch (error: any) {
      setErrorModalConfig({
        visible: true,
        title: "Lỗi",
        message: error.message || "Không thể lưu cài đặt hạn mức"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasUnsavedChanges = isLimitEnabled && (!transactionLimit && !dailyLimit);

  if (isFetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.textMuted }}>Đang tải cấu hình ví...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={{ backgroundColor: Colors.primary, height: insets.top, position: 'absolute', top: 0, left: 0, right: 0 }} />
      <KeyboardAvoidingView
        style={{ flex: 1, paddingTop: insets.top }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Cài đặt ví</Text>
            </View>

            {/* Main Content */}
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
                      onValueChange={setIsLimitEnabled}
                      trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                      thumbColor={isLimitEnabled ? Colors.primary : Colors.white}
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
                          placeholderTextColor={Colors.textMuted}
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
                          placeholderTextColor={Colors.textMuted}
                          maxLength={14}
                        />
                      </View>

                      <View style={styles.divider} />

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, color: Colors.textMuted, marginBottom: 4 }}>Đã giao dịch trong ngày</Text>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text }}>{dailyTransactedAmount.toLocaleString("vi-VN")} ₫</Text>
                        </View>
                        
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 13, color: Colors.textMuted, marginBottom: 4 }}>Hạn mức còn lại</Text>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text }}>
                            {dailyLimit ? Math.max(0, parseInt(dailyLimit, 10) - dailyTransactedAmount).toLocaleString("vi-VN") : "0"} ₫
                          </Text>
                        </View>
                      </View>
                      
                      {/* Progress Bar */}
                      {(() => {
                        const dailyLimitNum = dailyLimit ? parseInt(dailyLimit, 10) : 0;
                        let progressPercentage = 0;
                        if (dailyLimitNum > 0) {
                          progressPercentage = (dailyTransactedAmount / dailyLimitNum) * 100;
                          if (progressPercentage > 100) progressPercentage = 100;
                        }
                        return (
                          <View style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, marginTop: 16, marginBottom: 8, overflow: 'hidden' }}>
                            <View style={{ height: '100%', backgroundColor: progressPercentage >= 100 ? Colors.error : Colors.primary, width: `${progressPercentage}%`, borderRadius: 3 }} />
                          </View>
                        );
                      })()}
                    </View>
                  )}
                </View>
              </View>

              {/* Info Section */}
              <View style={styles.infoSection}>
                <Ionicons name="information-circle" size={24} color={Colors.primaryDark} />
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
                  (hasUnsavedChanges || isLoading) && styles.saveButtonDisabled
                ]}
                disabled={hasUnsavedChanges || isLoading}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>
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
        onClose={() => {
          setSuccessModalConfig(prev => ({ ...prev, visible: false }));
          router.back();
        }}
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
    </View>
  );
}
