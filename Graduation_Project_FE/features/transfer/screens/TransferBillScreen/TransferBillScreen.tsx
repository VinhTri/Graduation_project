import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { PASTEL_PALETTE, PASTEL_HEADER_GRADIENT } from '@/shared/constants/PastelPalette';
import { SmartSpendIcon } from '@/shared/components/SmartSpendIcon';
import { styles } from './TransferBillScreen.styles';

const maskAccountNumber = (accountNumber: string) => {
  if (!accountNumber) return '';
  const digits = accountNumber.replace(/\s/g, '');
  if (digits.length <= 4) return digits;
  return `•••• ${digits.slice(-4)}`;
};

export default function TransferBillScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const allowingLeaveRef = useRef(false);

  const goToWallet = useCallback(() => {
    allowingLeaveRef.current = true;
    router.replace('/home');
  }, [router]);

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

  const formatIsoDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      const pad = (n: number) => (n < 10 ? '0' + n : n);
      return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    } catch {
      return isoString;
    }
  };

  const amount = parseInt((params.amount as string) || '0', 10) || 0;
  const transactionCode = ((params.transactionCode as string) || '').trim();
  const accountNumber = (params.accountNumber as string) || '';
  const receiverName = (params.receiverName as string) || '';
  const note = ((params.note as string) || '').trim();
  const transactionDate = params.createdAt ? formatIsoDate(params.createdAt as string) : getCurrentFormattedDate();
  const categoryLabel = (params.categoryLabel as string) || '';
  const categoryIconStr = params.categoryIcon as string;
  const categoryIcon = (!categoryIconStr || categoryIconStr === 'undefined') ? 'pricetag' : categoryIconStr;
  
  const categoryColorStr = params.categoryColor as string;
  const categoryColor = (!categoryColorStr || categoryColorStr === 'undefined') ? '' : categoryColorStr;
  
  const categoryBgColorStr = params.categoryBgColor as string;
  const categoryBgColor = (!categoryBgColorStr || categoryBgColorStr === 'undefined') ? '' : categoryBgColorStr;

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
                <Text style={styles.headerTitle}>Chuyển tiền thành công</Text>
                <Text style={styles.headerSub}>{transactionDate}</Text>
              </View>
            </View>

            <View style={styles.amountBlock}>
              <Text style={styles.amountLabel}>Số tiền đã chuyển</Text>
              <Text style={styles.amountValue}>
                {amount.toLocaleString('vi-VN')}
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
                <View style={styles.flowIconBox}>
                  <Ionicons name="person-circle-outline" size={32} color={PASTEL_PALETTE.lavender} />
                </View>
                <Text style={styles.flowName} numberOfLines={1}>
                  {receiverName}
                </Text>
              </View>
            </View>

            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mã giao dịch</Text>
                <Text style={styles.infoValue}>{transactionCode}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Người nhận</Text>
                <Text style={styles.infoValue}>{receiverName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tài khoản nhận</Text>
                <Text style={styles.infoValue}>{accountNumber}</Text>
              </View>
              {!!categoryLabel && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Danh mục</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: categoryBgColor || PASTEL_PALETTE.lavenderSoft, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                      <Ionicons name={categoryIcon as any} size={16} color={categoryColor || PASTEL_PALETTE.accentDeep} />
                    </View>
                    <Text style={[styles.infoValue, { flex: 0, textAlign: 'left' }]} numberOfLines={1}>{categoryLabel}</Text>
                  </View>
                </View>
              )}
              {!!note && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Lời nhắn</Text>
                  <Text style={styles.infoValue}>{note}</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnPrimary} onPress={goToWallet} activeOpacity={0.8}>
          <Text style={styles.btnText}>Hoàn tất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
