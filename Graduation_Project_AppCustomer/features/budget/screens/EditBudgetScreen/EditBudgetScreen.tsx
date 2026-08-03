import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { budgetApi } from '../../../../shared/api/budgetApi';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';
import PastelHeaderShell from '../../../../shared/components/PastelHeaderShell/PastelHeaderShell';
import { useCategoryContext } from '../../../../shared/contexts/CategoryContext';
import { useTheme, useLanguage } from '../../../../shared/contexts/ThemeLanguageContext';
import { Toast } from '../../../../shared/components/Toast/Toast';

export const EditBudgetScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { categories, isLoading: isLoadingCategories } = useCategoryContext();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  
  const [amountError, setAmountError] = useState('');
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg });
  };

  useEffect(() => {
    if (id) {
      loadBudgetDetail();
    }
  }, [id]);

  const loadBudgetDetail = async () => {
    try {
      setIsLoadingInitial(true);
      const data: any = await budgetApi.getBudgetById(Number(id));
      if (data) {
        setName(data.name || '');
        setAmount(data.amount ? data.amount.toLocaleString('vi-VN') : '');
        if (data.categoryId) {
          setSelectedCategory({
            id: data.categoryId,
            label: data.categoryName,
            icon: data.categoryIcon,
            color: data.categoryColor,
          });
        }
      }
    } catch (err: any) {
      console.log('Error loading budget detail:', err);
      Alert.alert(isEn ? 'Error' : 'Lỗi', isEn ? 'Could not load budget detail' : 'Không thể tải thông tin ngân sách');
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const handleAmountChange = (text: string) => {
    let numericValue = text.replace(/[^0-9]/g, '');
    numericValue = numericValue.replace(/^0+/, '');
    
    if (!numericValue) {
      setAmount('');
      setAmountError('');
      return;
    }
    
    const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setAmount(formatted);
    
    const val = parseInt(numericValue, 10);
    if (val < 10000) {
      setAmountError(isEn ? 'Minimum amount is 10,000 VND' : 'Hạn mức tối thiểu là 10.000đ');
    } else {
      setAmountError('');
    }
  };

  const handleSubmit = async () => {
    const rawAmount = amount.replace(/\./g, '');
    const numericAmount = parseInt(rawAmount, 10);

    if (!name.trim()) {
      showToast(isEn ? 'Please enter budget name' : 'Vui lòng nhập tên ngân sách');
      return;
    }

    if (!selectedCategory) {
      showToast(isEn ? 'Please select category' : 'Vui lòng chọn danh mục');
      return;
    }

    if (isNaN(numericAmount) || numericAmount < 10000) {
      setAmountError(isEn ? 'Minimum amount is 10,000 VND' : 'Hạn mức tối thiểu là 10.000đ');
      return;
    }

    try {
      setIsSubmitting(true);
      await budgetApi.updateBudget(Number(id), {
        name: name.trim(),
        amount: numericAmount,
      });

      showToast(isEn ? 'Budget updated successfully!' : 'Cập nhật ngân sách thành công!');
      setTimeout(() => {
        router.back();
      }, 1200);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || (isEn ? 'Could not update budget' : 'Không thể cập nhật ngân sách');
      Alert.alert(isEn ? 'Error' : 'Lỗi', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingInitial) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.bg} />
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back-outline" size={22} color={theme.isDark ? theme.textPrimary : '#7C3AED'} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: theme.isDark ? theme.textPrimary : PASTEL_PALETTE.title }]}>
              {isEn ? 'Edit Budget' : 'Chỉnh sửa ngân sách'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.isDark ? theme.textSecondary : PASTEL_PALETTE.subtitle }]}>
              {isEn ? 'Update spending limits' : 'Cập nhật hạn mức chi tiêu'}
            </Text>
          </View>
        </View>
      </PastelHeaderShell>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
            {/* Budget Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>{isEn ? 'Budget Name *' : 'Tên ngân sách *'}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                placeholder={isEn ? 'e.g. Monthly Dining...' : 'Ví dụ: Ăn uống tháng này...'}
                placeholderTextColor={theme.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Category Select */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>{isEn ? 'Category *' : 'Danh mục *'}</Text>
              <TouchableOpacity
                style={[styles.selectBtn, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
                onPress={() => setIsCategoryModalVisible(true)}
                activeOpacity={0.8}
              >
                {selectedCategory ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name={(selectedCategory.icon as any) || 'folder'} size={20} color={selectedCategory.color || theme.primary} />
                    <Text style={[styles.selectBtnText, { color: theme.textPrimary }]}>{selectedCategory.label}</Text>
                  </View>
                ) : (
                  <Text style={[styles.selectPlaceholder, { color: theme.textMuted }]}>{isEn ? 'Select category' : 'Chọn danh mục'}</Text>
                )}
                <Ionicons name="chevron-down" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Budget Amount */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>{isEn ? 'Amount (VND) *' : 'Số tiền ngân sách (đ) *'}</Text>
              <View style={[styles.amountWrap, { backgroundColor: theme.inputBg, borderColor: amountError ? '#EF4444' : theme.inputBorder }]}>
                <TextInput
                  style={[styles.amountInput, { color: theme.inputText }]}
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={handleAmountChange}
                />
                <Text style={[styles.currencyText, { color: theme.primary }]}>đ</Text>
              </View>
              {amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>{isEn ? 'Save Changes' : 'Lưu thay đổi'}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast visible={toast.visible} message={toast.message} onClose={() => setToast({ visible: false, message: '' })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  titleContainer: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  selectBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  selectPlaceholder: {
    fontSize: 15,
  },
  amountWrap: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  submitButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
