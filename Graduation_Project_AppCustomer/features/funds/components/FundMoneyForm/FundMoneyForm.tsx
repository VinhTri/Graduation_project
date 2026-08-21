import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { PinModal } from '../../../../shared/components';
import { useToast } from '../../../../shared/components/Toast';
import { fundStore } from '../../store/fundStore';
import { FUND_PALETTE } from '../../theme';
import { formatCurrency, parseAmountInput } from '../../utils';
import type { Fund } from '../../types';

const DEPOSIT_QUICK = [50_000, 100_000, 200_000, 500_000, 1_000_000];
const MIN_WITHDRAW = 10_000;

type Props = {
  mode: 'deposit' | 'withdraw';
  fund: Fund;
  walletBalance: number;
  minDeposit: number;
  onCompleted?: () => void;
};

export function FundMoneyForm({ mode, fund, walletBalance, minDeposit, onCompleted }: Props) {
  const isDeposit = mode === 'deposit';
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pinVisible, setPinVisible] = useState(false);
  const [pinError, setPinError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const parsedAmount = amount ? parseInt(amount, 10) : 0;
  const fundBalance = fund.balance || 0;
  const minAmount = isDeposit ? minDeposit : MIN_WITHDRAW;
  const maxAmount = isDeposit ? walletBalance : fundBalance;
  const isValid = parsedAmount >= minAmount && parsedAmount <= maxAmount && !submitting;
  const quickAmounts = (isDeposit ? DEPOSIT_QUICK : [100_000, 200_000, 500_000, 1_000_000])
    .filter((a) => a <= maxAmount);

  const handleConfirm = () => {
    if (parsedAmount < minAmount) {
      Alert.alert(
        'Lỗi',
        isDeposit
          ? `Số tiền nạp tối thiểu của quỹ này là ${formatCurrency(minAmount)}đ`
          : `Số tiền rút tối thiểu là ${formatCurrency(minAmount)}đ`,
      );
      return;
    }
    if (parsedAmount > maxAmount) {
      Alert.alert('Lỗi', isDeposit ? 'Số dư ví không đủ để nạp vào quỹ' : 'Số dư quỹ không đủ để rút');
      return;
    }
    setPinError('');
    setPinVisible(true);
  };

  const handlePinConfirm = async (pin: string) => {
    try {
      setSubmitting(true);
      setPinError('');
      if (isDeposit) {
        await fundStore.deposit(fund.id, parsedAmount, pin, note.trim() || undefined);
      } else {
        await fundStore.withdraw(fund.id, parsedAmount, pin, note.trim() || undefined);
      }
      setPinVisible(false);
      showToast({
        variant: 'success',
        message: isDeposit
          ? `Đã nạp ${formatCurrency(parsedAmount)} ₫ vào "${fund.name}"`
          : `Đã rút ${formatCurrency(parsedAmount)} ₫ từ "${fund.name}" về ví`,
      });
      setAmount('');
      setNote('');
      onCompleted?.();
    } catch (err: any) {
      setPinError(err?.message || (isDeposit ? 'Nạp tiền thất bại' : 'Rút tiền thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <View style={styles.flowHint}>
        <Text style={styles.flowHintText}>
          {isDeposit
            ? `Từ ví SmartSpend (${formatCurrency(walletBalance)} ₫)`
            : `Từ quỹ (${formatCurrency(fundBalance)} ₫)`}
        </Text>
        <Feather name="arrow-right" size={14} color={FUND_PALETTE.primaryDeep} />
        <Text style={styles.flowHintText}>
          {isDeposit
            ? `Quỹ ${formatCurrency(fundBalance)} ₫`
            : `Ví SmartSpend (${formatCurrency(walletBalance)} ₫)`}
        </Text>
      </View>

      <View style={styles.amountCard}>
        <View style={styles.amountLabelRow}>
          <Text style={styles.amountLabel}>{isDeposit ? 'Số tiền muốn nạp' : 'Số tiền muốn rút'}</Text>
          {!isDeposit && fundBalance > 0 && (
            <TouchableOpacity
              style={styles.withdrawAllBtn}
              onPress={() => setAmount(String(Math.floor(fundBalance)))}
              activeOpacity={0.85}
            >
              <Text style={styles.withdrawAllText}>Rút toàn bộ</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.amountRow}>
          <TextInput
            style={styles.amountInput}
            keyboardType="numeric"
            value={amount ? formatCurrency(parseInt(amount, 10)) : ''}
            onChangeText={(t) => setAmount(parseAmountInput(t))}
            placeholder="0"
            placeholderTextColor="#D1D5DB"
            maxLength={14}
          />
          <Text style={styles.currency}>₫</Text>
        </View>
        {quickAmounts.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRow}
          >
            {quickAmounts.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[styles.quickChip, parsedAmount === amt && styles.quickChipActive]}
                onPress={() => setAmount(amt.toString())}
                activeOpacity={0.85}
              >
                <Text style={[styles.quickChipText, parsedAmount === amt && styles.quickChipTextActive]}>
                  {formatCurrency(amt)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <Text style={styles.sectionLabel}>{isDeposit ? 'Lời nhắn (tuỳ chọn)' : 'Lý do rút (tuỳ chọn)'}</Text>
      <View style={styles.noteWrap}>
        <Feather name="message-square" size={18} color={FUND_PALETTE.textMuted} style={{ marginTop: 2 }} />
        <TextInput
          style={styles.noteInput}
          placeholder={isDeposit ? 'VD: Góp tiền đợt 1...' : 'VD: Thanh toán đặt cọc...'}
          placeholderTextColor="#9CA3AF"
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={100}
        />
      </View>

      <View style={styles.securityRow}>
        <Ionicons name="shield-checkmark" size={18} color={FUND_PALETTE.primaryDeep} />
        <Text style={styles.securityText}>
          {isDeposit
            ? 'Tiền sẽ trừ từ ví và cộng vào quỹ sau khi xác nhận PIN.'
            : 'Tiền sẽ trừ khỏi quỹ và cộng về ví sau khi xác nhận PIN.'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
        disabled={!isValid}
        onPress={handleConfirm}
        activeOpacity={0.85}
      >
        <Text style={styles.submitBtnText}>
          {isDeposit
            ? `Xác nhận nạp ${formatCurrency(parsedAmount)} ₫`
            : `Xác nhận rút ${formatCurrency(parsedAmount)} ₫`}
        </Text>
      </TouchableOpacity>

      <PinModal
        visible={pinVisible}
        onClose={() => setPinVisible(false)}
        onConfirm={handlePinConfirm}
        errorMessage={pinError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flowHint: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  flowHintText: {
    fontSize: 12,
    fontWeight: '700',
    color: FUND_PALETTE.subtitle,
  },
  amountCard: {
    backgroundColor: FUND_PALETTE.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: FUND_PALETTE.border,
  },
  amountLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 13,
    color: FUND_PALETTE.textMuted,
    fontWeight: '500',
  },
  withdrawAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: FUND_PALETTE.primarySofter,
    borderWidth: 1,
    borderColor: FUND_PALETTE.borderSoft,
  },
  withdrawAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: FUND_PALETTE.primaryDeep,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '900',
    color: FUND_PALETTE.title,
    textAlign: 'center',
    minWidth: 60,
  },
  currency: {
    fontSize: 24,
    fontWeight: '800',
    color: FUND_PALETTE.textMuted,
    marginLeft: 6,
  },
  quickRow: {
    gap: 10,
    marginTop: 14,
    paddingRight: 4,
  },
  quickChip: {
    backgroundColor: FUND_PALETTE.primarySofter,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  quickChipActive: {
    backgroundColor: FUND_PALETTE.primarySoft,
    borderColor: FUND_PALETTE.primary,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: FUND_PALETTE.primaryDeep,
  },
  quickChipTextActive: {
    color: FUND_PALETTE.primaryDark,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: FUND_PALETTE.title,
    marginTop: 16,
    marginBottom: 8,
  },
  noteWrap: {
    flexDirection: 'row',
    backgroundColor: FUND_PALETTE.white,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: FUND_PALETTE.border,
    minHeight: 56,
  },
  noteInput: {
    flex: 1,
    fontSize: 15,
    color: FUND_PALETTE.title,
    padding: 0,
  },
  securityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    alignItems: 'flex-start',
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: FUND_PALETTE.textMuted,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: 16,
    backgroundColor: FUND_PALETTE.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitBtnText: {
    color: FUND_PALETTE.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
