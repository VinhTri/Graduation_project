import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StatusBar, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { CharacterCounter } from '@/shared/components/CharacterCounter/CharacterCounter';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FundHeaderShell, FundTransferFlow } from '../../components';
import { PinModal, SuccessModal } from '../../../../shared/components';
import { fundStore, useFund } from '../../store/fundStore';
import { walletService } from '../../../../shared/api/services/walletService';
import { FUND_PALETTE } from '../../theme';
import { createFundRequestId, formatCompactCurrency, formatCurrency, parseAmountInput } from '../../utils';
import { styles } from './WithdrawScreen.styles';

const MIN_WITHDRAW = 10_000;

export function WithdrawScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const fund = useFund(Number(id));

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pinVisible, setPinVisible] = useState(false);
  const [pinError, setPinError] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const requestIdRef = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fundStore.refreshFund(Number(id)).catch(() => {});
      walletService.getMyWallet()
        .then((w) => setWalletBalance(Number(w.balance) || 0))
        .catch(() => setWalletBalance(0));
    }, [id])
  );

  const fundBalance = fund?.balance || 0;
  const parsedAmount = amount ? parseInt(amount, 10) : 0;
  const isValid = parsedAmount >= MIN_WITHDRAW && parsedAmount <= fundBalance && !submitting;

  const quickAmounts = [100_000, 200_000, 500_000, 1_000_000, 2_000_000]
    .filter((a) => a <= fundBalance);

  // Chỉ chủ quỹ mới được rút tiền
  if (fund && !fund.isOwner) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFD6EC" />
        <Ionicons name="lock-closed" size={40} color={FUND_PALETTE.textMuted} />
        <Text style={styles.notAllowedTitle}>Không thể rút tiền</Text>
        <Text style={styles.notAllowedText}>
          Chỉ chủ quỹ mới có quyền rút tiền khỏi quỹ. Bạn chỉ có thể nạp tiền vào quỹ này.
        </Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.backLinkText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleConfirm = () => {
    if (parsedAmount < MIN_WITHDRAW) {
      Alert.alert('Lỗi', `Số tiền rút tối thiểu là ${formatCurrency(MIN_WITHDRAW)}đ`);
      return;
    }
    if (parsedAmount > fundBalance) {
      Alert.alert('Lỗi', 'Số dư quỹ không đủ để rút');
      return;
    }
    setPinError('');
    requestIdRef.current = createFundRequestId();
    setPinVisible(true);
  };

  const handlePinConfirm = async (pin: string) => {
    try {
      setSubmitting(true);
      setPinError('');
      await fundStore.withdraw(Number(id), parsedAmount, pin, note.trim() || undefined, requestIdRef.current || undefined);
      setPinVisible(false);
      setSuccessVisible(true);
    } catch (err: any) {
      setPinError(err?.message || 'Rút tiền thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFD6EC" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FundHeaderShell contentStyle={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
                <Ionicons name="chevron-back-outline" size={24} color="#7C3AED" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Rút tiền từ quỹ</Text>
            </View>
          </View>

          {/* Quỹ → Ví */}
          <FundTransferFlow
            direction="withdraw"
            from={{
              kind: 'fund',
              name: fund?.name || 'Quỹ',
              balance: fundBalance,
              colorSeed: fund?.coverColorSeed ?? 0,
            }}
            to={{
              kind: 'wallet',
              name: 'SmartSpend',
              balance: walletBalance,
            }}
          />
        </FundHeaderShell>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Amount input */}
          <View style={styles.amountCard}>
            <View style={styles.amountLabelRow}>
              <Text style={styles.amountLabel}>Số tiền muốn rút</Text>
              <TouchableOpacity
                style={styles.withdrawAllBtn}
                onPress={() => setAmount(String(fundBalance))}
                activeOpacity={0.85}
              >
                <Text style={styles.withdrawAllText}>Rút toàn bộ</Text>
              </TouchableOpacity>
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
                      {formatCompactCurrency(amt)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Note */}
          <Text style={styles.sectionLabel}>Lý do rút (tuỳ chọn)</Text>
          <View style={styles.noteWrap}>
            <Feather name="message-square" size={18} color={FUND_PALETTE.textMuted} style={{ marginTop: 2 }} />
            <TextInput
              style={styles.noteInput}
              placeholder="VD: Thanh toán đặt cọc khách sạn..."
              placeholderTextColor="#9CA3AF"
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={100}
            />
          </View>
          <CharacterCounter value={note} maxLength={100} />

          <View style={styles.securityRow}>
            <Ionicons name="shield-checkmark" size={20} color={FUND_PALETTE.primaryDeep} />
            <Text style={styles.securityText}>
              Giao dịch được bảo vệ bằng mã PIN. Tiền sẽ trừ khỏi quỹ và cộng về ví của bạn.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.footerAmount}>
            <Text style={styles.footerLabel}>Số tiền rút</Text>
            <Text style={styles.footerValue}>{formatCurrency(parsedAmount)} ₫</Text>
          </View>
          <TouchableOpacity
            style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
            disabled={!isValid}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>Xác nhận rút</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <PinModal
        visible={pinVisible}
        onClose={() => setPinVisible(false)}
        onConfirm={handlePinConfirm}
        errorMessage={pinError}
      />

      <SuccessModal
        visible={successVisible}
        variant="pastel"
        title="Rút tiền thành công"
        message={`Bạn đã rút ${formatCurrency(parsedAmount)} ₫ từ "${fund?.name || 'quỹ'}" về ví.`}
        onClose={() => {
          setSuccessVisible(false);
          router.back();
        }}
      />
    </View>
  );
}
