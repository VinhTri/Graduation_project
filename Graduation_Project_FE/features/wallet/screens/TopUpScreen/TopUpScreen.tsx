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
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Colors from "../../../../../shared/constants/Colors";
import { styles } from "./TopUpScreen.styles";

const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];

export default function TopUpScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState<string>("");

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

  const handleConfirm = () => {
    if (!amount || parseInt(amount, 10) === 0) return;
    
    // Xử lý nạp tiền ở đây
    Alert.alert(
      "Thành công", 
      `Bạn đã yêu cầu nạp ${formatDisplayAmount(amount)} ₫ vào ví thành công!`,
      [{ text: "Đóng", onPress: () => router.back() }]
    );
  };

  const parsedAmount = amount ? parseInt(amount, 10) : 0;
  const isButtonDisabled = parsedAmount === 0;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
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
            <View style={styles.content}>
              
              {/* Amount Input */}
              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Nhập số tiền cần nạp</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>₫</Text>
                  <TextInput
                    style={styles.amountInput}
                    keyboardType="numeric"
                    value={formatDisplayAmount(amount)}
                    onChangeText={handleAmountChange}
                    placeholder="0"
                    placeholderTextColor={Colors.gray}
                    maxLength={14}
                    autoFocus
                  />
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

              {/* Payment Method */}
              <View style={styles.paymentSection}>
                <Text style={styles.sectionTitle}>Nguồn tiền</Text>
                <TouchableOpacity style={styles.paymentMethodCard} activeOpacity={0.8}>
                  <View style={styles.paymentIconBg}>
                    <Ionicons name="card" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTitle}>Thẻ ngân hàng nội địa</Text>
                    <Text style={styles.paymentSubtitle}>Miễn phí giao dịch</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
                </TouchableOpacity>
              </View>

            </View>

            {/* Footer Action */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  isButtonDisabled && styles.confirmButtonDisabled
                ]}
                disabled={isButtonDisabled}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>Xác nhận nạp tiền</Text>
              </TouchableOpacity>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
