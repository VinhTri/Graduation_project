import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfirmModal } from '@/shared/components'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { friendshipService } from '@/shared/api/services/friendship.service'
import { userService } from '@/shared/api/services/userService'
import { styles } from './TransferScreen.styles'

export const TransferScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [accountNumber, setAccountNumber] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [searchError, setSearchError] = useState('');
  const searchRequestId = useRef(0);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

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
          setSearchError('Không tìm thấy tài khoản người nhận');
          return;
        }

        const name = extractDisplayName(user.username || user.email || 'Khach').toUpperCase();
        setReceiverName(name);
        setSearchError('');
      } else {
        setReceiverName('');
        setSearchError(res?.message || 'Không tìm thấy tài khoản người nhận');
      }
    } catch (error: any) {
      if (requestId !== searchRequestId.current) return;
      setReceiverName('');
      const msg = error?.message || error?.response?.data?.message || 'Không tìm thấy tài khoản người nhận';
      setSearchError(msg);
    } finally {
      if (requestId === searchRequestId.current) {
        setSearching(false);
      }
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

    const numericAmount = parseFloat(amount.replace(/\./g, ''));
    if (isNaN(numericAmount) || numericAmount < 1000) {
      setErrorMessage("Số tiền chuyển tối thiểu là 1.000đ.");
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
                Nhanh chóng & An toàn
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin người nhận</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số tài khoản nhận <Text style={{ color: '#EF4444' }}>*</Text></Text>
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
              {accountNumber.length > 0 && (
                <TouchableOpacity
                  style={styles.clearInputButton}
                  onPress={() => {
                    setAccountNumber('');
                    resetReceiverLookup();
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={20} color={PASTEL_PALETTE.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={[styles.inputGroup, { marginBottom: 0 }]}>
            <Text style={styles.label}>Tên chủ tài khoản</Text>
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
                <Text style={styles.receiverNameText} numberOfLines={1}>
                  {receiverName}
                </Text>
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
          <Text style={styles.cardTitle}>Thông tin giao dịch</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số tiền (tối thiểu 1.000đ)</Text>
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
          </View>

          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={[styles.label, { marginBottom: 0 }]}>Lời nhắn <Text style={{ color: PASTEL_PALETTE.error }}>*</Text></Text>
              <Text style={{ fontSize: 12, color: PASTEL_PALETTE.textMuted }}>{note.length}/100</Text>
            </View>
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              maxLength={100}
            />
          </View>
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={[styles.footer, { flexDirection: 'row', gap: 12 }]}>
        <TouchableOpacity
          style={[styles.saveButton, { flex: 1, backgroundColor: PASTEL_PALETTE.background, borderWidth: 1, borderColor: PASTEL_PALETTE.border, shadowOpacity: 0 }]}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/home');
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.saveButtonText, { color: PASTEL_PALETTE.title }]}>Quay lại</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, { flex: 2 }, (!isFormValid || loading) && { opacity: 0.5 }]}
          onPress={onTransferRequest}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Tiếp tục</Text>
          )}
        </TouchableOpacity>
      </View>


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
