import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Platform, KeyboardAvoidingView, Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { BudgetItem } from '../../../shared/contexts/BudgetContext';
import { useCategoryContext } from '../../../shared/contexts/CategoryContext';
import Colors from '../../../shared/constants/Colors';

interface BudgetFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<BudgetItem, 'id'>) => void;
  editingBudget?: BudgetItem | null;
  currentMonth: string;
  existingCategoryIds: string[];
  onDelete?: (id: string) => void;
}

const formatNumber = (num: string): string => {
  const cleaned = num.replace(/\D/g, '');
  if (!cleaned) return '';
  return parseInt(cleaned, 10).toLocaleString('vi-VN');
};

const parseNumber = (formatted: string): number => {
  return parseInt(formatted.replace(/\D/g, ''), 10) || 0;
};

const QUICK_AMOUNTS = [500000, 1000000, 2000000, 5000000];

const BudgetFormModal: React.FC<BudgetFormModalProps> = ({
  visible, onClose, onSave, editingBudget, currentMonth, existingCategoryIds, onDelete
}) => {
  const { categories } = useCategoryContext();

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedItem, setSelectedItem] = useState<{ id: string; label: string; icon: string; color: string; bgColor: string } | null>(null);
  const [limitText, setLimitText] = useState('');
  const [step, setStep] = useState<'category' | 'amount'>('category');

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  const allItems = categories.flatMap(g =>
    g.items.map(item => ({ ...item, groupTitle: g.title }))
  );

  const availableItems = editingBudget
    ? allItems
    : allItems.filter(item => !existingCategoryIds.includes(item.id));

  useEffect(() => {
    if (visible) {
      if (editingBudget) {
        // Dùng thẳng data từ editingBudget, không cần tìm trong allItems
        // (tránh lỗi khi categories chưa load xong)
        setSelectedItem({
          id: editingBudget.categoryId,
          label: editingBudget.categoryLabel,
          icon: editingBudget.categoryIcon,
          color: editingBudget.categoryColor,
          bgColor: editingBudget.categoryBgColor,
        });
        setSelectedCategoryId(editingBudget.categoryId);
        setLimitText(editingBudget.limit.toLocaleString('vi-VN'));
        setStartDate(new Date(editingBudget.startDate + 'T00:00:00'));
        setEndDate(new Date(editingBudget.endDate + 'T00:00:00'));
        setStep('amount');
      } else {
        setSelectedItem(null);
        setSelectedCategoryId('');
        setLimitText('');
        
        const [y, m] = currentMonth.split('-');
        const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
        setStartDate(new Date(`${currentMonth}-01T00:00:00`));
        setEndDate(new Date(`${currentMonth}-${String(lastDay).padStart(2, '0')}T00:00:00`));

        setStep('category');
      }
    }
  }, [visible, editingBudget, currentMonth]);

  const handleSelectItem = (item: typeof allItems[0]) => {
    setSelectedItem({ id: item.id, label: item.label, icon: item.icon, color: item.color, bgColor: item.bgColor });
    setSelectedCategoryId(item.id);
    setStep('amount');
  };

  const handleSave = () => {
    if (!selectedItem) return;
    const limit = parseNumber(limitText);
    if (limit <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền ngân sách hợp lệ!');
      return;
    }

    // Kiểm tra ngày bắt đầu không được ở trong quá khứ (chỉ ở màn hình tạo mới)
    if (!editingBudget) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        Alert.alert('Lỗi', 'Ngày bắt đầu không được ở trong quá khứ!');
        return;
      }
    }

    if (startDate > endDate) {
      Alert.alert('Lỗi', 'Ngày kết thúc phải sau ngày bắt đầu!');
      return;
    }
    onSave({
      categoryId: selectedItem.id,
      categoryLabel: selectedItem.label,
      categoryIcon: selectedItem.icon,
      categoryColor: selectedItem.color,
      categoryBgColor: selectedItem.bgColor,
      limit,
      spent: editingBudget?.spent ?? 0,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
    onClose();
  };

  const monthLabel = (() => {
    const [y, m] = currentMonth.split('-');
    return `Tháng ${parseInt(m)}/${y}`;
  })();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            {step === 'amount' && !editingBudget ? (
              <TouchableOpacity onPress={() => setStep('category')} style={styles.navBtn}>
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            ) : <View style={{ width: 36 }} />}
            <Text style={styles.headerTitle}>
              {editingBudget ? 'Sửa ngân sách' : 'Thêm ngân sách'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.navBtn}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Month label */}
          {step === 'category' && (
            <View style={styles.monthBadge}>
              <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
              <Text style={styles.monthBadgeText}>{monthLabel}</Text>
            </View>
          )}

          {step === 'category' ? (
            /* === STEP 1: Chọn danh mục === */
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <Text style={styles.stepTitle}>Chọn danh mục</Text>
              {categories.map(group => {
                const groupAvailableItems = group.items.filter(item =>
                  !existingCategoryIds.includes(item.id)
                );
                if (groupAvailableItems.length === 0) return null;
                return (
                  <View key={group.id} style={styles.groupSection}>
                    <Text style={styles.groupTitle}>{group.title}</Text>
                    {groupAvailableItems.map(item => (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.categoryRow, selectedCategoryId === item.id && styles.categoryRowSelected]}
                        onPress={() => handleSelectItem({ ...item, groupTitle: group.title })}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.catIcon, { backgroundColor: item.bgColor }]}>
                          <Ionicons name={item.icon as any} size={20} color={item.color} />
                        </View>
                        <Text style={styles.catLabel}>{item.label}</Text>
                        {selectedCategoryId === item.id && (
                          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
              {availableItems.length === 0 && (
                <View style={styles.noItemsContainer}>
                  <Text style={styles.noItemsText}>Tất cả danh mục đã có ngân sách trong tháng này.</Text>
                </View>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          ) : (
            /* === STEP 2: Nhập số tiền === */
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.stepTitle}>Đặt giới hạn ngân sách</Text>

              {/* Selected category preview */}
              {selectedItem && (
                <View style={styles.selectedPreview}>
                  <View style={[styles.catIcon, { backgroundColor: selectedItem.bgColor }]}>
                    <Ionicons name={selectedItem.icon as any} size={20} color={selectedItem.color} />
                  </View>
                  <Text style={styles.selectedPreviewLabel}>{selectedItem.label}</Text>
                </View>
              )}

              {/* Amount input */}
              <Text style={styles.inputLabel}>Số tiền giới hạn (đ)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.amountInput}
                  value={limitText}
                  onChangeText={(text) => setLimitText(formatNumber(text))}
                  keyboardType="numeric"
                  placeholder="Nhập số tiền..."
                  placeholderTextColor={Colors.textMuted}
                />
                {limitText.length > 0 && (
                  <TouchableOpacity onPress={() => setLimitText('')} style={styles.clearBtn}>
                    <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Quick amounts */}
              <Text style={styles.quickLabel}>Chọn nhanh</Text>
              <View style={styles.quickGrid}>
                {QUICK_AMOUNTS.map(amount => (
                  <TouchableOpacity
                    key={amount}
                    style={[styles.quickChip, limitText === amount.toLocaleString('vi-VN') && styles.quickChipSelected]}
                    onPress={() => setLimitText(amount.toLocaleString('vi-VN'))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quickChipText, limitText === amount.toLocaleString('vi-VN') && styles.quickChipTextSelected]}>
                      {amount.toLocaleString('vi-VN')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date selection */}
              <Text style={[styles.inputLabel, { marginTop: 24 }]}>Thời gian áp dụng</Text>
              <View style={styles.dateContainer}>
                <View style={styles.datePickerWrapper}>
                  <Text style={styles.dateLabel}>Từ ngày</Text>
                  <TouchableOpacity 
                    style={styles.dateBtn} 
                    onPress={() => setShowPicker('start')}
                  >
                    <Ionicons name="calendar-outline" size={18} color={Colors.text} />
                    <Text style={styles.dateText}>
                      {startDate.toLocaleDateString('vi-VN')}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerWrapper}>
                  <Text style={styles.dateLabel}>Đến ngày</Text>
                  <TouchableOpacity 
                    style={styles.dateBtn} 
                    onPress={() => setShowPicker('end')}
                  >
                    <Ionicons name="calendar-outline" size={18} color={Colors.text} />
                    <Text style={styles.dateText}>
                      {endDate.toLocaleDateString('vi-VN')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showPicker && (
                <DateTimePicker
                  value={showPicker === 'start' ? startDate : endDate}
                  mode="date"
                  display="default"
                  minimumDate={!editingBudget ? (showPicker === 'start' ? new Date() : startDate) : undefined}
                  onChange={(event, date) => {
                    if (Platform.OS === 'android') {
                      setShowPicker(null);
                    }
                    if (date) {
                      if (showPicker === 'start') {
                        setStartDate(date);
                        // Nếu ngày bắt đầu mới sau ngày kết thúc hiện tại, tự điều chỉnh ngày kết thúc
                        if (date > endDate) setEndDate(date);
                      } else {
                        setEndDate(date);
                      }
                    }
                  }}
                />
              )}
              {Platform.OS === 'ios' && showPicker && (
                <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 10, padding: 8 }} onPress={() => setShowPicker(null)}>
                  <Text style={{ color: Colors.primary, fontWeight: '600' }}>Xong</Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {/* Footer button */}
          {step === 'amount' && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.saveBtn, (!limitText || parseNumber(limitText) === 0) && styles.saveBtnDisabled]}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={!limitText || parseNumber(limitText) === 0}
              >
                <Ionicons name={editingBudget ? 'checkmark' : 'add'} size={20} color="#FFF" />
                <Text style={styles.saveBtnText}>{editingBudget ? 'Cập nhật ngân sách' : 'Thêm ngân sách'}</Text>
              </TouchableOpacity>
              
              {editingBudget && onDelete && (
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.error, marginTop: 12 }]}
                  onPress={() => {
                    Alert.alert(
                      'Xóa ngân sách',
                      `Bạn có chắc muốn xóa ngân sách "${editingBudget.categoryLabel}"?`,
                      [
                        { text: 'Hủy', style: 'cancel' },
                        { 
                          text: 'Xóa', 
                          style: 'destructive', 
                          onPress: () => {
                            onDelete(editingBudget.id);
                            onClose();
                          } 
                        },
                      ]
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  <Text style={[styles.saveBtnText, { color: Colors.error }]}>Xóa ngân sách</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  monthBadgeText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 12,
    marginBottom: 12,
  },
  groupSection: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  catIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  selectedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  selectedPreviewLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    paddingVertical: 14,
  },
  clearBtn: {
    padding: 4,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  quickChipTextSelected: {
    color: '#FFFFFF',
  },
  noItemsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noItemsText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerWrapper: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
});

export default BudgetFormModal;
