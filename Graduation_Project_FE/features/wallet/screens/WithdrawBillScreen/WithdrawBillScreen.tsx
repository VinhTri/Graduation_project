import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '../../../../shared/constants/Colors';
import { styles } from './WithdrawBillScreen.styles';

const maskAccountNumber = (accountNumber: string) => {
  if (!accountNumber) return '';
  const digits = accountNumber.replace(/\s/g, '');
  if (digits.length <= 4) return digits;
  return `•••• ${digits.slice(-4)}`;
};

export default function WithdrawBillScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const getCurrentFormattedDate = () => {
    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} · ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const amountStr = (params.amount as string) || '0';
  const amount = parseInt(amountStr, 10) || 0;
  const bankName = (params.bankName as string) || 'Ngân hàng';
  const accountNumber = (params.accountNumber as string) || '';
  const accountName = (params.accountName as string) || '';
  const note = (params.note as string) || '';
  const category = (params.category as string) || '';
  const categoryIcon = (params.categoryIcon as string) || 'pricetag-outline';
  const categoryColor = (params.categoryColor as string) || Colors.textMuted;
  const categoryBgColor = (params.categoryBgColor as string) || Colors.border + '55';
  const hasCategory = Boolean(category.trim());
  const transactionDate = (params.transactionDate as string) || getCurrentFormattedDate();

  const formatDisplayAmount = (val: number) => val.toLocaleString('vi-VN');

  const handleGoHome = () => {
    router.replace('/wallet');
  };

  const handleGoHistory = () => {
    router.replace('/wallet/history');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 8 }}
      >
        <LinearGradient
          colors={['#0D9488', '#047857', '#065F46']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 28 }]}
        >
          <View style={styles.decorCircleLg} />
          <View style={styles.decorCircleSm} />

          <View style={styles.successRingOuter}>
            <View style={styles.successRingInner}>
              <Ionicons name="checkmark" size={36} color={Colors.success} />
            </View>
          </View>

          <Text style={styles.heroTitle}>Rút tiền thành công</Text>
          <Text style={styles.heroSubtitle}>
            Giao dịch đã được xử lý. Tiền sẽ về tài khoản ngân hàng trong vài phút.
          </Text>
        </LinearGradient>

        <View style={styles.scrollContent}>
          <View style={styles.receiptCard}>
            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>Số tiền đã rút</Text>
              <Text style={styles.amountText}>
                −{formatDisplayAmount(amount)}
                <Text style={styles.amountCurrency}> ₫</Text>
              </Text>
              <View style={styles.dateChip}>
                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.dateText}>{transactionDate}</Text>
              </View>
            </View>

            <View style={styles.ticketDivider}>
              <View style={styles.ticketNotchLeft} />
              <View style={styles.ticketLine} />
              <View style={styles.ticketNotchRight} />
            </View>

            <View style={styles.transferSection}>
              <Text style={styles.transferTitle}>Luồng chuyển tiền</Text>

              <View style={styles.transferNode}>
                <View style={[styles.transferIconBox, { backgroundColor: Colors.primaryLight }]}>
                  <Ionicons name="wallet" size={24} color={Colors.primary} />
                </View>
                <View style={styles.transferInfo}>
                  <Text style={styles.transferName}>Ví SmartSpend</Text>
                  <Text style={styles.transferMeta}>Nguồn rút tiền</Text>
                </View>
              </View>

              <View style={styles.transferArrow}>
                <View style={styles.transferArrowLine} />
                <Ionicons name="arrow-down" size={16} color={Colors.textMuted} />
              </View>

              <View style={styles.transferNode}>
                <View style={[styles.transferIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="business" size={24} color="#2563EB" />
                </View>
                <View style={styles.transferInfo}>
                  <Text style={styles.transferName}>{bankName}</Text>
                  <Text style={styles.transferMeta}>
                    {maskAccountNumber(accountNumber)}
                    {accountName ? ` · ${accountName.toUpperCase()}` : ''}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Ionicons name="pricetag-outline" size={18} color={Colors.textMuted} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Danh mục</Text>
                  {hasCategory ? (
                    <View style={[styles.categoryChip, { backgroundColor: categoryBgColor }]}>
                      <Ionicons
                        name={categoryIcon as keyof typeof Ionicons.glyphMap}
                        size={16}
                        color={categoryColor}
                      />
                      <Text style={[styles.categoryChipText, { color: categoryColor }]}>
                        {category}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.detailValue}>Chưa phân loại</Text>
                  )}
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Ionicons name="document-text-outline" size={18} color={Colors.textMuted} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Ghi chú</Text>
                  <Text style={styles.detailValue}>
                    {note.trim() ? note : 'Không có ghi chú'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Ionicons name="cash-outline" size={18} color={Colors.textMuted} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Phí giao dịch</Text>
                  <View style={styles.feeBadge}>
                    <Text style={styles.feeBadgeText}>Miễn phí</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.infoBanner}>
            <Ionicons name="shield-checkmark" size={22} color={Colors.primaryDark} />
            <Text style={styles.infoBannerText}>
              Bạn có thể theo dõi trạng thái giao dịch trong mục Lịch sử ví bất cứ lúc nào.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleGoHistory}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>Xem lịch sử</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleGoHome}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Hoàn tất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
