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
  ActivityIndicator,
  Image
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import Colors from "../../../../shared/constants/Colors";
import { styles } from "./WithdrawScreen.styles";
import { transactionService } from "../../../../shared/api/services/transactionService";
import { axiosClient } from "../../../../shared/api/axiosClient";
import { authService } from "../../../../shared/api/services/auth.service";
import { ENDPOINTS } from "../../../../shared/api/endpoints";
import { PinModal, OtpModal, ResetPinModal, SuccessModal } from "../../../../shared/components";
import { CategorySelectModal } from "../../../categories/components/CategorySelectModal";
import { AddCategoryModal } from "../../../categories/components/AddCategoryModal";

const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];

const COMMON_BANKS = [
  { code: '970422', name: 'MBBank', shortName: 'MB', logo: 'https://api.vietqr.io/img/MB.png' },
  { code: '970436', name: 'Vietcombank', shortName: 'VCB', logo: 'https://api.vietqr.io/img/VCB.png' },
  { code: '970407', name: 'Techcombank', shortName: 'TCB', logo: 'https://api.vietqr.io/img/TCB.png' },
  { code: '970418', name: 'BIDV', shortName: 'BIDV', logo: 'https://api.vietqr.io/img/BIDV.png' },
  { code: '970432', name: 'VPBank', shortName: 'VPB', logo: 'https://api.vietqr.io/img/VPB.png' },
  { code: '970423', name: 'TPBank', shortName: 'TPB', logo: 'https://api.vietqr.io/img/TPB.png' },
  { code: '970415', name: 'VietinBank', shortName: 'ICB', logo: 'https://api.vietqr.io/img/ICB.png' },
  { code: '970405', name: 'Agribank', shortName: 'VBA', logo: 'https://api.vietqr.io/img/VBA.png' },
  { code: '970403', name: 'Sacombank', shortName: 'STB', logo: 'https://api.vietqr.io/img/STB.png' },
  { code: '970416', name: 'ACB', shortName: 'ACB', logo: 'https://api.vietqr.io/img/ACB.png' },
  { code: '970441', name: 'VIB', shortName: 'VIB', logo: 'https://api.vietqr.io/img/VIB.png' },
  { code: '970443', name: 'SHB', shortName: 'SHB', logo: 'https://api.vietqr.io/img/SHB.png' },
];

const getBankLogo = (bankCode: string) => {
  const bank = COMMON_BANKS.find(b => b.code === bankCode);
  return bank ? bank.logo : 'https://api.vietqr.io/img/VNPAY.png';
};

