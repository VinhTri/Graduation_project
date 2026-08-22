import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfirmModal } from '@/shared/components'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { friendshipService, type FriendshipResponse } from '@/shared/api/services/friendship.service'
import { userService } from '@/shared/api/services/userService'
import { getDefaultWallet } from '@/shared/services'
import { formatCompactAmount } from '@/shared/utils/moneyFormat'
import { WalletLimitPanel } from '@/features/wallet/components/WalletLimitPanel'
import UserAvatar from '@/shared/components/UserAvatar/UserAvatar'
import { parseSmartSpendTransferQr } from '@/shared/utils/smartSpendQr'
import { styles } from './TransferScreen.styles'

const MIN_TRANSFER = 1_000;
const DAILY_WARN_RATIO = 0.8;

function formatMoney(value: number) {
  return `${value.toLocaleString('vi-VN')} ₫`;
}

function dailyTransferWarning(remaining: number, percent: number) {
  if (remaining < MIN_TRANSFER) {
    return remaining <= 0
      ? `Bạn đã sử dụng ${percent}% hạn mức giao dịch trong ngày và không thể chuyển thêm hôm nay.`
      : `Bạn đã sử dụng ${percent}% hạn mức trong ngày. Phần còn lại ${formatMoney(remaining)} thấp hơn mức chuyển tối thiểu.`;
  }
  return `Bạn đã sử dụng ${percent}% hạn mức giao dịch trong ngày. Hôm nay bạn còn có thể chuyển tối đa ${formatMoney(remaining)}.`;
}

type TransferScreenProps = {
  autoOpenScanner?: boolean;
};

