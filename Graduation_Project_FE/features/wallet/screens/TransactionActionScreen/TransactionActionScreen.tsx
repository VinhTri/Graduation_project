import React, { useState, useCallback, useEffect } from "react";
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
  Image,
  LayoutAnimation,
  UIManager
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import Colors from "../../../../shared/constants/Colors";
import { styles } from "./TransactionActionScreen.styles";
import { transactionService } from "../../../../shared/api/services/transactionService";
import { axiosClient } from "../../../../shared/api/axiosClient";
import { authService } from "../../../../shared/api/services/auth.service";
import { ENDPOINTS } from "../../../../shared/api/endpoints";
import { PinModal, OtpModal, ResetPinModal, SuccessModal } from "../../../../shared/components";
import { CategorySelectModal } from "../../../categories/components/CategorySelectModal";

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const SUGGESTED_AMOUNTS = [50000, 100000, 200000, 500000];

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

export default function TransactionActionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const [activeTab, setActiveTab] = useState<'topup' | 'withdraw'>(params.initialTab === 'withdraw' ? 'withdraw' : 'topup');
  
  const handleTabChange = (tab: 'topup' | 'withdraw') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
    setAmount("");
  };
  
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(true);
  
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);

  // States for Withdraw Modals
  const [isPinModalVisible, setIsPinModalVisible] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [isOtpModalVisible, setIsOtpModalVisible] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string>("");
  const [forgotPinOtp, setForgotPinOtp] = useState<string>("");
  const [isResetPinModalVisible, setIsResetPinModalVisible] = useState<boolean>(false);
  const [resetPinError, setResetPinError] = useState<string>("");
  const [successModalConfig, setSuccessModalConfig] = useState({
    visible: false, title: "", message: "", isAutoClose: false, onClose: () => {}
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
      console.log(error);
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

  const handleTopUpConfirm = async () => {
    const parsedAmount = parseInt(amount, 10);
    if (!parsedAmount || parsedAmount === 0) return;
    
    setIsLoading(true);
    try {
      const response = await transactionService.initiateTopUp({
        amount: parsedAmount,
      });

      router.push({
        pathname: "/wallet/checkout",
        params: { 
          amount: response.amount.toString(), 
          note: "",
          category: "Nạp tiền vào ví",
          categoryIcon: "wallet",
          categoryColor: "#10B981",
          categoryBgColor: "#D1FAE5",
          transactionCode: response.transactionCode,
          qrUrl: response.qrUrl,
          expiresAt: response.expiresAt,
          createdAt: response.createdAt
        }
      });
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể khởi tạo giao dịch nạp tiền");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawConfirm = async () => {
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
    setPinError("");
    setIsPinModalVisible(true);
  };

  const handlePinConfirm = async (pin: string) => {
    const parsedAmount = parseInt(amount, 10);
    setIsLoading(true);
    setPinError("");
    try {
      await transactionService.processWithdrawal({
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
          note: "Rút tiền về ngân hàng liên kết",
          category: "Chi tiêu cá nhân"
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

  // Withdraw Modals Handlers
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
      await authService.verifyOtp({ email: userEmail, otp, purpose: "RESET_PIN" });
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
    try {
      await authService.resetPin({ otp: forgotPinOtp, newPinCode });
      setIsResetPinModalVisible(false);
      setSuccessModalConfig({
        visible: true,
        title: "Thành công",
        message: "Đặt lại mã PIN thành công. Vui lòng bấm Xác nhận để tiếp tục.",
        isAutoClose: true,
        onClose: () => setSuccessModalConfig(prev => ({ ...prev, visible: false }))
      });
    } catch (error: any) {
      setResetPinError(error.message || "Không thể đặt lại mã PIN.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderTopUpForm = () => (
    <View style={styles.formContent}>
      <View style={styles.walletGroupContainer}>
        <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginTop: 0 }]}>Nạp tiền vào</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletCardContent}>
          <View style={[styles.walletCard, styles.walletCardActive]}>
            <View style={[styles.walletIconContainer, { backgroundColor: Colors.primary }]}>
              <Ionicons name="wallet" size={24} color={Colors.white} />
            </View>
            <View style={styles.walletInfo}>
              <Text style={styles.walletName}>Ví SmartSpend</Text>
              <Text style={styles.walletBalance}>{walletBalance.toLocaleString("vi-VN")} ₫</Text>
            </View>
          </View>

          <View style={styles.walletCard}>
            <View style={[styles.walletIconContainer, { backgroundColor: "#F3F4F6" }]}>
              <Ionicons name="leaf" size={24} color="#9CA3AF" />
            </View>
            <View style={styles.walletInfo}>
              <Text style={styles.walletName}>Ví Tiết kiệm</Text>
              <Text style={styles.walletBalance}>Chưa liên kết</Text>
            </View>
          </View>

          <View style={styles.walletCard}>
            <View style={[styles.walletIconContainer, { backgroundColor: "#F3F4F6" }]}>
              <Ionicons name="cube" size={24} color="#9CA3AF" />
            </View>
            <View style={styles.walletInfo}>
              <Text style={styles.walletName}>Quỹ</Text>
              <Text style={styles.walletBalance}>Chưa liên kết</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Số tiền cần nạp</Text>
        <View style={styles.amountInputRow}>
          <TextInput
            style={styles.amountInput}
            keyboardType="numeric"
            value={formatDisplayAmount(amount)}
            onChangeText={handleAmountChange}
            placeholder="0"
            placeholderTextColor="#D1D5DB"
            maxLength={14}
          />
          <Text style={styles.currencySymbol}>₫</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={styles.suggestionContainer}>
        {SUGGESTED_AMOUNTS.map((amt) => (
          <TouchableOpacity 
            key={amt} 
            style={styles.suggestionChip}
            onPress={() => setAmount(amt.toString())}
          >
            <Text style={styles.suggestionText}>{amt.toLocaleString("vi-VN")} ₫</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.bannerContainer}>
        <Image source={{uri: "https://cdn-icons-png.flaticon.com/512/3135/3135673.png"}} style={{width: 40, height: 40, marginRight: 12}} />
        <Text style={styles.bannerText}>Tối ưu tiền chi tiêu bằng cách nạp tiền vào Ví, an toàn và bảo mật.</Text>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Chọn cách nạp tiền</Text>
      <View style={styles.sourceContainer}>
        <TouchableOpacity style={[styles.sourceOption, styles.sourceOptionActive]}>
          <View style={[styles.sourceIconContainer, { backgroundColor: "#DBEAFE" }]}>
            <Ionicons name="qr-code" size={24} color="#3B82F6" />
          </View>
          <View style={styles.sourceInfo}>
            <Text style={styles.sourceTitle}>Chuyển khoản bằng VietQR</Text>
            <Text style={styles.sourceSubtitle}>Không giới hạn số tiền nạp</Text>
          </View>
          <View style={[styles.radioOuter, styles.radioOuterActive]}>
            <View style={styles.radioInner} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWithdrawForm = () => (
    <View style={styles.formContent}>
      <View style={styles.walletGroupContainer}>
        <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginTop: 0 }]}>Rút tiền từ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletCardContent}>
          <View style={[styles.walletCard, styles.walletCardActive]}>
            <View style={[styles.walletIconContainer, { backgroundColor: Colors.primary }]}>
              <Ionicons name="wallet" size={24} color={Colors.white} />
            </View>
            <View style={styles.walletInfo}>
              <Text style={styles.walletName}>Ví SmartSpend</Text>
              <Text style={styles.walletBalance}>{walletBalance.toLocaleString("vi-VN")} ₫</Text>
            </View>
          </View>

          <View style={styles.walletCard}>
            <View style={[styles.walletIconContainer, { backgroundColor: "#F3F4F6" }]}>
              <Ionicons name="leaf" size={24} color="#9CA3AF" />
            </View>
            <View style={styles.walletInfo}>
              <Text style={styles.walletName}>Ví Tiết kiệm</Text>
              <Text style={styles.walletBalance}>Chưa liên kết</Text>
            </View>
          </View>

          <View style={styles.walletCard}>
            <View style={[styles.walletIconContainer, { backgroundColor: "#F3F4F6" }]}>
              <Ionicons name="cube" size={24} color="#9CA3AF" />
            </View>
            <View style={styles.walletInfo}>
              <Text style={styles.walletName}>Quỹ</Text>
              <Text style={styles.walletBalance}>Chưa liên kết</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Số tiền cần rút</Text>
        <View style={styles.amountInputRow}>
          <TextInput
            style={styles.amountInput}
            keyboardType="numeric"
            value={formatDisplayAmount(amount)}
            onChangeText={handleAmountChange}
            placeholder="0"
            placeholderTextColor="#D1D5DB"
            maxLength={14}
          />
          <Text style={styles.currencySymbol}>₫</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={styles.suggestionContainer}>
        {SUGGESTED_AMOUNTS.map((amt) => (
          <TouchableOpacity 
            key={amt} 
            style={styles.suggestionChip}
            onPress={() => setAmount(amt.toString())}
          >
            <Text style={styles.suggestionText}>{amt.toLocaleString("vi-VN")} ₫</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Chuyển tiền đến ngân hàng</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletCardScroll} contentContainerStyle={styles.walletCardContent}>
        {bankAccounts.map((bank) => (
          <TouchableOpacity 
            key={bank.id} 
            style={[
              styles.walletCard,
              selectedBankId === bank.id && styles.walletCardActive
            ]}
            onPress={() => setSelectedBankId(bank.id)}
          >
            <View style={[styles.walletIconContainer, { backgroundColor: Colors.white, borderWidth: 1, borderColor: '#F3F4F6' }]}>
              <Image 
                source={{ uri: getBankLogo(bank.bankCode) }} 
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
            </View>
            <View style={styles.walletInfo}>
              <Text style={styles.walletName} numberOfLines={1}>{bank.bankName}</Text>
              <Text style={styles.walletBalance}>**** {bank.accountNumber.slice(-4)}</Text>
            </View>
            {selectedBankId === bank.id && (
              <View style={[styles.radioOuter, styles.radioOuterActive, { position: 'absolute', top: 12, right: 12, width: 16, height: 16 }]}>
                <View style={[styles.radioInner, { width: 8, height: 8 }]} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const parsedAmount = amount ? parseInt(amount, 10) : 0;
  const isButtonDisabled = parsedAmount === 0 || (activeTab === 'withdraw' && !selectedBankId) || isLoading;

  if (isFetchingData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Curved Header Background */}
      <View style={{ 
        backgroundColor: Colors.primary, 
        height: 220, 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32
      }} />
      
      <KeyboardAvoidingView style={{ flex: 1, paddingTop: insets.top }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flex: 1 }}>
            
            <View style={[styles.header, { backgroundColor: 'transparent' }]}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={28} color={Colors.white} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: Colors.white }]}>Nạp/Rút</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              
              <View style={styles.folderTabContainer}>
                <TouchableOpacity 
                  style={[styles.folderTab, activeTab === 'topup' ? styles.folderTabActive : styles.folderTabInactive]}
                  onPress={() => handleTabChange('topup')}
                  activeOpacity={1}
                >
                  <Ionicons name={activeTab === 'topup' ? "arrow-down-circle" : "arrow-down-circle-outline"} size={22} color={activeTab === 'topup' ? Colors.primary : "#6B7280"} />
                  <Text style={[styles.tabText, activeTab === 'topup' && styles.tabTextActive]}>Nạp tiền</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.folderTab, activeTab === 'withdraw' ? styles.folderTabActive : styles.folderTabInactive]}
                  onPress={() => handleTabChange('withdraw')}
                  activeOpacity={1}
                >
                  <Ionicons name={activeTab === 'withdraw' ? "arrow-up-circle" : "arrow-up-circle-outline"} size={22} color={activeTab === 'withdraw' ? Colors.primary : "#6B7280"} />
                  <Text style={[styles.tabText, activeTab === 'withdraw' && styles.tabTextActive]}>Rút tiền</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.cardContainer, activeTab === 'topup' ? styles.cardTopLeftSquare : styles.cardTopRightSquare, { marginTop: 0 }]}>
                {activeTab === 'topup' ? renderTopUpForm() : renderWithdrawForm()}
              </View>

              <View style={styles.securityContainer}>
                <View style={styles.securityIconContainer}>
                  <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
                </View>
                <View style={styles.securityInfo}>
                  <Text style={styles.securityText}>An toàn tài sản & Bảo mật thông tin của bạn là ưu tiên hàng đầu của chúng tôi.</Text>
                  <Text style={styles.securityLink}>Tìm hiểu thêm</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.confirmButton, isButtonDisabled && styles.confirmButtonDisabled]}
                disabled={isButtonDisabled}
                onPress={activeTab === 'topup' ? handleTopUpConfirm : handleWithdrawConfirm}
                activeOpacity={0.8}
              >
                <Text style={[styles.confirmButtonText, isButtonDisabled && styles.confirmButtonTextDisabled]}>
                  {isLoading ? "Đang xử lý..." : (activeTab === 'topup' ? "Nạp tiền" : "Rút tiền")}
                </Text>
              </TouchableOpacity>
            </View>

        </View>
      </KeyboardAvoidingView>

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
    </View>
  );
}