export default function WithdrawScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(true);
  
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isAddCategoryModalVisible, setIsAddCategoryModalVisible] = useState(false);

  // States for PIN Modal
  const [isPinModalVisible, setIsPinModalVisible] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string>("");

  // States for Forgot PIN Flow
  const [userEmail, setUserEmail] = useState<string>("");
  const [isOtpModalVisible, setIsOtpModalVisible] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string>("");
  const [forgotPinOtp, setForgotPinOtp] = useState<string>("");
  const [isResetPinModalVisible, setIsResetPinModalVisible] = useState<boolean>(false);
  const [resetPinError, setResetPinError] = useState<string>("");

  // State for Success Modal
  const [successModalConfig, setSuccessModalConfig] = useState({
    visible: false,
    title: "",
    message: "",
    isAutoClose: false,
    onClose: () => {}
  });

  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [])
  );

  const fetchInitialData = async () => {
    setIsFetchingData(true);
    try {
      const [walletRes, bankRes, profileRes] = await Promise.all([
        axiosClient.get(ENDPOINTS.WALLET.MY_WALLET),
        axiosClient.get(ENDPOINTS.BANK_ACCOUNT.GET_ALL),
        axiosClient.get(ENDPOINTS.USER.PROFILE)
      ]);
      
      setWalletBalance(walletRes.data.balance || 0);
      setBankAccounts(bankRes.data || []);
      setUserEmail(profileRes.data?.email || "");
      
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
    
    // Hiển thị modal nhập PIN thay vì gọi API ngay
    setPinError("");
    setIsPinModalVisible(true);
  };

  const handlePinConfirm = async (pin: string) => {
    const parsedAmount = parseInt(amount, 10);
    setIsLoading(true);
    setPinError("");
    try {
      const response = await transactionService.processWithdrawal({
        amount: parsedAmount,
        bankAccountId: selectedBankId!,
        pinCode: pin,
      });

      setIsPinModalVisible(false);
      
      const selectedBank = bankAccounts.find(b => b.id === selectedBankId);
      router.push({
        pathname: "/wallet/withdraw-bill",
        params: {
          amount: parsedAmount.toString(),
          bankName: selectedBank?.bankName || "",
          accountNumber: selectedBank?.accountNumber || "",
          accountName: selectedBank?.accountName || "",
          note: note,
          category: selectedCategory ? selectedCategory.label : "Chi tiêu cá nhân",
          categoryIcon: selectedCategory ? selectedCategory.icon : "",
          categoryColor: selectedCategory ? selectedCategory.color : "",
          categoryBgColor: selectedCategory ? selectedCategory.bgColor : ""
        }
      });
    } catch (error: any) {
      if (error.message === 'Mã PIN không chính xác!') {
        setPinError(error.message);
      } else {
        setIsPinModalVisible(false);
        Alert.alert("Lỗi", error.message || "Không thể khởi tạo giao dịch rút tiền");
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
      setIsOtpModalVisible(true);
      setOtpError("");
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể gửi mã OTP khôi phục mã PIN.");
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
        purpose: "RESET_PIN"
      });
      setOtpError("");
      setForgotPinOtp(otp); // Lưu lại otp để dùng cho bước reset
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
    try {
      await authService.resetPin({
        otp: forgotPinOtp,
        newPinCode
      });
      setIsResetPinModalVisible(false);
      setSuccessModalConfig({
        visible: true,
        title: "Thành công",
        message: "Đặt lại mã PIN thành công. Vui lòng bấm Xác nhận rút tiền để tiếp tục.",
        isAutoClose: true,
        onClose: () => {
          setSuccessModalConfig(prev => ({ ...prev, visible: false }));
        }
      });
    } catch (error: any) {
      setResetPinError(error.message || "Không thể đặt lại mã PIN.");
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
            <View style={[styles.header, { flexDirection: 'column', alignItems: 'stretch', paddingBottom: 32 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <Ionicons name="arrow-back" size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rút tiền về tài khoản liên kết</Text>
              </View>

              {/* Source of Funds in Header */}
              <View style={{ 
                backgroundColor: 'rgba(255,255,255,0.15)', 
                borderRadius: 16, 
                padding: 16, 
                flexDirection: 'column' 
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 12, 
                    backgroundColor: 'rgba(255,255,255,0.2)', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginRight: 16 
                  }}>
                    <Ionicons name="wallet" size={24} color={Colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 }}>Nguồn tiền</Text>
                    <Text style={{ color: Colors.white, fontSize: 16, fontWeight: '700' }}>Ví SmartSpend</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 }}>Số dư</Text>
                    <Text style={{ color: Colors.white, fontSize: 16, fontWeight: '700' }}>{walletBalance.toLocaleString("vi-VN")} ₫</Text>
                  </View>
                </View>

                {/* Hạn mức giao dịch */}
                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: -16, marginBottom: 12 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Hạn mức giao dịch / ngày</Text>
                  <Text style={{ color: Colors.white, fontSize: 14, fontWeight: '600' }}>50.000.000 ₫</Text>
                </View>
              </View>
            </View>

            {/* Main Content */}
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              
              {/* Unified Transaction Card */}
              <View style={{
                backgroundColor: Colors.white,
                borderRadius: 24,
                padding: 20,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04,
                shadowRadius: 10,
                elevation: 2,
              }}>
                
                {/* Amount Input */}
                <View style={{ alignItems: "center", marginBottom: 24 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.textMuted, marginBottom: 12 }}>Nhập số tiền cần rút</Text>
                  <View style={styles.amountInputContainer}>
                    <TextInput
                      style={[styles.amountInput, { fontSize: 44 }]}
                      keyboardType="numeric"
                      value={formatDisplayAmount(amount)}
                      onChangeText={handleAmountChange}
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      maxLength={14}
                    />
                    <Text style={[styles.currencySymbol, { fontSize: 36 }]}>₫</Text>
                  </View>
                </View>

                {/* Quick Amounts */}
                <View style={[styles.quickAmountsContainer, { marginBottom: 0 }]}>
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
              </View>

              {/* Bank Selection */}
              <View style={styles.paymentSection}>
                <Text style={styles.sectionTitle}>Chuyển tiền đến</Text>
                {bankAccounts.length === 0 ? (
                  <TouchableOpacity style={styles.paymentMethodCard} onPress={() => router.push("/settings/bank-binding/add")}>
                    <Text style={{ color: Colors.primary }}>+ Thêm thẻ ngân hàng mới</Text>
                  </TouchableOpacity>
                ) : (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 12 }}
                  >
                    {bankAccounts.map((bank) => (
                      <TouchableOpacity 
                        key={bank.id} 
                        style={[
                          styles.paymentMethodCard,
                          { width: 280, marginBottom: 0, marginRight: 12 },
                          selectedBankId === bank.id && { borderColor: Colors.primary, borderWidth: 1 }
                        ]} 
                        onPress={() => setSelectedBankId(bank.id)}
                        activeOpacity={0.8}
                      >
                        <Image 
                          source={{ uri: getBankLogo(bank.bankCode) }} 
                          style={{ width: 44, height: 24, marginRight: 12 }}
                          resizeMode="contain"
                        />
                        <View style={styles.paymentInfo}>
                          <Text style={styles.paymentTitle}>{bank.bankName}</Text>
                          <Text style={styles.paymentSubtitle}>**** {bank.accountNumber.slice(-4)}</Text>
                        </View>
                        {selectedBankId === bank.id && (
                          <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Category Section */}
              <View style={styles.paymentSection}>
                <View style={{ marginBottom: 12 }}>
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Chọn danh mục</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.paymentMethodCard, { marginBottom: 12, width: '100%', marginRight: 0 }]} 
                  activeOpacity={0.8}
                  onPress={() => setIsCategoryModalVisible(true)}
                >
                  <View style={[styles.paymentIconBg, { backgroundColor: selectedCategory ? selectedCategory.bgColor : Colors.primary + "1A", width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 }]}>
                    <Ionicons 
                      name={selectedCategory ? selectedCategory.icon : "folder-open"} 
                      size={20} 
                      color={selectedCategory ? selectedCategory.color : Colors.primaryDark} 
                    />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTitle}>
                      {selectedCategory ? selectedCategory.label : "Chi tiêu cá nhân"}
                    </Text>
                    <Text style={styles.paymentSubtitle}>
                      {selectedCategory ? selectedCategory.groupName : "Ví SmartSpend"}
                    </Text>
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

              {/* Security Info */}
              <View style={styles.securitySection}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
                <Text style={styles.securityText}>
                  Miễn phí rút tiền về thẻ ngân hàng đã liên kết.
                </Text>
              </View>

            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

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

      <PinModal
        visible={isPinModalVisible}
        onClose={() => setIsPinModalVisible(false)}
        onConfirm={handlePinConfirm}
        onForgotPin={handleForgotPin}
        errorMessage={pinError}
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

      <SuccessModal
        visible={successModalConfig.visible}
        title={successModalConfig.title}
        message={successModalConfig.message}
        isAutoClose={successModalConfig.isAutoClose}
        onClose={successModalConfig.onClose}
      />

      <CategorySelectModal 
        visible={isCategoryModalVisible}
        onClose={() => setIsCategoryModalVisible(false)}
        onSelect={(category, groupName) => {
          setSelectedCategory({ ...category, groupName });
          setIsCategoryModalVisible(false);
        }}
        onAddCategory={() => setIsAddCategoryModalVisible(true)}
      />

      <AddCategoryModal 
        visible={isAddCategoryModalVisible}
        onClose={() => setIsAddCategoryModalVisible(false)}
        onBack={() => {
          setIsAddCategoryModalVisible(false);
          setTimeout(() => setIsCategoryModalVisible(true), 300);
        }}
      />
    </View>
  );
}
