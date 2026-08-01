import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';
import {
  FUND_DEPOSIT_CATEGORY_ID,
  FUND_WITHDRAW_CATEGORY_ID,
} from '../../../../shared/constants/defaultCategories';
import { CategorySelectModal } from '../../../categories/components/CategorySelectModal';
import { AddCategoryModal } from '../../../categories/components/AddCategoryModal';
import { styles } from './AddCashBalanceModal.styles';

export type CashBalanceMode = 'add' | 'spend';

export type CashCategory = {
  id: string | number;
  label: string;
  icon: string;
  color: string;
  bgColor?: string;
  groupName?: string;
};

export type CashBalancePayload = {
  amount: number;
  note?: string;
  category: CashCategory;
};

export type InitialCashData = {
  transactionCode: string;
  amount: number;
  note?: string;
  category: CashCategory;
};

type Props = {
  visible: boolean;
  mode: CashBalanceMode;
  currentBalance?: number;
  saving?: boolean;
  initialData?: InitialCashData;
  onClose: () => void;
  onConfirm: (payload: CashBalancePayload) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
};

/** form = sheet tiền mặt | select = chọn DM | create = tạo DM/nhóm | wait = chờ animation Modal */
type FlowStep = 'form' | 'select' | 'create' | 'wait';

const MODAL_SWITCH_MS = 350;
/** Giới hạn ngắn để 1 dòng lịch sử sổ tay gọn, đẹp */
export const MAX_CASH_NOTE_LENGTH = 40;

const parseAmount = (raw: string) => {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number(digits);
};

const formatInput = (raw: string) => {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('vi-VN');
};

const isFundSystemCategory = (id: string | number) => {
  const key = String(id);
  return key === FUND_DEPOSIT_CATEGORY_ID || key === FUND_WITHDRAW_CATEGORY_ID;
};

