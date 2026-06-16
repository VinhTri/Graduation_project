import React, { useState, useCallback } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import Colors from "../../../../shared/constants/Colors";
import { styles } from "./WithdrawScreen.styles";
import { transactionService } from "../../../../shared/api/services/transactionService";
import { axiosClient } from "../../../../shared/api/axiosClient";
import { ENDPOINTS } from "../../../../shared/api/endpoints";

const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];

export default function WithdrawScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(true);
  
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [])
  );

  const fetchInitialData = async () => {
    setIsFetchingData(true);
    try {
      const [walletRes, bankRes] = await Promise.all([
        axiosClient.get(ENDPOINTS.WALLET.MY_WALLET),
        axiosClient.get(ENDPOINTS.BANK_ACCOUNT.GET_ALL)
      ]);
      
      setWalletBalance(walletRes.data.balance || 0);
      setBankAccounts(bankRes.data || []);
      
      if (bankRes.data && bankRes.data.length > 0) {
        setSelectedBankId(bankRes.data[0].id);
      }
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể lấy thông tin ví và thẻ ngân hàng");
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    setAmount(numericValue);
  };

  const formatDisplayAmount = (val: string) => {
    if (!val) return "";
    return parseInt(val, 10).toLocaleString("vi-VN");
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleConfirm = async () => {
    const parsedAmount = parseInt(amount, 10);
    if (!parsedAmount || parsedAmount < 1000) {
      Alert.alert("Lỗi", "Số tiền rút tối thiểu là 1,000đ");
      return;
    }
    if (parsedAmount > walletBalance) {
      Alert.alert("Lỗi", "Số dư trong ví không đủ để rút số tiền này");
      return;
    }
    if (!selectedBankId) {
      Alert.alert("Lỗi", "Vui lòng chọn thẻ ngân hàng để nhận tiền");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await transactionService.processWithdrawal({
        amount: parsedAmount,
        bankAccountId: selectedBankId,
      });

      Alert.alert("Thành công", "Rút tiền thành công! Tiền sẽ được chuyển vào tài khoản của bạn.", [
        { text: "OK", onPress: () => router.push("/wallet") }
      ]);
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể khởi tạo giao dịch rút tiền");
    } finally {
      setIsLoading(false);
    }
  };

  const parsedAmount = amount ? parseInt(amount, 10) : 0;
  const isButtonDisabled = parsedAmount === 0 || !selectedBankId;

  if (isFetchingData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
              <Text style={styles.headerTitle}>Rút tiền về thẻ</Text>
            </View>

            {/* Main Content */}
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              
              {/* Balance Info */}
              <View style={[styles.paymentSection, { marginBottom: 16 }]}>
                <Text style={styles.sectionTitle}>Số dư khả dụng</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <Ionicons name="wallet-outline" size={24} color={Colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.text }}>
                    {walletBalance.toLocaleString("vi-VN")} ₫
                  </Text>
                </View>
              </View>

              {/* Amount Input */}
              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Nhập số tiền cần rút</Text>
                <View style={styles.amountInputContainer}>
                  <TextInput
                    style={styles.amountInput}
                    keyboardType="numeric"
                    value={formatDisplayAmount(amount)}
                    onChangeText={handleAmountChange}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    maxLength={14}
                    autoFocus
                  />
                  <Text style={[styles.currencySymbol, { marginLeft: 8, marginRight: 0 }]}>₫</Text>
                </View>
              </View>

              {/* Quick Amounts */}
              <View style={styles.quickAmountsContainer}>
                {QUICK_AMOUNTS.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[
                      styles.quickAmountChip,
                      parsedAmount === amt && styles.quickAmountChipSelected,
                      amt > walletBalance && { opacity: 0.5 }
                    ]}
                    onPress={() => handleQuickAmount(amt)}
                    disabled={amt > walletBalance}
                    activeOpacity={0.7}
                  >
                    <Text 
                      style={[
                        styles.quickAmountText,
                        parsedAmount === amt && styles.quickAmountTextSelected
                      ]}
                    >
                      {amt.toLocaleString("vi-VN")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Bank Selection */}
              <View style={styles.paymentSection}>
                <Text style={styles.sectionTitle}>Chuyển tiền đến</Text>
                {bankAccounts.length === 0 ? (
                  <TouchableOpacity style={styles.paymentMethodCard} onPress={() => router.push("/settings/bank-binding/add")}>
                    <Text style={{ color: Colors.primary }}>+ Thêm thẻ ngân hàng mới</Text>
                  </TouchableOpacity>
                ) : (
                  bankAccounts.map((bank) => (
                    <TouchableOpacity 
                      key={bank.id} 
                      style={[
                        styles.paymentMethodCard,
                        selectedBankId === bank.id && { borderColor: Colors.primary, borderWidth: 1 }
                      ]} 
                      onPress={() => setSelectedBankId(bank.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.paymentIconBg, { backgroundColor: Colors.primary + "1A" }]}>
                        <Ionicons name="card" size={20} color={Colors.primaryDark} />
                      </View>
                      <View style={styles.paymentInfo}>
                        <Text style={styles.paymentTitle}>{bank.bankName}</Text>
                        <Text style={styles.paymentSubtitle}>**** {bank.accountNumber.slice(-4)}</Text>
                      </View>
                      {selectedBankId === bank.id && (
                        <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </View>

              {/* Security Info */}
              <View style={styles.securitySection}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
                <Text style={styles.securityText}>
                  Miễn phí rút tiền về thẻ ngân hàng đã liên kết.
                </Text>
              </View>

            </ScrollView>

            {/* Footer Action */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (isButtonDisabled || isLoading) && styles.confirmButtonDisabled
                ]}
                disabled={isButtonDisabled || isLoading}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>
                  {isLoading ? "Đang xử lý..." : "Xác nhận rút tiền"}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}
