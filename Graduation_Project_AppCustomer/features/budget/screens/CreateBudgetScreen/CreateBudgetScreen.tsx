import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableWithoutFeedback
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { budgetApi } from '../../../../shared/api/budgetApi';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';
import PastelHeaderShell from '../../../../shared/components/PastelHeaderShell/PastelHeaderShell';
import { useCategoryContext } from '../../../../shared/contexts/CategoryContext';
import { useTheme, useLanguage } from '../../../../shared/contexts/ThemeLanguageContext';
import { Toast } from '../../../../shared/components/Toast/Toast';

export const CreateBudgetScreen = () => {
  const router = useRouter();
  const { categories, isLoading: isLoadingCategories } = useCategoryContext();
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCycle] = useState<'CUSTOM'>('CUSTOM');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
  
  const [amountError, setAmountError] = useState('');
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [duplicateModal, setDuplicateModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });

  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg });
  };

  const handleAmountChange = (text: string) => {
    let numericValue = text.replace(/[^0-9]/g, '');
    numericValue = numericValue.replace(/^0+/, '');
    
    if (!numericValue) {
      setAmount('');
      setAmountError('');
      return;
    }
    
    const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setAmount(formatted);
    
    if (Number(numericValue) < 10000) {
      setAmountError('Hạn mức phải từ 10.000đ trở lên');
    } else {
      setAmountError('');
    }
  };

  const isFormValid = !!name.trim() && !!selectedCategory && !!amount && (parseFloat(amount.replace(/\./g, '')) >= 10000) && (selectedCycle !== 'CUSTOM' || (startDate <= endDate));

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    // For Android, the native dialog closes automatically, so we set showDatePicker to false immediately.
    // For iOS, the Modal stays open until the user taps 'Xong'.
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      if (datePickerMode === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };


  const handleSave = async () => {
    if (!name.trim()) {
      setDuplicateModal({
        visible: true,
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập tên ngân sách.',
      });
      return;
    }
    if (!selectedCategory) {
      setDuplicateModal({
        visible: true,
        title: 'Thiếu thông tin',
        message: 'Vui lòng chọn danh mục áp dụng.',
      });
      return;
    }
    const numericAmount = parseFloat(amount.replace(/\./g, ''));
    if (!numericAmount || isNaN(numericAmount) || numericAmount < 10000) {
      setAmountError('Hạn mức phải từ 10.000đ trở lên');
      return;
    }

    if (startDate > endDate) {
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: any = {
        name: name.trim(),
        amount: numericAmount,
        categoryId: selectedCategory.id,
        cycle: selectedCycle,
      };
      
      if (selectedCycle === 'CUSTOM') {
        payload.startDate = startDate.toISOString().split('T')[0];
        payload.endDate = endDate.toISOString().split('T')[0];
      }

      await budgetApi.createBudget(payload);
      // Tự động chuyển thẳng sang màn hình ngân sách khi tạo thành công
      router.replace('/budget');
    } catch (error: any) {
      let errCode = error?.code || error?.response?.data?.code;
      let errMsg = error?.message || error?.response?.data?.message;

      if (!errMsg && typeof error === 'string') {
        try {
          const parsed = JSON.parse(error);
          errCode = parsed?.code || errCode;
          errMsg = parsed?.message || errMsg;
        } catch (e) {
          errMsg = error;
        }
      }

      if (typeof errMsg === 'object') {
        errMsg = (errMsg as any)?.message || JSON.stringify(errMsg);
      }

      const isDuplicate = 
        errCode === 'BUDGET_ALREADY_EXISTS' || 
        errCode === 'BUDGET_9002' || 
        (typeof errMsg === 'string' && (errMsg.includes('already exists') || errMsg.includes('đã tồn tại')));

      if (isDuplicate) {
        const categoryLabel = selectedCategory?.label || 'này';
        setDuplicateModal({
          visible: true,
          title: 'Trùng lặp ngân sách',
          message: `Ngân sách cho danh mục "${categoryLabel}" trong chu kỳ Tùy chỉnh đã tồn tại. Vui lòng chọn thời gian khác hoặc xóa ngân sách cũ trước.`,
        });
      } else {
        console.log('Lỗi khi tạo ngân sách:', error);
        setDuplicateModal({
          visible: true,
          title: 'Đã xảy ra lỗi',
          message: errMsg || 'Đã có lỗi xảy ra khi tạo ngân sách.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
                            if (!name) setName(item.label);
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

  const renderDuplicateModal = () => (
    <Modal
      transparent
      visible={duplicateModal.visible}
      animationType="fade"
      onRequestClose={() => setDuplicateModal(prev => ({ ...prev, visible: false }))}
    >
      <View style={styles.alertOverlay}>
        <View style={styles.alertBox}>
          <View style={styles.alertIconBg}>
            <Ionicons name="close-circle" size={36} color="#EF4444" />
          </View>
          <Text style={styles.alertTitle}>{duplicateModal.title}</Text>
          <Text style={styles.alertMessage}>{duplicateModal.message}</Text>

          <View style={styles.alertActions}>
            <TouchableOpacity
              style={styles.alertErrorBtn}
              onPress={() => setDuplicateModal(prev => ({ ...prev, visible: false }))}
              activeOpacity={0.7}
            >
              <Text style={styles.alertConfirmText}>Đã hiểu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={PASTEL_PALETTE.headerStart} />

      {/* Header gradient màu hồng tím pastel chuẩn theme */}
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back-outline" size={22} color="#7C3AED" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Tạo Ngân sách mới</Text>
            <Text style={styles.headerSubtitle}>Thiết lập hạn mức chi tiêu</Text>
          </View>
        </View>
      </PastelHeaderShell>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin ngân sách</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Tên ngân sách</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Ngân sách ăn uống..."
              placeholderTextColor={PASTEL_PALETTE.textGray}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Danh mục áp dụng</Text>
            <TouchableOpacity 
              style={styles.selectInput}
              onPress={() => setIsCategoryModalVisible(true)}
              activeOpacity={0.7}
            >
              {selectedCategory ? (
                <View style={styles.selectedCategory}>
                  <View style={[styles.smallIconContainer, { backgroundColor: selectedCategory.bgColor || PASTEL_PALETTE.lavenderSoft }]}>
                    <Ionicons name={selectedCategory.icon as any} size={16} color={selectedCategory.color || PASTEL_PALETTE.accentDeep} />
                  </View>
                  <Text style={styles.selectTextValue}>{selectedCategory.label}</Text>
                </View>
                ) : (
                  <Text style={styles.selectTextPlaceholder}>Chọn danh mục...</Text>
                )}
              <Ionicons name="chevron-down" size={20} color={PASTEL_PALETTE.textGray} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Thời gian áp dụng</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                style={[styles.input, { flex: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', borderColor: startDate > endDate ? '#EF4444' : PASTEL_PALETTE.border, borderWidth: 1 }]}
                onPress={() => { setDatePickerMode('start'); setShowDatePicker(true); }}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={20} color={PASTEL_PALETTE.lavender} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: PASTEL_PALETTE.textMuted, marginBottom: 2 }}>Từ ngày</Text>
                  <Text style={{ fontSize: 15, color: PASTEL_PALETTE.title, fontWeight: '600' }} numberOfLines={1}>{formatDate(startDate)}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.input, { flex: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', borderColor: startDate > endDate ? '#EF4444' : PASTEL_PALETTE.border, borderWidth: 1 }]}
                onPress={() => { setDatePickerMode('end'); setShowDatePicker(true); }}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={20} color={PASTEL_PALETTE.accentDeep} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: PASTEL_PALETTE.textMuted, marginBottom: 2 }}>Đến ngày</Text>
                  <Text style={{ fontSize: 15, color: PASTEL_PALETTE.title, fontWeight: '600' }} numberOfLines={1}>{formatDate(endDate)}</Text>
                </View>
              </TouchableOpacity>
            </View>
            {startDate > endDate && (
              <Text style={[styles.errorText, { marginTop: 6 }]}>Ngày kết thúc phải sau ngày bắt đầu</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Số tiền hạn mức (VNĐ)</Text>
            <View style={[styles.amountInputContainer, !!amountError && styles.amountInputContainerError]}>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={PASTEL_PALETTE.gray400}
                keyboardType="numeric"
                value={amount}
                onKeyPress={(e) => {
                  if (e.nativeEvent.key === '0' && !amount) {
                    e.preventDefault();
                  }
                }}
                onChangeText={handleAmountChange}
              />
              <Text style={styles.currencySuffix}>đ</Text>
            </View>
            {!!amountError && (
              <Text style={styles.errorText}>{amountError}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, (!isFormValid || isSubmitting) && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Tạo Ngân sách</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {renderCategoryModal()}
      {renderDuplicateModal()}

      {showDatePicker && Platform.OS !== 'ios' && Platform.OS !== 'web' && (
        <DateTimePicker
          value={datePickerMode === 'start' ? startDate : endDate}
          mode="date"
          display="default"
          minimumDate={datePickerMode === 'start' ? new Date() : startDate}
          onChange={onChangeDate}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
        >
          <TouchableOpacity 
            style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <TouchableWithoutFeedback>
              <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 32 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: PASTEL_PALETTE.gray200, paddingBottom: 12, marginBottom: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: PASTEL_PALETTE.title }}>
                    {datePickerMode === 'start' ? 'Chọn ngày bắt đầu' : 'Chọn ngày kết thúc'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: PASTEL_PALETTE.accentDeep }}>Xong</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <DateTimePicker
                    value={datePickerMode === 'start' ? startDate : endDate}
                    mode="date"
                    display="inline"
                    minimumDate={datePickerMode === 'start' ? new Date() : startDate}
                    onChange={onChangeDate}
                    locale="vi-VN"
                    themeVariant="light"
                    style={{ alignSelf: 'center' }}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>
      )}

      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type="error"
        duration={3000}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.bg,
  },
  headerContent: {
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginLeft: -8,
  },
  headerTitle: {
    color: PASTEL_PALETTE.title,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 11,
    color: PASTEL_PALETTE.subtitle,
    fontWeight: '600',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    shadowColor: PASTEL_PALETTE.accentDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PASTEL_PALETTE.title,
    marginBottom: 18,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: PASTEL_PALETTE.textGray,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: PASTEL_PALETTE.title,
    backgroundColor: '#FFF',
  },
  selectInput: {
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectTextPlaceholder: {
    fontSize: 15,
    color: PASTEL_PALETTE.gray400,
  },
  selectTextValue: {
    fontSize: 15,
    color: PASTEL_PALETTE.title,
    fontWeight: '600',
    marginLeft: 8,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cycleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  cycleButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  cycleButtonActive: {
    borderColor: PASTEL_PALETTE.accentDeep,
    backgroundColor: PASTEL_PALETTE.accentSoft,
  },
  cycleText: {
    fontSize: 13,
    fontWeight: '500',
    color: PASTEL_PALETTE.textGray,
  },
  cycleTextActive: {
    color: PASTEL_PALETTE.accentDeep,
    fontWeight: '700',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    borderRadius: 14,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    height: 56,
  },
  amountInputContainerError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: PASTEL_PALETTE.accentDeep,
    padding: 0,
  },
  currencySuffix: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PASTEL_PALETTE.accentDeep,
  },
  saveButton: {
    backgroundColor: PASTEL_PALETTE.accentDeep,
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
    shadowColor: PASTEL_PALETTE.accentDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.45,
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: PASTEL_PALETTE.bg,
    borderRadius: 24,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: PASTEL_PALETTE.bg,
    borderBottomWidth: 1,
    borderBottomColor: PASTEL_PALETTE.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PASTEL_PALETTE.title,
  },
  closeButton: {
    padding: 4,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: PASTEL_PALETTE.bgSoft,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryLabel: {
    flex: 1,
    fontSize: 15,
    color: PASTEL_PALETTE.title,
    fontWeight: '600',
  },
  separator: {
    height: 0,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  alertIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PASTEL_PALETTE.title || '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 14,
    color: PASTEL_PALETTE.textGray || '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  alertActions: {
    width: '100%',
  },
  alertErrorBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertConfirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
});
