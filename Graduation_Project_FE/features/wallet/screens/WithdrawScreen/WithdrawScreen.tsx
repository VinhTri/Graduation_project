import React, { useState, useCallback, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Keyboard,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import Colors from "../../../../shared/constants/Colors";
import { PASTEL_PALETTE } from "../../../../shared/constants/PastelPalette";
import { PastelHeaderShell } from "../../../../shared/components/PastelHeaderShell";
import { styles } from "./WithdrawScreen.styles";
import { transactionService } from "../../../../shared/api/services/transactionService";
import { walletService, WalletData } from "../../../../shared/api/services/walletService";
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
  const isInitialLoadRef = useRef(true);
  
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLimits, setWalletLimits] = useState<Pick<
    WalletData,
    "isLimitEnabled" | "transactionLimit" | "dailyLimit" | "dailyTransactedAmount"
  >>({
    isLimitEnabled: false,
    transactionLimit: undefined,
    dailyLimit: undefined,
    dailyTransactedAmount: 0,
  });
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

  const [isLimitExpanded, setIsLimitExpanded] = useState(false);
  const limitExpandAnim = useRef(new Animated.Value(0)).current;
  const limitHeightAnim = useRef(new Animated.Value(0)).current;
  const [limitContentHeight, setLimitContentHeight] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const load = async () => {
        const showFullLoading = isInitialLoadRef.current;
        if (showFullLoading) setIsFetchingData(true);

        try {
          const [walletRes, bankRes, profileRes] = await Promise.all([
            walletService.getMyWallet(),
            axiosClient.get(ENDPOINTS.BANK_ACCOUNT.GET_ALL),
            axiosClient.get(ENDPOINTS.USER.PROFILE),
          ]);

          if (cancelled) return;

          setWalletBalance(walletRes.balance || 0);
          setWalletLimits({
            isLimitEnabled: walletRes.isLimitEnabled ?? false,
            transactionLimit: walletRes.transactionLimit,
            dailyLimit: walletRes.dailyLimit,
            dailyTransactedAmount: walletRes.dailyTransactedAmount ?? 0,
          });
          setBankAccounts(bankRes.data || []);
          setUserEmail(profileRes.data?.email || "");

          if (bankRes.data && bankRes.data.length > 0) {
            setSelectedBankId((prev) => prev ?? bankRes.data[0].id);
          }
        } catch (error: any) {
          if (!cancelled && showFullLoading) {
            Alert.alert("Lỗi", "Không thể lấy thông tin ví và thẻ ngân hàng");
          }
        } finally {
          if (!cancelled) {
            if (showFullLoading) setIsFetchingData(false);
            isInitialLoadRef.current = false;
          }
        }
      };

      load();
      return () => {
        cancelled = true;
      };
    }, [])
  );

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
        note: note.trim() || undefined,
        categoryId: selectedCategory ? Number(selectedCategory.id) : undefined,
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
          category: selectedCategory ? selectedCategory.label : "",
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

  const {
    isLimitEnabled,
    transactionLimit,
    dailyLimit,
    dailyTransactedAmount = 0,
  } = walletLimits;

  const hasTransactionLimit = Boolean(isLimitEnabled && transactionLimit);
  const hasDailyLimit = Boolean(isLimitEnabled && dailyLimit);
  const hasLimitsConfigured = hasTransactionLimit || hasDailyLimit;

  useEffect(() => {
    if (!hasLimitsConfigured) return;

    Animated.parallel([
      Animated.timing(limitExpandAnim, {
        toValue: isLimitExpanded ? 1 : 0,
        duration: 320,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(limitHeightAnim, {
        toValue: isLimitExpanded ? limitContentHeight : 0,
        duration: 320,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
    ]).start();
  }, [hasLimitsConfigured, isLimitExpanded, limitContentHeight, limitExpandAnim, limitHeightAnim]);

  const limitChevronRotate = limitExpandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const limitContentOpacity = limitExpandAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.6, 1],
  });

  const limitContentTranslateY = limitExpandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 0],
  });

  const getLimitSummary = () => {
    const parts: string[] = [];
    if (hasTransactionLimit) {
      parts.push(`Mỗi GD: ${transactionLimit!.toLocaleString("vi-VN")} ₫`);
    }
    if (hasDailyLimit) {
      parts.push(`Ngày: ${dailyLimit!.toLocaleString("vi-VN")} ₫`);
    }
    return parts.join(" · ");
  };

  const getLimitProgress = (used: number, limit: number) => {
    if (limit <= 0) {
      return { progressPercentage: 0, remaining: 0, remainingPercent: 0 };
    }
    const progressPercentage = Math.min(100, (used / limit) * 100);
    const remaining = Math.max(0, limit - used);
    const remainingPercent = Math.max(0, 100 - progressPercentage);
    return { progressPercentage, remaining, remainingPercent };
  };

  const transactionLimitProgress = hasTransactionLimit
    ? getLimitProgress(parsedAmount, transactionLimit!)
    : null;
  const dailyLimitProgress = hasDailyLimit
    ? getLimitProgress(dailyTransactedAmount, dailyLimit!)
    : null;

  const renderLimitProgressBar = (progressPercentage: number) => (
    <View style={styles.limitProgressTrack}>
      <View
        style={[
          styles.limitProgressFill,
          {
            backgroundColor: progressPercentage >= 100 ? Colors.error : PASTEL_PALETTE.accent,
            width: `${progressPercentage}%`,
          },
        ]}
      />
    </View>
  );

  const renderLimitDetails = () => (
    <>
      <View style={styles.limitRow}>
        <Text style={styles.limitLabel}>Hạn mức mỗi lần giao dịch</Text>
        {hasTransactionLimit ? (
          <Text style={styles.limitValue}>
            {transactionLimit!.toLocaleString("vi-VN")} ₫
          </Text>
        ) : (
          <Text style={styles.limitPlaceholder}>Chưa thiết lập</Text>
        )}
      </View>

      {hasTransactionLimit && transactionLimitProgress && (
        <>
          <View style={styles.limitStatsRow}>
            <View style={styles.limitStatBlock}>
              <Text style={styles.limitStatLabel}>Số tiền đang rút</Text>
              <Text style={styles.limitStatValue}>
                {parsedAmount.toLocaleString("vi-VN")} ₫
              </Text>
            </View>
            <View style={styles.limitStatBlockEnd}>
              <Text style={styles.limitStatLabel}>Hạn mức còn lại</Text>
              <Text style={styles.limitStatValue}>
                {transactionLimitProgress.remaining.toLocaleString("vi-VN")} ₫
              </Text>
            </View>
          </View>
          {renderLimitProgressBar(transactionLimitProgress.progressPercentage)}
          <Text style={[styles.limitStatLabel, styles.limitStatHint]}>
            {Math.round(transactionLimitProgress.remainingPercent)}% còn lại
          </Text>
        </>
      )}

      <View style={[styles.limitRow, styles.limitRowSpacing]}>
        <Text style={styles.limitLabel}>Hạn mức giao dịch / ngày</Text>
        {hasDailyLimit ? (
          <Text style={styles.limitValue}>
            {dailyLimit!.toLocaleString("vi-VN")} ₫
          </Text>
        ) : (
          <Text style={styles.limitPlaceholder}>Chưa thiết lập</Text>
        )}
      </View>

      {hasDailyLimit && dailyLimitProgress && (
        <>
          <View style={styles.limitStatsRow}>
            <View style={styles.limitStatBlock}>
              <Text style={styles.limitStatLabel}>Đã giao dịch trong ngày</Text>
              <Text style={styles.limitStatValue}>
                {dailyTransactedAmount.toLocaleString("vi-VN")} ₫
              </Text>
            </View>
            <View style={styles.limitStatBlockEnd}>
              <Text style={styles.limitStatLabel}>Hạn mức còn lại</Text>
              <Text style={styles.limitStatValue}>
                {dailyLimitProgress.remaining.toLocaleString("vi-VN")} ₫
              </Text>
            </View>
          </View>
          {renderLimitProgressBar(dailyLimitProgress.progressPercentage)}
          <Text style={[styles.limitStatLabel, styles.limitStatHint]}>
            {Math.round(dailyLimitProgress.remainingPercent)}% còn lại
          </Text>
        </>
      )}
    </>
  );

  if (isFetchingData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PASTEL_PALETTE.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <PastelHeaderShell contentStyle={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back-outline" size={22} color={PASTEL_PALETTE.subtitle} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={2} ellipsizeMode="tail">
              Rút tiền về tài khoản liên kết
            </Text>
          </View>

          <View style={styles.sourceFundsCard}>
            <View style={styles.sourceFundsRow}>
              <View style={styles.sourceFundsIcon}>
                <Ionicons name="wallet" size={24} color={PASTEL_PALETTE.accent} />
              </View>
              <View style={styles.sourceFundsInfo}>
                <Text style={styles.sourceFundsLabel}>Nguồn tiền</Text>
                <Text style={styles.sourceFundsValue}>Ví SmartSpend</Text>
              </View>
              <View style={styles.sourceFundsBalanceWrap}>
                <Text style={styles.sourceFundsLabel}>Số dư</Text>
                <Text style={styles.sourceFundsValue}>{walletBalance.toLocaleString("vi-VN")} ₫</Text>
              </View>
            </View>

            {hasLimitsConfigured ? (
              <View style={styles.limitSection}>
                <View style={styles.limitDivider} />
                <TouchableOpacity
                  style={styles.limitToggleRow}
                  activeOpacity={0.85}
                  onPress={() => setIsLimitExpanded((prev) => !prev)}
                >
                  <View style={styles.limitToggleTextWrap}>
                    <Text style={styles.limitToggleTitle}>Hạn mức giao dịch</Text>
                    {!isLimitExpanded ? (
                      <Text style={styles.limitToggleSummary} numberOfLines={1}>
                        {getLimitSummary()}
                      </Text>
                    ) : null}
                  </View>
                  <Animated.View style={{ transform: [{ rotate: limitChevronRotate }] }}>
                    <Ionicons name="chevron-down" size={18} color={PASTEL_PALETTE.subtitle} />
                  </Animated.View>
                </TouchableOpacity>

                <Animated.View style={{ height: limitHeightAnim, overflow: "hidden" }}>
                  <Animated.View
                    style={{
                      opacity: limitContentOpacity,
                      transform: [{ translateY: limitContentTranslateY }],
                    }}
                  >
                    <View style={styles.limitDetails}>{renderLimitDetails()}</View>
                  </Animated.View>
                </Animated.View>

                <View
                  pointerEvents="none"
                  style={styles.limitMeasureWrap}
                  onLayout={(event) => {
                    const nextHeight = event.nativeEvent.layout.height;
                    if (nextHeight > 0 && Math.abs(nextHeight - limitContentHeight) > 1) {
                      setLimitContentHeight(nextHeight);
                    }
                  }}
                >
                  <View style={styles.limitDetails}>{renderLimitDetails()}</View>
                </View>
              </View>
            ) : (
              <View style={styles.limitSection}>
                <View style={styles.limitDivider} />
                <Text style={styles.limitPlaceholder}>Chưa thiết lập hạn mức</Text>
              </View>
            )}
          </View>
        </PastelHeaderShell>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
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
                <View style={styles.amountSection}>
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

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestionContainer}
                  >
                    {QUICK_AMOUNTS.map((amt) => (
                      <TouchableOpacity
                        key={amt}
                        style={[
                          styles.suggestionChip,
                          parsedAmount === amt && styles.suggestionChipSelected,
                        ]}
                        onPress={() => handleQuickAmount(amt)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.suggestionText,
                            parsedAmount === amt && styles.suggestionTextSelected,
                          ]}
                        >
                          {amt.toLocaleString("vi-VN")} ₫
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Bank Selection */}
              <View style={styles.paymentSection}>
                <Text style={styles.sectionTitle}>Chuyển tiền đến</Text>
                {bankAccounts.length === 0 ? (
                  <>
                    <TouchableOpacity
                      style={styles.bankLinkCard}
                      onPress={() => router.push("/settings/bank-binding/add")}
                      activeOpacity={0.8}
                    >
                      <View style={styles.bankLinkIconWrap}>
                        <Ionicons name="link-outline" size={22} color={Colors.textMuted} />
                      </View>
                      <View style={styles.bankLinkInfo}>
                        <Text style={styles.bankLinkTitle}>Liên kết tài khoản ngân hàng</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                    </TouchableOpacity>
                    <Text style={styles.bankLinkHint}>
                      Bạn phải liên kết ngân hàng để thực hiện rút tiền.
                    </Text>
                  </>
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
                <Text style={styles.sectionTitle}>Chọn danh mục</Text>
                <TouchableOpacity
                  style={[
                    styles.categoryCard,
                    !selectedCategory && styles.categoryCardEmpty,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setIsCategoryModalVisible(true)}
                >
                  <View
                    style={[
                      styles.categoryIconWrap,
                      selectedCategory
                        ? { backgroundColor: selectedCategory.bgColor }
                        : styles.categoryIconWrapEmpty,
                    ]}
                  >
                    <Ionicons
                      name={selectedCategory ? selectedCategory.icon : "pricetag-outline"}
                      size={selectedCategory ? 24 : 22}
                      color={selectedCategory ? selectedCategory.color : Colors.textMuted}
                    />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text
                      style={[
                        styles.categoryTitle,
                        !selectedCategory && styles.categoryTitleEmpty,
                      ]}
                      numberOfLines={1}
                    >
                      {selectedCategory ? selectedCategory.label : "Chưa chọn danh mục"}
                    </Text>
                    {selectedCategory ? (
                      <Text style={styles.categoryGroup} numberOfLines={1}>
                        {selectedCategory.groupName}
                      </Text>
                    ) : (
                      <Text style={styles.categoryHint}>Nhấn để phân loại giao dịch</Text>
                    )}
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
                <View style={styles.securityIconContainer}>
                  <Ionicons name="shield-checkmark" size={24} color={PASTEL_PALETTE.accentDeep} />
                </View>
                <Text style={styles.securityText}>
                  Miễn phí rút tiền về thẻ ngân hàng đã liên kết.
                </Text>
              </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Action */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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