export const TransferScreen = ({ autoOpenScanner = false }: TransferScreenProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [limitWarningVisible, setLimitWarningVisible] = useState(false);
  const [limitWarningMessage, setLimitWarningMessage] = useState('');

  const [accountNumber, setAccountNumber] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverAvatarUrl, setReceiverAvatarUrl] = useState<string | null>(null);
  const [searchError, setSearchError] = useState('');
  const searchRequestId = useRef(0);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [balance, setBalance] = useState(0);
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [transactionLimit, setTransactionLimit] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const [dailyTransactedAmount, setDailyTransactedAmount] = useState(0);
  const [contactsVisible, setContactsVisible] = useState(false);
  const [friends, setFriends] = useState<FriendshipResponse[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const quickAmounts = [50_000, 100_000, 200_000, 500_000, 1_000_000];
  const entryWarningShownRef = useRef(false);
  const exceedWarningShownRef = useRef(false);
  const contactsAnimation = useRef(new Animated.Value(0)).current;
  const autoScannerOpenedRef = useRef(false);

  // Hàm phụ trợ: cắt đuôi @gmail.com nếu là email
  const extractDisplayName = (nameOrEmail: string) => {
    if (!nameOrEmail) return 'Khach';
    return nameOrEmail.split('@')[0];
  };

  // Load thông tin người gửi để điền lời nhắn mặc định
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await userService.getMyProfile();
        const myName = extractDisplayName(profile.username || profile.email || 'Toi');
        setNote(`${myName} chuyen tien`);
      } catch (error) {
        setNote('Toi chuyen tien');
      }
    };
    fetchProfile();
  }, []);

  const resetReceiverLookup = () => {
    searchRequestId.current += 1;
    setReceiverName('');
    setReceiverAvatarUrl(null);
    setSearchError('');
    setSearching(false);
  };

  const handleAccountNumberChange = (text: string) => {
    setAccountNumber(text.replace(/[^0-9]/g, ''));
  };

  // Debounce tra cứu người nhận theo đúng số tài khoản (8–15 số)
  useEffect(() => {
    const trimmed = accountNumber.trim();

    if (!trimmed || trimmed.length < 8) {
      resetReceiverLookup();
      return;
    }

    setSearching(true);
    setSearchError('');
    setReceiverName('');
    setReceiverAvatarUrl(null);

    const delayDebounceFn = setTimeout(() => {
      handleSearchUser(trimmed);
    }, 500);

    return () => {
      clearTimeout(delayDebounceFn);
      searchRequestId.current += 1;
    };
  }, [accountNumber]);

  const handleSearchUser = async (query: string) => {
    const requestId = ++searchRequestId.current;

    try {
      const res: any = await friendshipService.searchUser(query);
      if (requestId !== searchRequestId.current) return;

      if (res?.success && res.data) {
        const user = res.data;
        const matchedAccount = String(user.accountNumber || '').trim();

        if (matchedAccount !== query) {
          setReceiverName('');
          setReceiverAvatarUrl(null);
          setSearchError('Không tìm thấy tài khoản người nhận');
          return;
        }

        const name = extractDisplayName(user.username || user.email || 'Khach').toUpperCase();
        setReceiverName(name);
        setReceiverAvatarUrl(user.avatarUrl || null);
        setSearchError('');
      } else {
        setReceiverName('');
        setReceiverAvatarUrl(null);
        setSearchError(res?.message || 'Không tìm thấy tài khoản người nhận');
      }
    } catch (error: any) {
      if (requestId !== searchRequestId.current) return;
      setReceiverName('');
      setReceiverAvatarUrl(null);
      const msg = error?.message || error?.response?.data?.message || 'Không tìm thấy tài khoản người nhận';
      setSearchError(msg);
    } finally {
      if (requestId === searchRequestId.current) {
        setSearching(false);
      }
    }
  };

  const applySelectedAccount = (value: string) => {
    const nextAccount = value.replace(/[^0-9]/g, '').trim();
    if (!nextAccount) return;

    const isSameAccount = accountNumber.trim() === nextAccount;
    resetReceiverLookup();
    setAccountNumber(nextAccount);

    // React không chạy lại effect nếu set cùng một STK. Chủ động tra cứu lại
    // để lần quét/chọn thứ hai vẫn khôi phục đầy đủ tên người nhận.
    if (isSameAccount) {
      setSearching(true);
      handleSearchUser(nextAccount);
    }
  };

  const handleAmountChange = (text: string) => {
    let numericValue = text.replace(/[^0-9]/g, '');
    numericValue = numericValue.replace(/^0+/, '');
    if (!numericValue) {
      setAmount('');
      return;
    }
    const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setAmount(formatted);
  };

  const openContacts = async () => {
    contactsAnimation.setValue(0);
    setContactsVisible(true);
    requestAnimationFrame(() => {
      Animated.timing(contactsAnimation, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
    setFriendsLoading(true);
    setFriendsError('');
    try {
      const response: any = await friendshipService.getFriends();
      if (response?.success) {
        setFriends(Array.isArray(response.data) ? response.data : []);
      } else {
        setFriends([]);
        setFriendsError(response?.message || 'Không thể tải danh sách bạn bè.');
      }
    } catch (error: any) {
      setFriends([]);
      setFriendsError(error?.message || 'Không thể tải danh sách bạn bè.');
    } finally {
      setFriendsLoading(false);
    }
  };

  const closeContacts = () => {
    Animated.timing(contactsAnimation, {
      toValue: 0,
      duration: 130,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setContactsVisible(false);
    });
  };

  const selectFriend = (friend: FriendshipResponse) => {
    const friendAccount = String(friend.friendAccountNumber || '').trim();
    if (!friendAccount) return;
    applySelectedAccount(friendAccount);
    closeContacts();
  };

  const openScanner = () => {
    setQrScanned(false);
    setScannerError('');
    setScannerVisible(true);
  };

  useEffect(() => {
    if (!autoOpenScanner || autoScannerOpenedRef.current) return;
    autoScannerOpenedRef.current = true;
    setQrScanned(false);
    setScannerError('');
    setScannerVisible(true);
  }, [autoOpenScanner]);

  const closeScanner = () => {
    setScannerVisible(false);
    setQrScanned(false);
    setScannerError('');
  };

  const handleQrScanned = ({ data }: { data: string }) => {
    if (qrScanned) return;
    setQrScanned(true);
    const payload = parseSmartSpendTransferQr(data);
    if (!payload) {
      setScannerError('Đây không phải mã nhận tiền SmartSpend hợp lệ.');
      return;
    }
    applySelectedAccount(payload.accountNumber);
    closeScanner();
  };

  useFocusEffect(
    React.useCallback(() => {
      getDefaultWallet()
        .then((wallet) => {
          setBalance(Number(wallet?.balance ?? 0));
          setLimitEnabled(wallet?.limitStatus === 'ENABLED');
          setTransactionLimit(
            wallet?.transactionLimit != null && Number(wallet.transactionLimit) > 0
              ? Number(wallet.transactionLimit)
              : null,
          );
          setDailyLimit(
            wallet?.dailyLimit != null && Number(wallet.dailyLimit) > 0
              ? Number(wallet.dailyLimit)
              : null,
          );
          const used = Number(wallet?.dailyTransactedAmount ?? 0);
          setDailyTransactedAmount(used);

          const enabled = wallet?.limitStatus === 'ENABLED';
          const configuredDaily = wallet?.dailyLimit != null
            ? Number(wallet.dailyLimit)
            : 0;
          if (!entryWarningShownRef.current && enabled && configuredDaily > 0) {
            const remaining = Math.max(0, configuredDaily - used);
            const ratio = used / configuredDaily;
            if (ratio >= DAILY_WARN_RATIO || remaining < MIN_TRANSFER) {
              entryWarningShownRef.current = true;
              setLimitWarningMessage(
                dailyTransferWarning(remaining, Math.min(100, Math.round(ratio * 100))),
              );
              setLimitWarningVisible(true);
            }
          }
        })
        .catch(() => undefined);
    }, []),
  );

  const numericAmount = useMemo(
    () => Number(amount.replace(/\./g, '')) || 0,
    [amount],
  );
  const remainingDaily = useMemo(
    () => limitEnabled && dailyLimit != null
      ? Math.max(0, dailyLimit - dailyTransactedAmount)
      : null,
    [dailyLimit, dailyTransactedAmount, limitEnabled],
  );
  const amountLimitError = useMemo(() => {
    if (numericAmount <= 0) return '';
    if (numericAmount > balance) return 'Số dư ví không đủ.';
    if (limitEnabled && transactionLimit != null && numericAmount > transactionLimit) {
      return `Vượt hạn mức mỗi giao dịch (${transactionLimit.toLocaleString('vi-VN')}đ).`;
    }
    if (remainingDaily != null && numericAmount > remainingDaily) {
      return remainingDaily <= 0
        ? 'Bạn đã hết hạn mức giao dịch trong ngày.'
        : `Hạn mức hôm nay chỉ còn ${remainingDaily.toLocaleString('vi-VN')}đ.`;
    }
    return '';
  }, [balance, limitEnabled, numericAmount, remainingDaily, transactionLimit]);

  useEffect(() => {
    if (numericAmount <= 0 || remainingDaily == null) {
      exceedWarningShownRef.current = false;
      return;
    }
    if (numericAmount > remainingDaily || remainingDaily < MIN_TRANSFER) {
      if (!exceedWarningShownRef.current) {
        exceedWarningShownRef.current = true;
        setLimitWarningMessage(
          remainingDaily <= 0
            ? 'Bạn đã hết hạn mức giao dịch trong ngày. Hãy thử lại vào ngày mai hoặc điều chỉnh hạn mức ví.'
            : numericAmount > remainingDaily
              ? `Số tiền vượt hạn mức còn lại trong ngày. Bạn chỉ có thể chuyển tối đa ${formatMoney(remainingDaily)} hôm nay.`
              : dailyTransferWarning(
                  remainingDaily,
                  dailyLimit ? Math.min(100, Math.round((dailyTransactedAmount / dailyLimit) * 100)) : 0,
                ),
        );
        setLimitWarningVisible(true);
      }
      return;
    }
    exceedWarningShownRef.current = false;
  }, [dailyLimit, dailyTransactedAmount, numericAmount, remainingDaily]);

  const onTransferRequest = async () => {
    if (!accountNumber.trim() || !receiverName.trim() || searchError) {
      setErrorMessage("Vui lòng nhập chính xác số tài khoản người nhận.");
      setErrorModalVisible(true);
      return;
    }

    if (!note.trim()) {
      setErrorMessage("Vui lòng nhập lời nhắn chuyển tiền.");
      setErrorModalVisible(true);
      return;
    }

    if (isNaN(numericAmount) || numericAmount < MIN_TRANSFER) {
      setErrorMessage("Số tiền chuyển tối thiểu là 1.000đ.");
      setErrorModalVisible(true);
      return;
    }
    if (amountLimitError) {
      if (remainingDaily != null && numericAmount > remainingDaily) {
        setLimitWarningMessage(
          remainingDaily <= 0
            ? 'Bạn đã hết hạn mức giao dịch trong ngày. Hãy thử lại vào ngày mai hoặc điều chỉnh hạn mức ví.'
            : `Số tiền vượt hạn mức còn lại trong ngày. Bạn chỉ có thể chuyển tối đa ${formatMoney(remainingDaily)} hôm nay.`,
        );
        setLimitWarningVisible(true);
        return;
      }
      setErrorMessage(amountLimitError);
      setErrorModalVisible(true);
      return;
    }

    router.push({
      pathname: '/transfer/confirm',
      params: {
        accountNumber: accountNumber.trim(),
        receiverName: receiverName.trim(),
        amount: numericAmount,
        note: note.trim(),
      }
    });
  };

  const isFormValid = accountNumber.trim() !== '' &&
    receiverName.trim() !== '' &&
    !searchError &&
    !searching &&
    amount.trim() !== '' &&
    !amountLimitError &&
    note.trim() !== '';

  const renderHeader = () => (
    <View style={styles.headerWrap}>
      <LinearGradient
        colors={[PASTEL_PALETTE.headerStart, PASTEL_PALETTE.headerMid, PASTEL_PALETTE.headerEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerDecorCircleLarge} />
        <View style={styles.headerDecorCircleSmall} />

        <View style={styles.headerTopRow}>
          <View style={styles.leftSection}>
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/home');
                }
              }}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back-outline" size={24} color={PASTEL_PALETTE.subtitle} />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Chuyển tiền nội bộ
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                Gửi tiền nhanh giữa các tài khoản SmartSpend
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );


  return (
    <KeyboardAvoidingView
      style={styles.safeArea}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {renderHeader()}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepText}>1</Text></View>
            <View style={styles.sectionCopy}>
              <Text style={styles.cardTitle}>Người nhận</Text>
              <Text style={styles.cardSubtitle}>Nhập số tài khoản SmartSpend</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số tài khoản <Text style={styles.requiredMark}>*</Text></Text>
            <View style={styles.accountInputWrapper}>
              <TextInput
                style={[
                  styles.input,
                  styles.accountInput,
                  searchError ? styles.inputError : null,
                  receiverName ? styles.inputSuccess : null,
                ]}
                placeholder="Nhập số tài khoản"
                value={accountNumber}
                onChangeText={handleAccountNumberChange}
                placeholderTextColor={PASTEL_PALETTE.textMuted}
                keyboardType="numeric"
                maxLength={15}
              />
              <View style={styles.accountInputActions}>
                {accountNumber.length > 0 ? (
                  <TouchableOpacity
                    style={styles.inputActionButton}
                    onPress={() => {
                      setAccountNumber('');
                      resetReceiverLookup();
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={20} color={PASTEL_PALETTE.textMuted} />
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={[styles.inputActionButton, styles.contactsButton]}
                  onPress={openContacts}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.75}
                  accessibilityLabel="Chọn người nhận từ danh sách bạn bè"
                >
                  <Ionicons name="people" size={20} color={PASTEL_PALETTE.accentDeep} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inputActionButton, styles.scannerButton]}
                  onPress={openScanner}
                  activeOpacity={0.75}
                  accessibilityLabel="Quét mã QR người nhận"
                >
                  <Ionicons name="qr-code-outline" size={20} color="#6D4AAF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={[styles.inputGroup, { marginBottom: 0 }]}>
            <Text style={styles.label}>Xác nhận người nhận</Text>
            <View
              style={[
                styles.input,
                styles.readOnlyInput,
                searchError ? styles.inputError : null,
                receiverName ? styles.inputSuccess : null,
              ]}
            >
              {searching ? (
                <View style={styles.receiverRow}>
                  <ActivityIndicator size="small" color={PASTEL_PALETTE.accentDeep} />
                  <Text style={styles.receiverPlaceholderText}>Đang tra cứu...</Text>
                </View>
              ) : receiverName ? (
                <View style={styles.receiverRow}>
                  <UserAvatar
                    name={receiverName}
                    avatarUrl={receiverAvatarUrl}
                    size={36}
                  />
                  <View style={styles.receiverCopy}>
                    <Text style={styles.receiverNameText} numberOfLines={1}>{receiverName}</Text>
                    <Text style={styles.receiverStatusText}>Đã xác thực tài khoản</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={22} color={PASTEL_PALETTE.success} />
                </View>
              ) : searchError ? (
                <Text style={styles.receiverErrorText} numberOfLines={1}>
                  {searchError}
                </Text>
              ) : (
                <Text style={styles.receiverPlaceholderText}>
                  Tự động hiển thị sau khi nhập đúng STK
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepText}>2</Text></View>
            <View style={styles.sectionCopy}>
              <Text style={styles.cardTitle}>Số tiền chuyển</Text>
              <Text style={styles.cardSubtitle}>Tối thiểu 1.000đ mỗi giao dịch</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.amountInputContainer}>
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="0"
                value={amount}
                onKeyPress={(e) => {
                  // Ngăn chặn phím 0 nếu input đang trống để giảm thiểu nháy trên Web
                  if (e.nativeEvent.key === '0' && !amount) {
                    e.preventDefault();
                  }
                }}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholderTextColor={PASTEL_PALETTE.textMuted}
              />
              <Text style={styles.currencySuffix}>đ</Text>
            </View>
            <View style={styles.quickAmountRow}>
              {quickAmounts.map((value) => {
                const formattedValue = value.toLocaleString('vi-VN');
                const selected = amount === formattedValue;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.quickAmountChip, selected && styles.quickAmountChipSelected]}
                    onPress={() => setAmount(formattedValue)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.quickAmountText, selected && styles.quickAmountTextSelected]}>
                      {formatCompactAmount(value)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {amountLimitError ? <Text style={styles.amountErrorText}>{amountLimitError}</Text> : null}

            <View style={styles.transferBalanceCard}>
              <View style={styles.transferBalanceRow}>
                <Text style={styles.transferBalanceLabel}>Số dư khả dụng</Text>
                <Text style={styles.transferBalanceValue}>{balance.toLocaleString('vi-VN')} ₫</Text>
              </View>
              <WalletLimitPanel
                enabled={limitEnabled}
                transactionLimit={transactionLimit}
                dailyLimit={dailyLimit}
                dailyTransactedAmount={dailyTransactedAmount}
                withdrawAmount={numericAmount}
                currentAmountLabel="Số tiền đang chuyển"
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepText}>3</Text></View>
            <View style={styles.sectionCopy}>
              <Text style={styles.cardTitle}>Lời nhắn</Text>
              <Text style={styles.cardSubtitle}>Giúp người nhận nhận biết giao dịch</Text>
            </View>
          </View>
          <View style={styles.noteHeader}>
            <Text style={styles.label}>Nội dung <Text style={styles.requiredMark}>*</Text></Text>
            <Text style={styles.counterText}>{note.length}/38</Text>
          </View>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            maxLength={38}
            multiline
            textAlignVertical="top"
            placeholder="Nhập lời nhắn chuyển tiền"
            placeholderTextColor={PASTEL_PALETTE.textMuted}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.saveButton, (!isFormValid || loading) && styles.saveButtonDisabled]}
          onPress={onTransferRequest}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.saveButtonText}>Kiểm tra giao dịch</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </View>
          )}
        </TouchableOpacity>
      </View>


      <ConfirmModal
        visible={limitWarningVisible}
        title="Cảnh báo hạn mức ngày"
        message={limitWarningMessage}
        confirmText="Đã hiểu"
        hideCancel={true}
        image={require('../../../../assets/images/daily-limit-warning.png')}
        imageAspectRatio={1}
        isDestructive={false}
        confirmButtonColor={PASTEL_PALETTE.accentDeep}
        onConfirm={() => setLimitWarningVisible(false)}
        onCancel={() => setLimitWarningVisible(false)}
      />

      <Modal
        visible={scannerVisible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeScanner}
      >
        <View style={styles.scannerScreen}>
          {cameraPermission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={qrScanned ? undefined : handleQrScanned}
            />
          ) : null}
          <View style={[styles.scannerHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity style={styles.scannerClose} onPress={closeScanner}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.scannerHeaderCopy}>
              <Text style={styles.scannerTitle}>Quét QR SmartSpend</Text>
              <Text style={styles.scannerSubtitle}>Đưa mã nhận tiền vào trong khung</Text>
            </View>
            <View style={styles.scannerHeaderSpacer} />
          </View>

          {cameraPermission?.granted ? (
            <View style={styles.scannerBody} pointerEvents="box-none">
              <View style={styles.scanFrame}>
                <View style={[styles.scanCorner, styles.scanCornerTopLeft]} />
                <View style={[styles.scanCorner, styles.scanCornerTopRight]} />
                <View style={[styles.scanCorner, styles.scanCornerBottomLeft]} />
                <View style={[styles.scanCorner, styles.scanCornerBottomRight]} />
              </View>
              {scannerError ? (
                <View style={styles.scanErrorCard}>
                  <Ionicons name="alert-circle" size={20} color="#DC3F5F" />
                  <Text style={styles.scanErrorText}>{scannerError}</Text>
                  <TouchableOpacity
                    style={styles.scanAgainButton}
                    onPress={() => {
                      setScannerError('');
                      setQrScanned(false);
                    }}
                  >
                    <Text style={styles.scanAgainText}>Quét lại</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.scanHint}>QR phải được tạo từ tài khoản SmartSpend</Text>
              )}
            </View>
          ) : (
            <View style={styles.permissionState}>
              <View style={styles.permissionIcon}>
                <Ionicons name="camera-outline" size={34} color="#6D4AAF" />
              </View>
              <Text style={styles.permissionTitle}>Cần quyền sử dụng camera</Text>
              <Text style={styles.permissionText}>
                SmartSpend chỉ dùng camera để đọc mã QR nhận tiền nội bộ.
              </Text>
              <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
                <Text style={styles.permissionButtonText}>Cho phép camera</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <Modal
        visible={contactsVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeContacts}
      >
        <View style={styles.contactsOverlay}>
          <TouchableOpacity
            style={styles.contactsBackdrop}
            activeOpacity={1}
            onPress={closeContacts}
          />
          <Animated.View
            style={[
              styles.contactsSheet,
              {
                paddingBottom: Math.max(insets.bottom, 18),
                opacity: contactsAnimation,
                transform: [{
                  translateY: contactsAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [22, 0],
                  }),
                }],
              },
            ]}
          >
            <View style={styles.contactsHandle} />
            <View style={styles.contactsHeader}>
              <View>
                <Text style={styles.contactsTitle}>Chọn người nhận</Text>
                <Text style={styles.contactsSubtitle}>Danh sách bạn bè của bạn</Text>
              </View>
              <TouchableOpacity style={styles.contactsClose} onPress={closeContacts}>
                <Ionicons name="close" size={22} color={PASTEL_PALETTE.textDark} />
              </TouchableOpacity>
            </View>

            {friendsLoading ? (
              <View style={styles.contactsState}>
                <ActivityIndicator color={PASTEL_PALETTE.accentDeep} />
                <Text style={styles.contactsStateText}>Đang tải danh sách...</Text>
              </View>
            ) : friendsError ? (
              <View style={styles.contactsState}>
                <Ionicons name="cloud-offline-outline" size={28} color={PASTEL_PALETTE.textMuted} />
                <Text style={styles.contactsStateText}>{friendsError}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={openContacts}>
                  <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : friends.length === 0 ? (
              <View style={styles.contactsState}>
                <Ionicons name="people-outline" size={30} color={PASTEL_PALETTE.lavender} />
                <Text style={styles.contactsStateTitle}>Chưa có bạn bè</Text>
                <Text style={styles.contactsStateText}>Hãy kết bạn trước để chọn nhanh người nhận.</Text>
              </View>
            ) : (
              <FlatList
                style={styles.contactsList}
                data={friends}
                keyExtractor={(friend) => String(friend.id)}
                showsVerticalScrollIndicator={false}
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={5}
                renderItem={({ item: friend }) => {
                  const hasAccount = Boolean(friend.friendAccountNumber);
                  return (
                    <TouchableOpacity
                      key={friend.id}
                      style={[styles.friendRow, !hasAccount && styles.friendRowDisabled]}
                      onPress={() => selectFriend(friend)}
                      disabled={!hasAccount}
                      activeOpacity={0.75}
                    >
                      <UserAvatar
                        name={friend.friendUsername || friend.friendEmail}
                        avatarUrl={friend.friendAvatarUrl}
                        size={46}
                      />
                      <View style={styles.friendCopy}>
                        <Text style={styles.friendName} numberOfLines={1}>
                          {friend.friendUsername || friend.friendEmail}
                        </Text>
                        <Text style={styles.friendAccount} numberOfLines={1}>
                          {hasAccount ? friend.friendAccountNumber : 'Chưa có số tài khoản ví'}
                        </Text>
                      </View>
                      {hasAccount ? (
                        <Ionicons name="chevron-forward" size={18} color={PASTEL_PALETTE.lavender} />
                      ) : null}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </Animated.View>
        </View>
      </Modal>

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
    </KeyboardAvoidingView>
  );
};

export default TransferScreen;
