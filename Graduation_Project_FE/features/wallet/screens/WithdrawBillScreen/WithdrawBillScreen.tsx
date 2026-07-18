import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Image, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { PASTEL_PALETTE, PASTEL_HEADER_GRADIENT } from '../../../../shared/constants/PastelPalette';
import { SmartSpendIcon } from '../../../../shared/components/SmartSpendIcon';
import { styles } from './WithdrawBillScreen.styles';

const COMMON_BANKS = [
  { code: '970422', name: 'MBBank', shortName: 'MB', logo: 'https://api.vietqr.io/img/MB.png' },
  { code: '970436', name: 'Vietcombank', shortName: 'VCB', logo: 'https://api.vietqr.io/img/VCB.png' },
  { code: '970407', name: 'Techcombank', shortName: 'TCB', logo: 'https://api.vietqr.io/img/TCB.png' },
  { code: '970418', name: 'BIDV', shortName: 'BIDV', logo: 'https://api.vietqr.io/img/BIDV.png' },
  { code: '970432', name: 'VPBank', shortName: 'VPB', logo: 'https://api.vietqr.io/img/VPB.png' },
  { code: '970423', name: 'TPBank', shortName: 'TPB', logo: 'https://api.vietqr.io/img/TPB.png' },
  { code: '970415', name: 'VietinBank', shortName: 'ICB', logo: 'https://api.vietqr.io/img/ICB.png' },
  { code: '970405', name: 'Agribank', shortName: 'VBA', logo: 'https://api.vietqr.io/img/VBA.png' },
  { code: '970403', name: 'Sacombank', shortName: 'STB', logo: 'https://api.vietqr.io/img/STB.png' },
  { code: '970416', name: 'ACB', shortName: 'ACB', logo: 'https://api.vietqr.io/img/ACB.png' },
  { code: '970441', name: 'VIB', shortName: 'VIB', logo: 'https://api.vietqr.io/img/VIB.png' },
  { code: '970443', name: 'SHB', shortName: 'SHB', logo: 'https://api.vietqr.io/img/SHB.png' },
];

const resolveBankLogo = (bankCode?: string, bankName?: string) => {
  if (bankCode) {
    const byCode = COMMON_BANKS.find((b) => b.code === bankCode);
    if (byCode) return byCode.logo;
  }
  if (bankName) {
    const key = bankName.toLowerCase();
    const byName = COMMON_BANKS.find(
      (b) =>
        key.includes(b.name.toLowerCase()) ||
        key.includes(b.shortName.toLowerCase()) ||
        b.name.toLowerCase().includes(key)
    );
    if (byName) return byName.logo;
  }
  return 'https://api.vietqr.io/img/VNPAY.png';
};

const maskAccountNumber = (accountNumber: string) => {
  if (!accountNumber) return '';
  const digits = accountNumber.replace(/\s/g, '');
  if (digits.length <= 4) return digits;
  return `•••• ${digits.slice(-4)}`;
};

