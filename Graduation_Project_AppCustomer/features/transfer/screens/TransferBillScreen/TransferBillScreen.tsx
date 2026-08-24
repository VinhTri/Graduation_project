import React, { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Image, ImageBackground, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell';
import { SmartSpendIcon } from '@/shared/components/SmartSpendIcon/SmartSpendIcon';
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette';
import { formatMoney } from '@/shared/utils/moneyFormat';
import { styles } from './TransferBillScreen.styles';
import { CategorySelectModal } from '@/features/categories/components/CategorySelectModal/CategorySelectModal';
import { AddCategoryModal } from '@/features/categories/components/AddCategoryModal/AddCategoryModal';
import { useCategories } from '@/features/categories/hooks/useCategories';
import type { SelectedCategory } from '@/features/notebook/types/transaction';
import { transactionService } from '@/shared/api/services/transactionService';
import { useToast } from '@/shared/components/Toast';

const RECEIPT_BG = require('../../../../assets/images/wallet-receipt-bg.png');
const WALLET_TAG_HINT = require('../../../../assets/images/wallet-tag-hint.png');

function paramText(value: string | string[] | undefined, fallback = '') {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso || '—';
  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const day = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${time}, Ngày ${day}`;
}

function maskAccount(accountNumber: string) {
  const digits = accountNumber.replace(/\s/g, '');
  if (!digits || digits === '—' || digits.length <= 4) return digits || accountNumber;
  return `•••• ${digits.slice(-4)}`;
}

function DetailRow({ label, value, valueNode, muted, last, trailing, onPress }: {
  label: string; value?: ReactNode; valueNode?: ReactNode; muted?: boolean; last?: boolean;
  trailing?: ReactNode; onPress?: () => void;
}) {
  const body = (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValueWrap}>
        {valueNode ?? <Text style={[styles.rowValue, muted && styles.rowValueMuted]} numberOfLines={3}>{value}</Text>}
        {trailing}
      </View>
    </View>
  );
  return onPress ? <TouchableOpacity activeOpacity={0.75} onPress={onPress}>{body}</TouchableOpacity> : body;
}

export default function TransferBillScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    amount?: string; transactionCode?: string; accountNumber?: string;
    receiverName?: string; note?: string; createdAt?: string;
  }>();
  const allowingLeaveRef = useRef(false);
  const { showToast } = useToast();
  const { categories, loadCategories, addGroup, addItem } = useCategories({ reloadOnFocus: false });
  const [currentCategory, setCurrentCategory] = useState<SelectedCategory | null>(null);
  const [selectCategoryOpen, setSelectCategoryOpen] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

  const goToWallet = useCallback(() => {
    allowingLeaveRef.current = true;
    // Xóa toàn bộ flow chuyển tiền; Back/gesture sau đó không thể quay lại
    // màn xác nhận của một giao dịch đã thành công.
    router.dismissAll();
    router.replace('/(tabs)/home');
  }, [router]);

  useEffect(() => navigation.addListener('beforeRemove', (event) => {
    if (allowingLeaveRef.current) return;
    event.preventDefault();
    goToWallet();
  }), [navigation, goToWallet]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goToWallet();
      return true;
    });
    return () => subscription.remove();
  }, [goToWallet]);

  const amountText = paramText(params.amount, '0');
  const amount = Number(amountText);
  const transactionCode = paramText(params.transactionCode, '—').trim() || '—';
  const accountNumber = paramText(params.accountNumber, '—');
  const receiverName = paramText(params.receiverName, '—').trim() || '—';
  const note = paramText(params.note).trim();
  const createdAt = paramText(params.createdAt);
  const canEditCategory = transactionCode !== '—';

  const categoryNode = useMemo(() => currentCategory ? (
    <View style={[styles.categoryPill, { backgroundColor: currentCategory.bgColor || PASTEL_PALETTE.accentSoft }]}>
      <Ionicons name={(currentCategory.icon || 'cash') as keyof typeof Ionicons.glyphMap}
        size={14} color={currentCategory.color || PASTEL_PALETTE.accentDeep} />
      <Text style={[styles.categoryText, { color: currentCategory.color || PASTEL_PALETTE.accentDeep }]}
        numberOfLines={1}>{currentCategory.label}</Text>
    </View>
  ) : undefined, [currentCategory]);

  function openCategoryPicker() {
    void loadCategories();
    setSelectCategoryOpen(true);
  }

  async function saveCategory(next: SelectedCategory) {
    if (!canEditCategory || !next.id) return;
    try {
      await transactionService.updateTransaction(transactionCode, { categoryId: next.id });
      setCurrentCategory(next);
      setSelectCategoryOpen(false);
      showToast({ variant: 'success', message: 'Đã cập nhật danh mục' });
    } catch (error: any) {
      showToast({ variant: 'error', message: error?.message || 'Không thể cập nhật danh mục' });
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={goToWallet} activeOpacity={0.75}>
            <Ionicons name="chevron-back" size={22} color={PASTEL_PALETTE.accentDeep} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết giao dịch</Text>
          <View style={styles.headerRightSpacer} />
        </View>
      </PastelHeaderShell>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 28 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <View style={styles.receiptCard}>
          <Image source={RECEIPT_BG} style={styles.receiptBg} resizeMode="cover" />
          <View style={styles.receiptInner}>
            <View style={styles.successBadge}>
              <Ionicons name="checkmark" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Chuyển tiền thành công!</Text>
            <Text style={styles.successAmount}>-{Number.isFinite(amount) ? formatMoney(amount) : amountText}</Text>
            <Text style={styles.successHint}>Đến tài khoản SmartSpend của {receiverName}</Text>

            <View style={styles.partiesBlock}>
              <View style={styles.partyRow}>
                <View style={styles.partyAvatar}><SmartSpendIcon size={36} borderRadius={18} /></View>
                <View style={styles.partyText}>
                  <Text style={styles.partyName}>Ví SmartSpend</Text>
                  <Text style={styles.partySub}>Tài khoản nguồn</Text>
                </View>
              </View>
              <View style={styles.partyConnector}>
                <View style={styles.partyDotLine} />
                <Ionicons name="chevron-down" size={14} color={PASTEL_PALETTE.lavender} style={styles.partyChevron} />
                <View style={styles.partyDotLine} />
              </View>
              <View style={styles.partyRow}>
                <View style={styles.partyAvatar}><Ionicons name="person" size={22} color={PASTEL_PALETTE.accentDeep} /></View>
                <View style={styles.partyText}>
                  <Text style={styles.partyName} numberOfLines={1}>{receiverName}</Text>
                  <Text style={styles.partySub} numberOfLines={1}>{maskAccount(accountNumber)} | SmartSpend</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />
            <View style={styles.detailsBlock}>
              <DetailRow label="Mã giao dịch" value={transactionCode} />
              <DetailRow label="Thời gian" value={createdAt ? formatTime(createdAt) : '—'} />
              <DetailRow label="Phí giao dịch" value="Miễn phí" />
              <DetailRow label="Danh mục"
                value={currentCategory ? undefined : 'Chưa thiết lập'}
                valueNode={categoryNode}
                muted={!currentCategory}
                trailing={!currentCategory ? (
                  <TouchableOpacity style={styles.tagBtn} onPress={openCategoryPicker} activeOpacity={0.8}>
                    <Ionicons name="pricetag" size={12} color={PASTEL_PALETTE.accentDeep} />
                    <Text style={styles.tagBtnText}>Gắn danh mục</Text>
                  </TouchableOpacity>
                ) : null}
                onPress={openCategoryPicker} />
              <DetailRow label="Ghi chú" value={note || 'Chưa thiết lập'} muted={!note} last />
            </View>
          </View>
        </View>
        {!currentCategory ? (
          <TouchableOpacity activeOpacity={0.86} onPress={openCategoryPicker}
            accessibilityRole="button" accessibilityLabel="Chọn danh mục cho giao dịch">
            <ImageBackground source={WALLET_TAG_HINT} style={styles.categoryReminderCard}
              imageStyle={styles.categoryReminderBackground} resizeMode="cover">
              <View style={styles.categoryReminderContent}>
                <View style={styles.categoryReminderLabel}>
                  <Ionicons name="sparkles" size={12} color={PASTEL_PALETTE.accentDeep} />
                  <Text style={styles.categoryReminderLabelText}>Chạm để chọn</Text>
                </View>
                <Text style={styles.categoryReminderTitle}>Đừng quên{`\n`}chọn danh mục</Text>
                <Text style={styles.categoryReminderText}>Phân loại giao dịch giúp bạn{`\n`}theo dõi chi tiêu chính xác và{`\n`}quản lý tài chính hiệu quả hơn.</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.closeBtn} onPress={goToWallet} activeOpacity={0.85}>
          <Text style={styles.closeBtnText}>Đóng</Text>
        </TouchableOpacity>
      </ScrollView>
      <CategorySelectModal visible={selectCategoryOpen} categories={categories}
        onClose={() => setSelectCategoryOpen(false)}
        onSelect={(item) => saveCategory({ id: item.id, label: item.label, icon: item.icon,
          color: item.color, bgColor: item.bgColor })}
        onAddCategory={() => { setSelectCategoryOpen(false); setCreateCategoryOpen(true); }} />
      <AddCategoryModal visible={createCategoryOpen} categories={categories}
        onClose={() => setCreateCategoryOpen(false)}
        onBack={() => { setCreateCategoryOpen(false); setSelectCategoryOpen(true); }}
        onCreateGroup={addGroup}
        onSubmit={async (payload) => {
          await addItem(payload);
          await loadCategories();
          setCreateCategoryOpen(false);
          setSelectCategoryOpen(true);
        }} />
    </View>
  );
}
