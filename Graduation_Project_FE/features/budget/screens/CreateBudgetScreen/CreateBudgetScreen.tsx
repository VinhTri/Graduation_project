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
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { budgetApi } from '../../../../shared/api/budgetApi';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';
import PastelHeaderShell from '../../../../shared/components/PastelHeaderShell/PastelHeaderShell';
import { useCategoryContext } from '../../../../shared/contexts/CategoryContext';

import { Toast } from '../../../../shared/components/Toast/Toast';

const CYCLES = [
  { id: 'WEEKLY', label: 'Hàng tuần' },
  { id: 'MONTHLY', label: 'Hàng tháng' },
  { id: 'YEARLY', label: 'Hàng năm' },
] as const;

export const CreateBudgetScreen = () => {
  const router = useRouter();
  const { categories, isLoading: isLoadingCategories } = useCategoryContext();
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCycle, setSelectedCycle] = useState<'WEEKLY'|'MONTHLY'|'YEARLY'>('MONTHLY');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  
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
    setAmount(text);
    if (text.trim() === '') {
      setAmountError('');
      return;
    }
    if (/[^0-9]/.test(text) || isNaN(Number(text))) {
      setAmountError('Vui lòng nhập số');
    } else if (Number(text) < 10000) {
      setAmountError('Hạn mức phải từ 10.000đ trở lên');
    } else {
      setAmountError('');
    }
  };

  const isFormValid = !!name.trim() && !!selectedCategory && !!amount && !/[^0-9]/.test(amount) && !isNaN(Number(amount)) && Number(amount) >= 10000;

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Vui lòng nhập tên ngân sách.');
      return;
    }
    if (!selectedCategory) {
      showToast('Vui lòng chọn danh mục áp dụng.');
      return;
    }
    if (!amount || /[^0-9]/.test(amount) || isNaN(Number(amount)) || Number(amount) < 10000) {
      setAmountError('Hạn mức phải từ 10.000đ trở lên');
      showToast('Hạn mức ngân sách phải từ 10.000đ trở lên.');
      return;
    }

    try {
      setIsSubmitting(true);
      await budgetApi.createBudget({
        name: name.trim(),
        amount: Number(amount),
        categoryId: selectedCategory.id,
        cycle: selectedCycle,
      });
      // Tự động chuyển thẳng sang màn hình ngân sách khi tạo thành công
      router.replace('/budget');
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.response?.data?.message || error?.message || '';
      const errCode = error?.response?.data?.code;
      if (
        errCode === 'BUDGET_ALREADY_EXISTS' || 
        errCode === 'BUDGET_9002' || 
        errMsg.includes('already exists') || 
        errMsg.includes('đã tồn tại')
      ) {
        const cycleText = selectedCycle === 'WEEKLY' ? 'hàng tuần' : selectedCycle === 'MONTHLY' ? 'hàng tháng' : 'hàng năm';
        const categoryLabel = selectedCategory?.label || 'này';
        setDuplicateModal({
          visible: true,
          title: 'Trùng lặp ngân sách',
          message: `Ngân sách cho danh mục "${categoryLabel}" trong chu kỳ "${cycleText}" đã tồn tại. Vui lòng đặt tên khác hoặc xóa ngân sách cũ trước.`,
        });
      } else {
        showToast(errMsg || 'Đã có lỗi xảy ra khi tạo ngân sách.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategoryModal = () => {
    const allItems = categories.flatMap(group => group.items);
    
    return (
      <Modal visible={isCategoryModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn danh mục</Text>
            <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={PASTEL_PALETTE.title} />
            </TouchableOpacity>
          </View>
          {isLoadingCategories ? (
            <ActivityIndicator size="large" color={PASTEL_PALETTE.accentDeep} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={allItems}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
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
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
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
            <Ionicons name="chevron-back" size={22} color={PASTEL_PALETTE.title} />
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
            <Text style={styles.label}>Chu kỳ hạn mức</Text>
            <View style={styles.cycleContainer}>
              {CYCLES.map(cycle => (
                <TouchableOpacity
                  key={cycle.id}
                  style={[
                    styles.cycleButton,
                    selectedCycle === cycle.id && styles.cycleButtonActive
                  ]}
                  onPress={() => setSelectedCycle(cycle.id as any)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.cycleText,
                    selectedCycle === cycle.id && styles.cycleTextActive
                  ]}>
                    {cycle.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
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
    backgroundColor: PASTEL_PALETTE.bgSoft,
  },
  selectInput: {
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: PASTEL_PALETTE.bgSoft,
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
    backgroundColor: PASTEL_PALETTE.bgSoft,
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
    backgroundColor: PASTEL_PALETTE.bgSoft,
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
  modalContainer: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
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
    backgroundColor: '#FFF',
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
