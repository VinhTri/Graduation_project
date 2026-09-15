import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Keyboard,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { CharacterCounter } from '@/shared/components/CharacterCounter/CharacterCounter';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { FundHeaderShell, FundAvatar, FundProgressBar, InviteFriendsModal, FundMoneyForm } from '../../components';
import { ConfirmModal } from '../../../../shared/components';
import { useToast } from '../../../../shared/components/Toast';
import { fundStore, useFund } from '../../store/fundStore';
import { formatCurrency } from '../../utils';
import { FUND_PALETTE, pickFundTheme } from '../../theme';
import { MAX_FUND_MEMBERS, SYSTEM_MIN_DEPOSIT } from '../../constants';
import { FundMember, FundTransaction } from '../../types';
import { walletService } from '../../../../shared/api/services/walletService';
import { styles } from './FundDetailScreen.styles';
import { getStoredUserId } from '../../../../shared/services/session.service';

type DetailTab = 'members' | 'history' | 'deposit' | 'withdraw';

const TX_META: Record<FundTransaction['type'], { icon: keyof typeof Feather.glyphMap; color: string; bg: string; sign: string; label: string }> = {
  DEPOSIT: { icon: 'arrow-down-left', color: FUND_PALETTE.success, bg: '#DCFCE7', sign: '+', label: 'Nạp vào quỹ' },
  WITHDRAW: { icon: 'arrow-up-right', color: FUND_PALETTE.danger, bg: '#FEE2E2', sign: '-', label: 'Rút khỏi quỹ' },
  EXPENSE: { icon: 'shopping-bag', color: FUND_PALETTE.accent, bg: FUND_PALETTE.accentSoft, sign: '-', label: 'Chi tiêu' },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} · ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

function goToFundsList(router: ReturnType<typeof useRouter>) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  if (router.canDismiss()) {
    router.dismissTo('/(tabs)/funds');
    return;
  }
  router.replace('/(tabs)/funds');
}

