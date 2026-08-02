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
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
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

type Props = {
  visible: boolean;
  mode: CashBalanceMode;
  currentBalance?: number;
  saving?: boolean;
  onClose: () => void;
  onConfirm: (payload: CashBalancePayload) => void | Promise<void>;
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
  onClose,
  onConfirm,
}: Props) => {
  const insets = useSafeAreaInsets();
  const switchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<CashCategory | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<FlowStep>('form');

  const isSpend = mode === 'spend';

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
    setAmountText('');
    setNote('');
    setCategory(null);
    setError('');
    setStep('form');
  }, [visible, mode]);

  useEffect(() => () => clearSwitchTimer(), []);

  const handleConfirm = async () => {
    const amount = parseAmount(amountText);
    if (amount <= 0) {
      setError('Vui lòng nhập số tiền lớn hơn 0');
      return;
    }
    if (isSpend && amount > currentBalance) {
      setError('Số dư tiền mặt không đủ');
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
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
          >
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title}>
                {isSpend ? 'Chi số dư tiền mặt' : 'Thêm số dư tiền mặt'}
              </Text>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.75}>
                <Feather name="x" size={18} color={PASTEL_PALETTE.title} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Text style={styles.hint}>
                {isSpend
                  ? 'Trừ tiền mặt khỏi sổ tay và gắn danh mục chi tiêu.'
                  : 'Cộng tiền mặt vào sổ tay và gắn danh mục thu nhập.'}
              </Text>

              <Text style={styles.label}>Số tiền</Text>
              <View style={styles.inputWrap}>
                <Feather name="dollar-sign" size={16} color={PASTEL_PALETTE.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={PASTEL_PALETTE.textMuted}
                  keyboardType="number-pad"
                  value={amountText}
                  onChangeText={(t) => {
                    setAmountText(formatInput(t));
                    if (error) setError('');
                  }}
                />
                <Text style={styles.suffix}>₫</Text>
              </View>

              <Text style={[styles.label, { marginTop: 14 }]}>Chọn danh mục</Text>
              <TouchableOpacity
                style={[styles.categoryCard, !category && styles.categoryCardEmpty]}
                activeOpacity={0.85}
                onPress={() => setStep('select')}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    category
                      ? { backgroundColor: category.bgColor || `${category.color}22` }
                      : styles.categoryIconEmpty,
                  ]}
                >
                  <Ionicons
                    name={(category?.icon as any) || 'pricetag-outline'}
                    size={22}
                    color={category?.color || PASTEL_PALETTE.textMuted}
                  />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryTitle, !category && styles.categoryTitleEmpty]}>
                    {category ? category.label : 'Chưa chọn danh mục'}
                  </Text>
                  {category ? (
                    <Text style={styles.categoryHint}>{category.groupName || 'Danh mục'}</Text>
                  ) : (
                    <Text style={styles.categoryHint}>Nhấn để phân loại giao dịch</Text>
                  )}
                </View>
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
              <View style={styles.inputWrap}>
                <Feather name="edit-3" size={16} color={PASTEL_PALETTE.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder={isSpend ? 'Chi tiêu, đưa tiền...' : 'Số dư đầu kỳ, tiền rút mặt...'}
                  placeholderTextColor={PASTEL_PALETTE.textMuted}
                  value={note}
                  onChangeText={(t) => setNote(t.slice(0, MAX_CASH_NOTE_LENGTH))}
                  maxLength={MAX_CASH_NOTE_LENGTH}
                />
              </View>

              {!!error && <Text style={styles.error}>{error}</Text>}

              <TouchableOpacity
                style={[styles.primaryBtn, isSpend && styles.primaryBtnSpend, saving && { opacity: 0.7 }]}
                activeOpacity={0.85}
                disabled={saving}
                onPress={handleConfirm}
              >
                <Text style={styles.primaryBtnText}>
                  {saving
                    ? 'Đang lưu...'
                    : isSpend
                      ? 'Trừ khỏi sổ tay'
                      : 'Cộng vào sổ tay'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <CategorySelectModal
        visible={visible && step === 'select'}
        onClose={() => setStep('form')}
        onSelect={(item, groupName) => {
          if (isFundSystemCategory(item.id)) {
            setError('Danh mục quỹ không dùng cho sổ tay tiền mặt');
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
