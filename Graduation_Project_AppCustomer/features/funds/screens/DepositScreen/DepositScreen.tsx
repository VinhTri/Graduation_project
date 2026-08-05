import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StatusBar, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FundHeaderShell, FundTransferFlow } from '../../components';
import { PinModal, SuccessModal } from '../../../../shared/components';
import { fundStore, useFund } from '../../store/fundStore';
import { walletService } from '../../../../shared/api/services/walletService';
import { FUND_PALETTE } from '../../theme';
import { formatCurrency, parseAmountInput } from '../../utils';
import { styles } from './DepositScreen.styles';

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000];

export function DepositScreen() {
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

  useFocusEffect(
    useCallback(() => {
      fundStore.refreshFund(Number(id)).catch(() => {});
      walletService.getMyWallet()
        .then((w) => setWalletBalance(Number(w.balance) || 0))
        .catch(() => setWalletBalance(0));
    }, [id])
  );

  const parsedAmount = amount ? parseInt(amount, 10) : 0;
  const isValid = parsedAmount >= 10_000 && parsedAmount <= walletBalance && !submitting;

  const handleConfirm = () => {
    if (parsedAmount < 10_000) {
      Alert.alert('Lỗi', 'Số tiền nạp tối thiểu là 10.000đ');
      return;
    }
    if (parsedAmount > walletBalance) {
      Alert.alert('Lỗi', 'Số dư ví không đủ để nạp vào quỹ');
      return;
    }
    setPinError('');
    setPinVisible(true);
  };

  const handlePinConfirm = async (pin: string) => {
    try {
      setSubmitting(true);
      setPinError('');
      await fundStore.deposit(Number(id), parsedAmount, pin, note.trim() || undefined);
      setPinVisible(false);
      setSuccessVisible(true);
    } catch (err: any) {
      setPinError(err?.message || 'Nạp tiền thất bại');
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
              <Text style={styles.headerTitle}>Nạp tiền vào quỹ</Text>
            </View>
          </View>

          {/* Ví → Quỹ */}
          <FundTransferFlow
            direction="deposit"
            from={{
              kind: 'wallet',
              name: 'SmartSpend',
              balance: walletBalance,
            }}
            to={{
              kind: 'fund',
              name: fund?.name || 'Quỹ',
              balance: fund?.balance || 0,
              colorSeed: fund?.coverColorSeed ?? 0,
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
            <Text style={styles.amountLabel}>Số tiền muốn nạp</Text>
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

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickRow}
            >
              {QUICK_AMOUNTS.map((amt) => (
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
          </View>

          {/* Note */}
          <Text style={styles.sectionLabel}>Lời nhắn (tuỳ chọn)</Text>
          <View style={styles.noteWrap}>
            <Feather name="message-square" size={18} color={FUND_PALETTE.textMuted} style={{ marginTop: 2 }} />
            <TextInput
              style={styles.noteInput}
              placeholder="VD: Góp tiền đợt 1..."
              placeholderTextColor="#9CA3AF"
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={100}
            />
          </View>

          <View style={styles.securityRow}>
            <Ionicons name="shield-checkmark" size={20} color={FUND_PALETTE.primaryDeep} />
            <Text style={styles.securityText}>
              Giao dịch được bảo vệ bằng mã PIN. Tiền sẽ trừ từ ví và cộng vào quỹ.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.footerAmount}>
            <Text style={styles.footerLabel}>Số tiền nạp</Text>
            <Text style={styles.footerValue}>{formatCurrency(parsedAmount)} ₫</Text>
          </View>
          <TouchableOpacity
            style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
            disabled={!isValid}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>Xác nhận nạp</Text>
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
        title="Nạp tiền thành công"
        message={`Bạn đã nạp ${formatCurrency(parsedAmount)} ₫ vào "${fund?.name || 'quỹ'}".`}
        onClose={() => {
          setSuccessVisible(false);
          router.back();
        }}
      />
    </View>
  );
}