export function FundDetailScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const liveFund = useFund(Number(id));
  const [tab, setTab] = useState<DetailTab>('members');
  const [memberQuery, setMemberQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [editingTx, setEditingTx] = useState<FundTransaction | null>(null);
  const [viewingTx, setViewingTx] = useState<FundTransaction | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const leavingRef = useRef(false);
  const fundSnapshotRef = useRef(liveFund);
  if (liveFund) fundSnapshotRef.current = liveFund;
  const fund = liveFund ?? ((deletingRef.current || leavingRef.current) ? fundSnapshotRef.current : undefined);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    getStoredUserId().then((value) => {
      const parsed = value == null ? NaN : Number(value);
      setCurrentUserId(Number.isFinite(parsed) ? parsed : null);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (deletingRef.current || leavingRef.current) return;
      fundStore.refreshFund(Number(id)).catch(() => {});
      walletService.getMyWallet()
        .then((w) => setWalletBalance(Number(w.balance) || 0))
        .catch(() => setWalletBalance(0));
    }, [id])
  );

  const openEditNote = (tx: FundTransaction) => {
    setEditingTx(tx);
    setNoteDraft(tx.note || '');
  };

  const openViewTx = (tx: FundTransaction) => {
    setViewingTx(tx);
  };

  const handlePressTx = (tx: FundTransaction) => {
    if (currentUserId != null && tx.userId === currentUserId) {
      openEditNote(tx);
    } else {
      openViewTx(tx);
    }
  };

  const saveNote = async () => {
    if (!editingTx) return;
    try {
      await fundStore.updateTransactionNote(Number(id), editingTx.id, noteDraft);
      setEditingTx(null);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể lưu ghi chú');
    }
  };

  const handlePressDelete = () => {
    setMenuVisible(false);
    if (!fund) return;
    setDeleteConfirmVisible(true);
  };

  const handlePressLeave = () => {
    setMenuVisible(false);
    setLeaveConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    const fundName = fund?.name?.trim() || 'quỹ';
    const result = await fundStore.deleteFund(Number(id));
    if (!result.ok) {
      deletingRef.current = false;
      setDeleting(false);
      Alert.alert('Không thể đóng quỹ', result.message || 'Bạn không có quyền đóng quỹ này.');
      return;
    }
    setDeleteConfirmVisible(false);
    showToast({ variant: 'success', message: `Đã đóng quỹ "${fundName}" thành công` });
    goToFundsList(router);
  };

  const handleConfirmLeave = async () => {
    leavingRef.current = true;
    const result = await fundStore.leaveFund(Number(id));
    setLeaveConfirmVisible(false);
    if (!result.ok) {
      leavingRef.current = false;
      Alert.alert('Không thể rời nhóm', result.message || 'Vui lòng thử lại.');
      return;
    }
    goToFundsList(router);
  };

  if (!fund) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: '#F8FAFC' }]}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FCE7F3', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          <Feather name="folder-minus" size={36} color="#EC4899" />
        </View>
        <Text style={[styles.emptyTitle, { fontSize: 20, color: '#1E293B', marginBottom: 8 }]}>Quỹ không tồn tại</Text>
        <Text style={{ fontSize: 15, color: '#64748B', textAlign: 'center', marginHorizontal: 32, marginBottom: 24, lineHeight: 22 }}>
          Quỹ này có thể đã bị xóa bởi người tạo hoặc bạn không còn quyền truy cập.
        </Text>
        <TouchableOpacity 
          onPress={() => goToFundsList(router)} 
          style={{ backgroundColor: '#F472B6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, elevation: 2, shadowColor: '#F472B6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>Quay về danh sách quỹ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasTarget = !!fund.targetAmount && fund.targetAmount > 0;
  const progress = hasTarget ? fund.balance / (fund.targetAmount as number) : 0;
  const reachedTarget = hasTarget && fund.balance >= (fund.targetAmount as number);
  const activeMembers = fund.members.filter((m) => m.status !== 'LEFT');
  const occupiedSlots = fund.members.filter(
    (m) => m.status === 'ACTIVE' || m.status === 'INVITED'
  ).length;
  const memberLimitReached = occupiedSlots >= MAX_FUND_MEMBERS;
  const isSearching = !!submittedQuery.trim();
  const minDeposit =
    fund.minDepositAmount && fund.minDepositAmount > 0
      ? fund.minDepositAmount
      : SYSTEM_MIN_DEPOSIT;
  const theme = pickFundTheme(fund.coverColorSeed);

  const renderMember = (member: FundMember) => (
    <View key={member.id} style={styles.memberRow}>
      <FundAvatar name={member.name} size={44} />
      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
          {member.role === 'OWNER' && (
            <View style={styles.ownerBadge}>
              <Text style={styles.ownerBadgeText}>Chủ quỹ</Text>
            </View>
          )}
          {member.status === 'INVITED' && (
            <View style={styles.invitedBadge}>
              <Text style={styles.invitedBadgeText}>Chờ tham gia</Text>
            </View>
          )}
        </View>
        <Text style={styles.memberContribLabel}>Đã đóng góp</Text>
      </View>
      <Text style={styles.memberContrib}>{formatCurrency(member.contributedAmount)} ₫</Text>
    </View>
  );

  const renderTransaction = (tx: FundTransaction) => {
    const meta = TX_META[tx.type];
    const isMine = currentUserId != null && tx.userId === currentUserId;
    return (
      <TouchableOpacity
        key={tx.id}
        style={styles.txRow}
        activeOpacity={0.7}
        onPress={() => handlePressTx(tx)}
      >
        <FundAvatar name={tx.userName} size={44} />
        <View style={styles.txInfo}>
          <View style={styles.txTopRow}>
            <Text style={styles.txName} numberOfLines={1}>
              {isMine ? 'Bạn' : tx.userName}
            </Text>
            {tx.memberLeft && (
              <View style={styles.leftBadge}>
                <Text style={styles.leftBadgeText}>Đã rời nhóm</Text>
              </View>
            )}
            {isMine && (
              <View style={[styles.txCatBadge, { backgroundColor: tx.category.bgColor }]}>
                <Text style={[styles.txCatBadgeText, { color: tx.category.color }]}>{tx.category.label}</Text>
              </View>
            )}
          </View>
          <Text style={styles.txNote} numberOfLines={1}>
            {isMine
              ? `${tx.note || 'Nhấn để thêm ghi chú'} · ${formatDate(tx.createdAt)}`
              : `${tx.note || 'Không có ghi chú'} · ${formatDate(tx.createdAt)}`}
          </Text>
        </View>
        <Text style={[styles.txAmount, { color: meta.color }]}>
          {meta.sign}{formatCurrency(tx.amount)} ₫
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <FundHeaderShell contentStyle={styles.header} coverImage={theme.image}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="chevron-back-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>{fund.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => setMenuVisible(true)}
          >
            <Feather name="more-horizontal" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceBlock}>
          <View style={styles.themeTag}>
            <Text style={styles.themeTagText}>{theme.label}</Text>
          </View>
          <Text style={styles.balanceLabel}>Số dư quỹ hiện tại</Text>
          <Text style={styles.balanceValue}>{formatCurrency(fund.balance)} ₫</Text>
          <Text style={styles.minDepositText}>
            Mỗi lần nạp tối thiểu {formatCurrency(minDeposit)} ₫
          </Text>

          {hasTarget && (
            <View style={styles.progressWrap}>
              <FundProgressBar
                progress={progress}
                height={10}
                trackColor="rgba(255,255,255,0.28)"
                fillColor="#FFFFFF"
              />
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>{Math.round(progress * 100)}% hoàn thành</Text>
                <Text style={styles.progressText}>Mục tiêu {formatCurrency(fund.targetAmount as number)} ₫</Text>
              </View>
            </View>
          )}
        </View>
      </FundHeaderShell>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sliderRow}
        >
          {([
            { key: 'deposit' as const, label: 'Nạp', icon: 'plus' as const, ownerOnly: false },
            { key: 'withdraw' as const, label: 'Rút', icon: 'arrow-up' as const, ownerOnly: true },
            { key: 'history' as const, label: 'Lịch sử', icon: 'clock' as const, ownerOnly: false },
            { key: 'members' as const, label: `Thành viên (${occupiedSlots})`, icon: 'users' as const, ownerOnly: false },
          ] as const)
            .filter((item) => !item.ownerOnly || fund.isOwner)
            .map((item) => {
              const active = tab === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.sliderChip,
                    active && styles.sliderChipActive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => setTab(item.key)}
                >
                  <Feather
                    name={item.icon}
                    size={14}
                    color={active ? FUND_PALETTE.primaryDeep : FUND_PALETTE.subtitle}
                  />
                  <Text
                    style={[
                      styles.sliderChipText,
                      active && styles.sliderChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </ScrollView>

        {tab === 'deposit' ? (
          <View style={{ marginTop: 16 }}>
            <FundMoneyForm
              mode="deposit"
              fund={fund}
              walletBalance={walletBalance}
              minDeposit={minDeposit}
              onCompleted={() => {
                walletService.getMyWallet()
                  .then((w) => setWalletBalance(Number(w.balance) || 0))
                  .catch(() => {});
              }}
            />
          </View>
        ) : tab === 'withdraw' ? (
          <View style={{ marginTop: 16 }}>
            <FundMoneyForm
              mode="withdraw"
              fund={fund}
              walletBalance={walletBalance}
              minDeposit={minDeposit}
              onCompleted={() => {
                walletService.getMyWallet()
                  .then((w) => setWalletBalance(Number(w.balance) || 0))
                  .catch(() => {});
              }}
            />
          </View>
        ) : tab === 'members' ? (
          <View style={styles.membersTab}>
            <View style={styles.searchSection}>
              <Text style={styles.searchHint}>Tìm theo tên, email hoặc STK ví</Text>
              <View style={styles.searchContainer}>
                <View style={styles.searchIconWrap}>
                  <Ionicons name="search" size={18} color={FUND_PALETTE.primary} />
                </View>
                <TextInput
                  style={styles.searchInput}
                  placeholder="vd: email, tên hoặc STK ví"
                  placeholderTextColor={FUND_PALETTE.textMuted}
                  value={memberQuery}
                  onChangeText={setMemberQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={() => {
                    Keyboard.dismiss();
                    setSubmittedQuery(memberQuery.trim());
                  }}
                />
                {memberQuery.length > 0 && (
                  <TouchableOpacity
                    style={styles.searchClearBtn}
                    onPress={() => {
                      setMemberQuery('');
                      setSubmittedQuery('');
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={() => {
                    Keyboard.dismiss();
                    setSubmittedQuery(memberQuery.trim());
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.searchButtonText}>Tìm</Text>
                </TouchableOpacity>
              </View>
            </View>

            {isSearching ? (
              <>
                <Text style={styles.sectionTitle}>Kết quả</Text>
                <InviteFriendsModal
                  embedded
                  hideChrome
                  searchResultsMode
                  visible
                  canInvite={fund.isOwner}
                  fundId={fund.id}
                  members={fund.members}
                  searchQuery={submittedQuery}
                  onClose={() => {}}
                  onInvited={() => fundStore.refreshFund(fund.id).catch(() => {})}
                />
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Thành viên</Text>
                <View style={styles.card}>
                  {activeMembers.length > 0 ? (
                    activeMembers.map(renderMember)
                  ) : (
                    <View style={styles.emptyBlock}>
                      <Feather name="users" size={28} color={FUND_PALETTE.textMuted} />
                      <Text style={styles.emptyBlockText}>Chưa có thành viên</Text>
                    </View>
                  )}
                </View>

                {fund.isOwner && (
                  <>
                    <Text style={styles.sectionTitle}>Danh bạ</Text>
                    {memberLimitReached && (
                      <Text style={styles.memberLimitHint}>
                        Thành viên đã đạt tối đa ({MAX_FUND_MEMBERS}/{MAX_FUND_MEMBERS})
                      </Text>
                    )}
                    <InviteFriendsModal
                      embedded
                      hideChrome
                      visible
                      canInvite
                      fundId={fund.id}
                      members={fund.members}
                      searchQuery=""
                      onClose={() => {}}
                      onInvited={() => fundStore.refreshFund(fund.id).catch(() => {})}
                    />
                  </>
                )}
              </>
            )}
          </View>
        ) : (
          <View style={[styles.card, { marginTop: 16 }]}>
            {fund.transactions.length > 0
              ? fund.transactions.map(renderTransaction)
              : (
                <View style={styles.emptyBlock}>
                  <Feather name="clock" size={28} color={FUND_PALETTE.textMuted} />
                  <Text style={styles.emptyBlockText}>Chưa có giao dịch nào</Text>
                </View>
              )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.menuTitle}>Tùy chọn quỹ</Text>

            {fund.isOwner ? (
              <TouchableOpacity
                style={styles.menuItemDanger}
                activeOpacity={0.85}
                onPress={handlePressDelete}
              >
                <View style={styles.menuIconDanger}>
                  <Feather name="trash-2" size={18} color={FUND_PALETTE.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuItemDangerText}>Đóng quỹ</Text>
                  <Text style={styles.menuItemSub}>Số tiền còn lại sẽ chuyển về ví của chủ quỹ</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.menuItemDanger}
                activeOpacity={0.85}
                onPress={handlePressLeave}
              >
                <View style={styles.menuIconDanger}>
                  <Feather name="log-out" size={18} color={FUND_PALETTE.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuItemDangerText}>Rời nhóm</Text>
                  <Text style={styles.menuItemSub}>Tiền đã góp vẫn thuộc quỹ chung và không tự động hoàn lại</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuCancelBtn}
              activeOpacity={0.85}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.menuCancelText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ConfirmModal
        visible={deleteConfirmVisible}
        title={reachedTarget ? 'Chúc mừng hoàn thành quỹ' : 'Chưa đạt mục tiêu'}
        message={
          reachedTarget
            ? `Quỹ "${fund.name}" đã đạt hoặc vượt mục tiêu. ${formatCurrency(fund.balance)} ₫ sẽ được chuyển về ví SmartSpend của chủ quỹ. Lịch sử quỹ vẫn được lưu để đối soát.`
            : hasTarget
              ? `Quỹ "${fund.name}" chưa đủ mục tiêu (${formatCurrency(fund.balance)} / ${formatCurrency(fund.targetAmount as number)} ₫). Nếu xác nhận, số tiền còn lại sẽ chuyển về ví SmartSpend của chủ quỹ và quỹ sẽ đóng.`
              : `Số tiền còn lại ${formatCurrency(fund.balance)} ₫ sẽ được chuyển về ví SmartSpend của chủ quỹ. Lịch sử quỹ vẫn được lưu để đối soát.`
        }
        image={
          reachedTarget
            ? require('../../../../assets/images/fund-close-success.png')
            : require('../../../../assets/images/fund-close-missed.png')
        }
        imageAspectRatio={1}
        confirmText="Rút về ví và đóng quỹ"
        cancelText="Hủy"
        isDestructive={!reachedTarget}
        confirmButtonColor={reachedTarget ? '#10B981' : undefined}
        loading={deleting}
        onCancel={() => {
          if (deleting) return;
          setDeleteConfirmVisible(false);
        }}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmModal
        visible={leaveConfirmVisible}
        title="Rời nhóm?"
        message={`Bạn sẽ không còn quyền truy cập quỹ "${fund.name}". Các khoản đã đóng góp vẫn thuộc quỹ chung và không tự động hoàn về ví.`}
        image={require('../../../../assets/images/fund-leave.png')}
        imageAspectRatio={1}
        confirmText="Rời nhóm"
        cancelText="Hủy"
        isDestructive
        onCancel={() => setLeaveConfirmVisible(false)}
        onConfirm={handleConfirmLeave}
      />

      <Modal
        visible={!!viewingTx}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingTx(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Chi tiết giao dịch</Text>

            {viewingTx && (
              <>
                <View style={styles.viewTxHeader}>
                  <FundAvatar
                    name={viewingTx.userName}
                    size={48}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalCatLabel}>Người thực hiện</Text>
                    <View style={styles.txTopRow}>
                      <Text style={styles.modalCatValue}>{viewingTx.userName}</Text>
                      {viewingTx.memberLeft && (
                        <View style={styles.leftBadge}>
                          <Text style={styles.leftBadgeText}>Đã rời nhóm</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.editMetaRow}>
                  <View style={styles.editMetaItem}>
                    <Text style={styles.modalCatLabel}>Số tiền</Text>
                    <Text style={[styles.editMetaValue, { color: TX_META[viewingTx.type].color }]}>
                      {TX_META[viewingTx.type].sign}{formatCurrency(viewingTx.amount)} ₫
                    </Text>
                  </View>
                  <View style={styles.editMetaItem}>
                    <Text style={styles.modalCatLabel}>
                      {viewingTx.type === 'WITHDRAW' ? 'Ngày rút' : 'Ngày nạp'}
                    </Text>
                    <Text style={styles.editMetaValue}>{formatDate(viewingTx.createdAt)}</Text>
                  </View>
                </View>

                <Text style={styles.modalNoteLabel}>Ghi chú</Text>
                <View style={styles.viewNoteBox}>
                  <Text style={styles.viewNoteText}>
                    {viewingTx.note?.trim() || 'Không có ghi chú'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.viewCloseBtn}
                  onPress={() => setViewingTx(null)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.viewCloseBtnText}>Đóng</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={!!editingTx}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingTx(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Chi tiết giao dịch</Text>

            {editingTx && (
              <>
                <View style={styles.viewTxHeader}>
                  <View style={[styles.txIcon, { backgroundColor: editingTx.category.bgColor }]}>
                    <Ionicons name={editingTx.category.icon as any} size={18} color={editingTx.category.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalCatLabel}>Danh mục</Text>
                    <Text style={styles.modalCatValue}>{editingTx.category.label}</Text>
                  </View>
                  <View style={styles.modalLock}>
                    <Ionicons name="lock-closed" size={12} color={FUND_PALETTE.textMuted} />
                    <Text style={styles.modalLockText}>Cố định</Text>
                  </View>
                </View>

                <View style={styles.editMetaRow}>
                  <View style={styles.editMetaItem}>
                    <Text style={styles.modalCatLabel}>Số tiền</Text>
                    <Text style={[styles.editMetaValue, { color: TX_META[editingTx.type].color }]}>
                      {TX_META[editingTx.type].sign}{formatCurrency(editingTx.amount)} ₫
                    </Text>
                  </View>
                  <View style={styles.editMetaItem}>
                    <Text style={styles.modalCatLabel}>
                      {editingTx.type === 'WITHDRAW' ? 'Ngày rút' : 'Ngày nạp'}
                    </Text>
                    <Text style={styles.editMetaValue}>{formatDate(editingTx.createdAt)}</Text>
                  </View>
                </View>

                <Text style={styles.modalNoteLabel}>Ghi chú</Text>
                <TextInput
                  style={styles.modalNoteInput}
                  value={noteDraft}
                  onChangeText={setNoteDraft}
                  placeholder="Nhập ghi chú cho giao dịch..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  maxLength={100}
                />
                <CharacterCounter value={noteDraft} maxLength={100} />

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditingTx(null)} activeOpacity={0.8}>
                    <Text style={styles.modalCancelText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalSaveBtn} onPress={saveNote} activeOpacity={0.85}>
                    <Text style={styles.modalSaveText}>Lưu ghi chú</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