export const AddCashBalanceModal = ({
  visible,
  mode,
  currentBalance = 0,
  saving = false,
  initialData,
  onClose,
  onConfirm,
  onDelete,
}: Props) => {
  const insets = useSafeAreaInsets();
  const switchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<CashCategory | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<FlowStep>('form');
  const [focusedInput, setFocusedInput] = useState<'amount' | 'note' | null>(null);

  const amountRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);

  const isSpend = mode === 'spend';
  const isEditMode = !!initialData;

  const clearSwitchTimer = () => {
    if (switchTimerRef.current) {
      clearTimeout(switchTimerRef.current);
      switchTimerRef.current = null;
    }
  };

  const goToStepAfterClose = (next: FlowStep) => {
    clearSwitchTimer();
    setStep('wait');
    switchTimerRef.current = setTimeout(() => {
      setStep(next);
      switchTimerRef.current = null;
    }, MODAL_SWITCH_MS);
  };

  useEffect(() => {
    if (!visible) {
      clearSwitchTimer();
      setStep('form');
      return;
    }
    if (initialData) {
      setAmountText(formatInput(initialData.amount.toString()));
      setNote(initialData.note || '');
      setCategory(initialData.category);
    } else {
      setAmountText('');
      setNote('');
      setCategory(null);
    }
    setError('');
    setStep('form');
  }, [visible, mode, initialData]);

  useEffect(() => () => clearSwitchTimer(), []);

  const handleConfirm = async () => {
    const amount = parseAmount(amountText);
    if (amount <= 0) {
      setError('Vui lòng nhập số tiền lớn hơn 0');
      return;
    }
    if (isSpend && amount > currentBalance) {
      setError('Số dư không đủ');
      return;
    }
    if (!category) {
      setError('Vui lòng chọn danh mục');
      return;
    }
    try {
      await onConfirm({
        amount,
        note: note.trim() || undefined,
        category,
      });
      onClose();
    } catch {
      // Parent shows Alert; keep modal open
    }
  };

  return (
    <>
      <Modal
        visible={visible && step === 'form'}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardWrap}
          >
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <View style={styles.headerTitleWrap}>
                  <View style={[styles.iconWrap, isSpend && { backgroundColor: '#FEE2E2' }]}>
                    <MaterialCommunityIcons 
                      name={isSpend ? "minus-circle-outline" : "plus-circle-outline"} 
                      size={24} 
                      color={isSpend ? '#DC2626' : PASTEL_PALETTE.accentDeep} 
                    />
                  </View>
                  <Text style={styles.title}>
                    {isEditMode ? (isSpend ? 'Sửa Chi tiêu' : 'Sửa Thu nhập') : (isSpend ? 'Chi tiêu' : 'Thu nhập')}
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.75}>
                  <MaterialCommunityIcons name="close" size={24} color={PASTEL_PALETTE.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <Text style={styles.hint}>
                  {isSpend
                    ? 'Trừ tiền khỏi sổ tay và gắn danh mục chi tiêu.'
                    : 'Cộng tiền vào sổ tay và gắn danh mục thu nhập.'}
                </Text>

                <Text style={styles.label}>Số tiền</Text>
                <View style={[styles.amountInputContainer, focusedInput === 'amount' && styles.amountInputContainerFocused, !!error && styles.amountInputContainerError]}>
                  <TextInput
                    ref={amountRef}
                    style={[styles.amountInputText, { color: isSpend ? '#DC2626' : PASTEL_PALETTE.accentDeep }]}
                    placeholder="0"
                    placeholderTextColor={PASTEL_PALETTE.gray400}
                    keyboardType="numeric"
                    value={amountText}
                    onKeyPress={(e) => {
                      if (e.nativeEvent.key === '0' && !amountText) {
                        e.preventDefault();
                      }
                    }}
                    onFocus={() => setFocusedInput('amount')}
                    onBlur={() => setFocusedInput(null)}
                    onChangeText={(t) => {
                      setAmountText(formatInput(t));
                      if (error) setError('');
                    }}
                  />
                  <Text style={[styles.currencySuffix, { color: isSpend ? '#DC2626' : PASTEL_PALETTE.accentDeep }]}>đ</Text>
                </View>

              <Text style={[styles.label, { marginTop: 14 }]}>Chọn danh mục</Text>
              <TouchableOpacity
                style={styles.selectInput}
                activeOpacity={0.7}
                onPress={() => setStep('select')}
              >
                {category ? (
                  <View style={styles.selectedCategory}>
                    <View style={[styles.smallIconContainer, { backgroundColor: category.bgColor || `${category.color}22` }]}>
                      <Ionicons name={category.icon as any} size={16} color={category.color || PASTEL_PALETTE.accentDeep} />
                    </View>
                    <Text style={styles.selectTextValue}>{category.label}</Text>
                  </View>
                ) : (
                  <Text style={styles.selectTextPlaceholder}>Chọn danh mục...</Text>
                )}
                <Ionicons name="chevron-down" size={20} color={PASTEL_PALETTE.textMuted} />
              </TouchableOpacity>

              <View style={styles.labelRow}>
                <Text style={[styles.label, { marginTop: 14, marginBottom: 0 }]}>
                  Ghi chú (tuỳ chọn)
                </Text>
                <Text
                  style={[
                    styles.charCount,
                    note.length >= MAX_CASH_NOTE_LENGTH && styles.charCountLimit,
                  ]}
                >
                  {note.length}/{MAX_CASH_NOTE_LENGTH}
                </Text>
              </View>
                <Pressable 
                  style={[styles.inputWrap, focusedInput === 'note' && styles.inputFocused]}
                  onPress={() => noteRef.current?.focus()}
                >
                  <Feather name="edit-3" size={16} color={focusedInput === 'note' ? PASTEL_PALETTE.accentDeep : PASTEL_PALETTE.textMuted} />
                  <TextInput
                    ref={noteRef}
                    style={styles.input}
                    placeholder={isSpend ? 'Chi tiêu, đưa tiền...' : 'Số dư đầu kỳ, tiền rút mặt...'}
                    placeholderTextColor={PASTEL_PALETTE.textMuted}
                    value={note}
                    onFocus={() => setFocusedInput('note')}
                    onBlur={() => setFocusedInput(null)}
                    onChangeText={(t) => setNote(t.slice(0, MAX_CASH_NOTE_LENGTH))}
                    maxLength={MAX_CASH_NOTE_LENGTH}
                  />
                </Pressable>

              {!!error && <Text style={styles.error}>{error}</Text>}

              <TouchableOpacity
                style={[styles.primaryBtn, isSpend && styles.primaryBtnSpend, saving && { opacity: 0.7 }]}
                activeOpacity={0.8}
                disabled={saving}
                onPress={handleConfirm}
              >
                {saving ? (
                  <ActivityIndicator color={PASTEL_PALETTE.white} />
                ) : (
                  <>
                    <MaterialCommunityIcons 
                      name={isEditMode ? "content-save" : (isSpend ? "minus-circle" : "plus-circle")} 
                      size={20} 
                      color={PASTEL_PALETTE.white} 
                    />
                    <Text style={styles.primaryBtnText}>
                      {isEditMode ? 'Lưu thay đổi' : (isSpend ? 'Trừ khỏi sổ tay' : 'Cộng vào sổ tay')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {isEditMode && onDelete && (
                <TouchableOpacity
                  style={{
                    marginTop: 16,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 14,
                    backgroundColor: '#FEF2F2',
                    borderWidth: 1,
                    borderColor: '#FCA5A5'
                  }}
                  activeOpacity={0.8}
                  disabled={saving}
                  onPress={onDelete}
                >
                  <Text style={{ color: '#DC2626', fontSize: 16, fontWeight: '600' }}>
                    Xóa giao dịch
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>

      <CategorySelectModal
        visible={visible && step === 'select'}
        onClose={() => setStep('form')}
        onSelect={(item, groupName) => {
          if (isFundSystemCategory(item.id)) {
            setError('Danh mục quỹ không dùng cho sổ tay');
            setStep('form');
            return;
          }
          setCategory({
            id: item.id,
            label: item.label,
            icon: item.icon,
            color: item.color,
            bgColor: item.bgColor,
            groupName,
          });
          setError('');
          setStep('form');
        }}
        onAddCategory={() => goToStepAfterClose('create')}
      />

      <AddCategoryModal
        visible={visible && step === 'create'}
        onClose={() => setStep('form')}
        onBack={() => goToStepAfterClose('select')}
      />
    </>
  );
};

export default AddCashBalanceModal;
