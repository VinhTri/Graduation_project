import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FundHeaderShell, FundAvatar, FundProgressBar, InviteFriendsModal } from '../../components';
import { ConfirmModal } from '../../../../shared/components';
import { fundStore, useFund } from '../../store/fundStore';
import { formatCurrency } from '../../utils';
import { FUND_PALETTE } from '../../theme';
import { MAX_FUND_MEMBERS } from '../../constants';
import { FundMember, FundTransaction } from '../../types';
import { styles } from './FundDetailScreen.styles';

const TX_META: Record<FundTransaction['type'], { icon: keyof typeof Feather.glyphMap; color: string; bg: string; sign: string; label: string }> = {
  DEPOSIT: { icon: 'arrow-down-left', color: FUND_PALETTE.success, bg: '#DCFCE7', sign: '+', label: 'Nạp vào quỹ' },
  WITHDRAW: { icon: 'arrow-up-right', color: FUND_PALETTE.danger, bg: '#FEE2E2', sign: '-', label: 'Rút khỏi quỹ' },
  EXPENSE: { icon: 'shopping-bag', color: FUND_PALETTE.accent, bg: FUND_PALETTE.accentSoft, sign: '-', label: 'Chi tiêu' },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} · ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export function FundDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const fund = useFund(Number(id));
  const [tab, setTab] = useState<'members' | 'history'>('members');
  const [editingTx, setEditingTx] = useState<FundTransaction | null>(null);
  const [viewingTx, setViewingTx] = useState<FundTransaction | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);
  const [mustWithdrawVisible, setMustWithdrawVisible] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');
  const [inviteVisible, setInviteVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('userName').then((name) => setCurrentUserName(name || ''));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fundStore.refreshFund(Number(id)).catch(() => {});
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
    if (currentUserName && tx.userName === currentUserName) {
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
    if (fund.balance > 0) {
      setMustWithdrawVisible(true);
      return;
    }
    setDeleteConfirmVisible(true);
  };

  const handlePressLeave = () => {
    setMenuVisible(false);
    setLeaveConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    const result = await fundStore.deleteFund(Number(id));
    setDeleteConfirmVisible(false);
    if (!result.ok) {
      if (result.reason === 'HAS_BALANCE') {
        setMustWithdrawVisible(true);
        return;
      }
      Alert.alert('Không thể xóa', result.message || 'Bạn không có quyền xóa quỹ này.');
      return;
    }
    router.replace('/(tabs)/funds');
  };

  const handleConfirmLeave = async () => {
    const result = await fundStore.leaveFund(Number(id));
    setLeaveConfirmVisible(false);
    if (!result.ok) {
      Alert.alert('Không thể rời nhóm', result.message || 'Vui lòng thử lại.');
      return;
    }
    router.replace('/(tabs)/funds');
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
          onPress={() => router.replace('/(tabs)/funds')} 
          style={{ backgroundColor: '#F472B6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, elevation: 2, shadowColor: '#F472B6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>Quay về danh sách quỹ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasTarget = !!fund.targetAmount && fund.targetAmount > 0;
  const progress = hasTarget ? fund.balance / (fund.targetAmount as number) : 0;
  const activeMembers = fund.members.filter((m) => m.status !== 'LEFT');
  const occupiedSlots = fund.members.filter(
    (m) => m.status === 'ACTIVE' || m.status === 'INVITED'
  ).length;
  const memberLimitReached = occupiedSlots >= MAX_FUND_MEMBERS;

  const renderMember = (member: FundMember) => (
    <View key={member.id} style={styles.memberRow}>
      <FundAvatar name={member.name} avatarUrl={member.avatarUrl} size={44} seed={member.id} />
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
    const isMine = !!currentUserName && tx.userName === currentUserName;
    return (
      <TouchableOpacity
        key={tx.id}
        style={styles.txRow}
        activeOpacity={0.7}
        onPress={() => handlePressTx(tx)}
      >
        <FundAvatar name={tx.userName} avatarUrl={tx.avatarUrl} size={44} seed={tx.userName.charCodeAt(0)} />
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFD6EC" />

      <FundHeaderShell contentStyle={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="chevron-back-outline" size={24} color="#7C3AED" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>{fund.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => setMenuVisible(true)}
          >
            <Feather name="more-horizontal" size={22} color={FUND_PALETTE.subtitle} />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceBlock}>
          <Text style={styles.balanceLabel}>Số dư quỹ hiện tại</Text>
          <Text style={styles.balanceValue}>{formatCurrency(fund.balance)} ₫</Text>

          {hasTarget && (
            <View style={styles.progressWrap}>
              <FundProgressBar
                progress={progress}
                height={10}
                trackColor="rgba(124,58,237,0.15)"
                fillColor={FUND_PALETTE.primary}
              />
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>{Math.round(progress * 100)}% hoàn thành</Text>
                <Text style={styles.progressText}>Mục tiêu {formatCurrency(fund.targetAmount as number)} ₫</Text>
              </View>
            </View>
          )}
        </View>
      </FundHeaderShell>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            activeOpacity={0.85}
            onPress={() => router.push(`/funds/deposit?id=${fund.id}`)}
          >
            <View style={styles.quickActionIcon}>
              <Feather name="plus" size={16} color={FUND_PALETTE.primaryDeep} />
            </View>
            <Text style={styles.quickActionText}>Nạp</Text>
          </TouchableOpacity>

          {fund.isOwner && (
            <TouchableOpacity
              style={styles.quickAction}
              activeOpacity={0.85}
              onPress={() => router.push(`/funds/withdraw?id=${fund.id}`)}
            >
              <View style={styles.quickActionIcon}>
                <Feather name="arrow-up" size={16} color={FUND_PALETTE.primaryDeep} />
              </View>
              <Text style={styles.quickActionText}>Rút</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.quickAction, memberLimitReached && styles.quickActionDisabled]}
            activeOpacity={memberLimitReached ? 1 : 0.85}
            disabled={memberLimitReached}
            onPress={() => {
              if (memberLimitReached) return;
              setInviteVisible(true);
            }}
          >
            <View style={[styles.quickActionIcon, memberLimitReached && styles.quickActionIconDisabled]}>
              <Feather
                name="user-plus"
                size={15}
                color={memberLimitReached ? FUND_PALETTE.textMuted : FUND_PALETTE.primaryDeep}
              />
            </View>
            <Text style={[styles.quickActionText, memberLimitReached && styles.quickActionTextDisabled]}>
              Mời
            </Text>
          </TouchableOpacity>
        </View>

        {memberLimitReached && (
          <Text style={styles.memberLimitHint}>
            Thành viên đã đạt tối đa ({MAX_FUND_MEMBERS}/{MAX_FUND_MEMBERS})
          </Text>
        )}

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, tab === 'members' && styles.tabActive]}
            onPress={() => setTab('members')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === 'members' && styles.tabTextActive]}>
              Thành viên ({occupiedSlots}/{MAX_FUND_MEMBERS})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'history' && styles.tabActive]}
            onPress={() => setTab('history')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
              Lịch sử
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {tab === 'members'
            ? activeMembers.map(renderMember)
            : fund.transactions.length > 0
              ? fund.transactions.map(renderTransaction)
              : (
                <View style={styles.emptyBlock}>
                  <Feather name="clock" size={28} color={FUND_PALETTE.textMuted} />
                  <Text style={styles.emptyBlockText}>Chưa có giao dịch nào</Text>
                </View>
              )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

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
                  <Text style={styles.menuItemDangerText}>Xóa quỹ</Text>
                  <Text style={styles.menuItemSub}>Chỉ xóa được khi số dư = 0</Text>
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
                  <Text style={styles.menuItemSub}>Bạn sẽ không còn là thành viên quỹ này</Text>
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
        title="Xác nhận xóa quỹ"
        message={`Bạn có chắc muốn xóa quỹ "${fund.name}"? Hành động này không thể hoàn tác.`}
        iconName="trash"
        confirmText="Xóa quỹ"
        cancelText="Hủy"
        isDestructive
        onCancel={() => setDeleteConfirmVisible(false)}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmModal
        visible={leaveConfirmVisible}
        title="Rời nhóm?"
        message={`Bạn có chắc muốn rời quỹ "${fund.name}"?`}
        iconName="exit-outline"
        confirmText="Rời nhóm"
        cancelText="Hủy"
        isDestructive
        onCancel={() => setLeaveConfirmVisible(false)}
        onConfirm={handleConfirmLeave}
      />

      <ConfirmModal
        visible={mustWithdrawVisible}
        title="Chưa thể xóa quỹ"
        message={`Quỹ còn ${formatCurrency(fund.balance)} ₫. Bạn phải rút hết tiền về ví trước khi xóa quỹ.`}
        iconName="wallet"
        iconColor={FUND_PALETTE.primaryDeep}
        confirmText="Rút tiền ngay"
        cancelText="Để sau"
        isDestructive={false}
        onCancel={() => setMustWithdrawVisible(false)}
        onConfirm={() => {
          setMustWithdrawVisible(false);
          router.push(`/funds/withdraw?id=${fund.id}`);
        }}
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
                    avatarUrl={viewingTx.avatarUrl}
                    size={48}
                    seed={viewingTx.userName.charCodeAt(0)}
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

      <InviteFriendsModal
        visible={inviteVisible}
        fundId={fund.id}
        members={fund.members}
        onClose={() => setInviteVisible(false)}
        onInvited={() => fundStore.refreshFund(fund.id).catch(() => {})}
      />
    </View>
  );
}
