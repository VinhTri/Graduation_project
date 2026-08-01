import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
  TouchableWithoutFeedback
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfirmModal } from '@/shared/components';
import { useCategoryContext } from '@/shared/contexts/CategoryContext';
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette';
import { friendshipService } from '@/shared/api/services/friendship.service';
import { userService } from '@/shared/api/services/userService';
import { styles } from './TransferScreen.styles';

export const TransferScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [accountNumber, setAccountNumber] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const { categories, isLoading: isLoadingCategories } = useCategoryContext();
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

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

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (accountNumber.length >= 4) {
        handleSearchUser(accountNumber);
      } else {
        setReceiverName('');
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [accountNumber]);

  const handleSearchUser = async (query: string) => {
    try {
      setSearching(true);
      const res: any = await friendshipService.searchUser(query);
      if (res && res.success && res.data) {
        const user = res.data;
        const name = user.username || user.email;
        setReceiverName(name);
      } else {
        setReceiverName('Không tìm thấy người dùng');
      }
    } catch (error) {
      setReceiverName('');
    } finally {
      setSearching(false);
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
    if (!accountNumber.trim() || receiverName === 'Không tìm thấy người dùng' || !receiverName) {
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
        receiverName,
        amount: numericAmount,
        note: note.trim(),
        categoryId: selectedCategory?.id,
        categoryLabel: selectedCategory?.label,
        categoryIcon: selectedCategory?.icon,
        categoryColor: selectedCategory?.color,
        categoryBgColor: selectedCategory?.bgColor
      }
    });
  };

  const isFormValid = accountNumber.trim() !== '' && 
                      receiverName !== '' && 
                      receiverName !== 'Không tìm thấy người dùng' && 
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

  const renderCategoryModal = () => {
    return (
      <Modal visible={isCategoryModalVisible} transparent animationType="fade" onRequestClose={() => setIsCategoryModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setIsCategoryModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chọn danh mục</Text>
                  <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={PASTEL_PALETTE.title} />
                  </TouchableOpacity>
                </View>
                {isLoadingCategories ? (
                  <ActivityIndicator size="large" color={PASTEL_PALETTE.accentDeep} style={{ marginTop: 20 }} />
                ) : (
                  <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}>
                    {categories.map((group: any) => {
                      if (!group.items || group.items.length === 0) return null;
                      return (
                        <View key={group.id} style={{ marginBottom: 20 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Ionicons name={group.icon as any || 'folder'} size={18} color={group.color || PASTEL_PALETTE.title} />
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: group.color || PASTEL_PALETTE.title, marginLeft: 8 }}>
                              {group.title}
                            </Text>
                          </View>
                          
                          {group.items.map((item: any) => (
                            <TouchableOpacity 
                              key={item.id}
                              style={styles.categoryItem}
                              onPress={() => {
                                setSelectedCategory(item);
                                setIsCategoryModalVisible(false);
                              }}
                              activeOpacity={0.7}
                            >
                              <View style={[styles.iconContainer, { backgroundColor: item.bgColor || PASTEL_PALETTE.lavenderSoft }]}>
                                <Ionicons name={item.icon as any} size={22} color={item.color || PASTEL_PALETTE.accentDeep} />
                              </View>
                              <Text style={styles.categoryLabel}>{item.label}</Text>
                              {selectedCategory?.id === item.id && (
                                <Ionicons name="checkmark-circle" size={22} color={PASTEL_PALETTE.accentDeep} />
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

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
            <Text style={styles.label}>Số tài khoản</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số tài khoản..."
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholderTextColor={PASTEL_PALETTE.textMuted}
              autoCapitalize="none"
              maxLength={15}
            />
            {searching ? (
              <ActivityIndicator style={{ marginTop: 8 }} size="small" color={PASTEL_PALETTE.accentDeep} />
            ) : receiverName ? (
              <Text style={[styles.userNameText, { color: receiverName === 'Không tìm thấy người dùng' ? '#EF4444' : PASTEL_PALETTE.accentDeep }]}>
                {receiverName !== 'Không tìm thấy người dùng' ? `Người nhận: ${receiverName}` : receiverName}
              </Text>
            ) : null}
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
            <Text style={styles.label}>Danh mục (Tùy chọn)</Text>
            <TouchableOpacity 
              style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              onPress={() => setIsCategoryModalVisible(true)}
              activeOpacity={0.7}
            >
              {selectedCategory ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[{ width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }, { backgroundColor: selectedCategory.bgColor || PASTEL_PALETTE.lavenderSoft }]}>
                    <Ionicons name={selectedCategory.icon as any} size={16} color={selectedCategory.color || PASTEL_PALETTE.accentDeep} />
                  </View>
                  <Text style={{ fontSize: 15, color: PASTEL_PALETTE.title, fontWeight: '600', marginLeft: 8 }}>{selectedCategory.label}</Text>
                </View>
              ) : (
                <Text style={{ fontSize: 15, color: PASTEL_PALETTE.textMuted }}>Chọn danh mục giao dịch...</Text>
              )}
              <Ionicons name="chevron-down" size={20} color={PASTEL_PALETTE.textMuted} />
            </TouchableOpacity>
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

      {renderCategoryModal()}
    </KeyboardAvoidingView>
  );
};

export default TransferScreen;