export default function WithdrawBillScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [logoFailed, setLogoFailed] = useState(false);
  const allowingLeaveRef = useRef(false);

  const goToWallet = useCallback(() => {
    allowingLeaveRef.current = true;
    router.replace('/wallet');
  }, [router]);

  // Vuốt back / nút back Android → luôn về trang ví, không về form rút/nạp
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (allowingLeaveRef.current) return;
      e.preventDefault();
      goToWallet();
    });
    return unsub;
  }, [navigation, goToWallet]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goToWallet();
      return true;
    });
    return () => sub.remove();
  }, [goToWallet]);

  const getCurrentFormattedDate = () => {
    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} · ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const amount = parseInt((params.amount as string) || '0', 10) || 0;
  const transactionCode = ((params.transactionCode as string) || '').trim();
  const bankName = (params.bankName as string) || 'Ngân hàng';
  const bankCode = (params.bankCode as string) || '';
  const accountNumber = (params.accountNumber as string) || '';
  const accountName = (params.accountName as string) || '';
  const note = ((params.note as string) || '').trim();
  const category = ((params.category as string) || '').trim();
  const categoryIcon = (params.categoryIcon as string) || 'pricetag-outline';
  const categoryColor = (params.categoryColor as string) || PASTEL_PALETTE.subtitle;
  const categoryBgColor = (params.categoryBgColor as string) || PASTEL_PALETTE.lavenderSoft;
  const transactionDate = (params.transactionDate as string) || getCurrentFormattedDate();

  const bankLogoUri = useMemo(
    () => resolveBankLogo(bankCode, bankName),
    [bankCode, bankName]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.centerWrap}>
        <LinearGradient
          colors={[...PASTEL_HEADER_GRADIENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardInner}>
            <View style={styles.headerRow}>
              <View style={styles.checkWrap}>
                <Ionicons name="checkmark" size={22} color={PASTEL_PALETTE.accentDeep} />
              </View>
              <View style={styles.headerTextWrap}>
                <Text style={styles.headerTitle}>Rút tiền thành công</Text>
                <Text style={styles.headerSub}>{transactionDate}</Text>
              </View>
            </View>

            <View style={styles.amountBlock}>
              <Text style={styles.amountLabel}>Số tiền đã rút</Text>
              <Text style={styles.amountValue}>
                −{amount.toLocaleString('vi-VN')}
                <Text style={styles.amountCurrency}> ₫</Text>
              </Text>
            </View>

            <View style={styles.flowRow}>
              <View style={styles.flowParty}>
                <SmartSpendIcon size={40} style={styles.flowLogo} borderRadius={12} />
                <Text style={styles.flowName} numberOfLines={1}>
                  <Text style={styles.brandSmart}>Smart</Text>
                  <Text style={styles.brandSpend}>Spend</Text>
                </Text>
              </View>

              <View style={styles.flowArrowWrap}>
                <View style={styles.flowDash} />
                <View style={styles.flowArrowBadge}>
                  <Ionicons name="arrow-forward" size={12} color={PASTEL_PALETTE.accentDeep} />
                </View>
                <View style={styles.flowDash} />
              </View>

              <View style={styles.flowParty}>
                <View style={styles.bankLogoBox}>
                  {!logoFailed ? (
                    <Image
                      source={{ uri: bankLogoUri }}
                      style={styles.bankLogo}
                      resizeMode="contain"
                      onError={() => setLogoFailed(true)}
                    />
                  ) : (
                    <Ionicons name="business-outline" size={18} color={PASTEL_PALETTE.subtitle} />
                  )}
                </View>
                <Text style={styles.flowBankName} numberOfLines={1}>
                  {bankName}
                </Text>
              </View>
            </View>

            <Text style={styles.bankMeta} numberOfLines={1}>
              {maskAccountNumber(accountNumber)}
              {accountName ? ` · ${accountName.toUpperCase()}` : ''}
            </Text>

            <View style={styles.metaBox}>
              {!!transactionCode && (
                <>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Mã GD</Text>
                    <Text style={styles.metaCode} numberOfLines={1} selectable>
                      {transactionCode}
                    </Text>
                  </View>
                  <View style={styles.metaDivider} />
                </>
              )}

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Danh mục</Text>
                {category ? (
                  <View style={[styles.categoryChip, { backgroundColor: categoryBgColor }]}>
                    <Ionicons
                      name={categoryIcon as keyof typeof Ionicons.glyphMap}
                      size={14}
                      color={categoryColor}
                    />
                    <Text style={[styles.categoryChipText, { color: categoryColor }]} numberOfLines={1}>
                      {category}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.metaValue}>Chưa phân loại</Text>
                )}
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Ghi chú</Text>
                <Text style={styles.metaValue} numberOfLines={1}>
                  {note || '—'}
                </Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Phí</Text>
                <View style={styles.feeBadge}>
                  <Text style={styles.feeBadgeText}>Miễn phí</Text>
                </View>
              </View>
            </View>

            <Text style={styles.hintText}>
              Theo dõi trạng thái trong Lịch sử ví khi cần.
            </Text>
          </View>
        </LinearGradient>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={goToWallet}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Hoàn tất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
