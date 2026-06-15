import React, { useState } from "react";
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
  ScrollView
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Colors from "../../../../shared/constants/Colors";
import { styles } from "./TopUpScreen.styles";
import { transactionService } from "../../../../shared/api/services/transactionService";

const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];

export default function TopUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAmountChange = (text: string) => {
    // Remove non-numeric characters
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
    if (!amount || parseInt(amount, 10) === 0) return;
    
    setIsLoading(true);
    try {
      const response = await transactionService.initiateTopUp({
        amount: parseInt(amount, 10),
        note: note || undefined,
      });

      router.push({
        pathname: "/wallet/checkout",
        params: { 
          amount: response.amount.toString(), 
          note: note,
          transactionCode: response.transactionCode,
          qrUrl: response.qrUrl,
          expiresAt: response.expiresAt,
          createdAt: response.createdAt
        }
      });
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể khởi tạo giao dịch");
    } finally {
      setIsLoading(false);
    }
  };

  const parsedAmount = amount ? parseInt(amount, 10) : 0;
  const isButtonDisabled = parsedAmount === 0;

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
              <Text style={styles.headerTitle}>Nạp tiền vào ví</Text>
            </View>

            {/* Main Content */}
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              
              {/* Amount Input */}
              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Nhập số tiền cần nạp</Text>
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
                      parsedAmount === amt && styles.quickAmountChipSelected
                    ]}
                    onPress={() => handleQuickAmount(amt)}
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

              {/* Category Section */}
              <View style={styles.paymentSection}>
                <Text style={styles.sectionTitle}>Chọn danh mục</Text>
                <TouchableOpacity style={styles.paymentMethodCard} activeOpacity={0.8}>
                  <View style={[styles.paymentIconBg, { backgroundColor: Colors.primary + "1A" }]}>
                    <Ionicons name="folder-open" size={20} color={Colors.primaryDark} />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTitle}>Chi tiêu cá nhân</Text>
                    <Text style={styles.paymentSubtitle}>Ví SmartSpend</Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Note Section */}
              <View style={styles.noteSection}>
                <Text style={styles.sectionTitle}>Ghi chú</Text>
                <View style={styles.noteInputContainer}>
                  <Ionicons name="pencil" size={20} color={Colors.textMuted} style={{ marginTop: 2 }} />
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Nhập ghi chú cho giao dịch này..."
                    placeholderTextColor={Colors.textMuted}
                    value={note}
                    onChangeText={setNote}
                    multiline
                    maxLength={100}
                  />
                </View>
              </View>

              {/* Security / Fee Info */}
              <View style={styles.securitySection}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
                <Text style={styles.securityText}>
                  Mọi giao dịch đều được mã hóa và bảo vệ an toàn tuyệt đối bởi SmartSpend Pay.
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
                  {isLoading ? "Đang xử lý..." : "Xác nhận nạp tiền"}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}
