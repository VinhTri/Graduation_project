import { type ReactNode, useMemo, useState } from 'react'
import {
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AddCategoryModal } from '@/features/categories/components/AddCategoryModal/AddCategoryModal'
import { CategorySelectModal } from '@/features/categories/components/CategorySelectModal/CategorySelectModal'
import { useCategories } from '@/features/categories/hooks/useCategories'
import type { SelectedCategory } from '@/features/notebook/types/transaction'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { BankLogo } from '@/shared/components/BankLogo/BankLogo'
import { useToast } from '@/shared/components/Toast'
import { SmartSpendIcon } from '@/shared/components/SmartSpendIcon/SmartSpendIcon'
import {
  getBankMeta,
  getBankMetaByName,
  getBankShortName,
} from '@/shared/constants/commonBanks'
import { transactionService } from '@/shared/api/services/transactionService'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { CharacterCounter } from '@/shared/components/CharacterCounter/CharacterCounter'
import { formatMoney } from '@/shared/utils/moneyFormat'
import {
  isFundDepositCategory,
  isFundWithdrawCategory,
  isInternalTransferHistory,
  isSplitCategory,
  isStructuredWalletHistory,
  walletHistoryDestination,
  walletHistoryUserNote,
} from '../utils/walletHistoryDisplay'
import { styles } from './WithdrawSuccessScreen.styles'

const RECEIPT_BG = require('../../../assets/images/wallet-receipt-bg.png')
const WALLET_TAG_HINT = require('../../../assets/images/wallet-tag-hint.png')

function paramText(value: string | string[] | undefined, fallback = '') {
  if (Array.isArray(value)) return value[0] ?? fallback
  return value ?? fallback
}

function formatAmount(value: string) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return value
  return formatMoney(amount)
}

function formatTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const time = date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const day = date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `${time}, Ngày ${day}`
}

function maskAccount(accountNumber: string) {
  const digits = accountNumber.replace(/\s/g, '')
  if (!digits || digits === '—') return accountNumber
  if (digits.length <= 4) return digits
  return `•••• ${digits.slice(-4)}`
}

function DetailRow({
  label,
  value,
  valueNode,
  muted,
  last,
  trailing,
  onPress,
}: {
  label: string
  value?: string
  valueNode?: ReactNode
  muted?: boolean
  last?: boolean
  trailing?: ReactNode
  onPress?: () => void
}) {
  const Body = (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValueWrap}>
        {valueNode ?? (
          <Text style={[styles.rowValue, muted && styles.rowValueMuted]} numberOfLines={2}>
            {value}
          </Text>
        )}
        {trailing}
        {onPress && !trailing ? (
          <Ionicons name="chevron-forward" size={15} color={PASTEL_PALETTE.lavender} />
        ) : null}
      </View>
    </View>
  )
  if (!onPress) return Body
  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
      {Body}
    </TouchableOpacity>
  )
}

export default function WithdrawSuccessScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{
    source?: string
    type?: string
    transactionCode?: string
    amount?: string
    createdAt?: string
    bankName?: string
    bankCode?: string
    bankAccountNumber?: string
    accountName?: string
    categoryId?: string
    categoryName?: string
    categoryIcon?: string
    categoryColor?: string
    categoryBgColor?: string
    note?: string
  }>()

  const source = paramText(params.source, 'withdraw')
  const type = paramText(params.type, 'WITHDRAW')
  const isWithdraw = type !== 'TOP_UP'
  const fromHistory = source === 'history'
  const { showToast } = useToast()
  const { categories, loadCategories, addGroup, addItem } = useCategories({ reloadOnFocus: false })

  const transactionCode = paramText(params.transactionCode, '—')
  const amount = paramText(params.amount, '0')
  const createdAt = paramText(params.createdAt)
  const bankNameRaw = paramText(params.bankName).trim()
  const bankName = bankNameRaw || 'Ngân hàng'
  const bankCodeParam = paramText(params.bankCode)
  const bankAccountNumber = paramText(params.bankAccountNumber, '—')
  const accountNameRaw = paramText(params.accountName)
  const accountName = accountNameRaw.trim() || '—'
  const categoryId = Number(paramText(params.categoryId))
  const categoryName = paramText(params.categoryName)
  const categoryIcon = paramText(params.categoryIcon, 'cash')
  const categoryColor = paramText(params.categoryColor, PASTEL_PALETTE.accentDeep)
  const categoryBgColor = paramText(params.categoryBgColor, PASTEL_PALETTE.accentSoft)
  const note = paramText(params.note).trim()
  const isFundDeposit = isFundDepositCategory(categoryName)
  const isFundWithdraw = isFundWithdrawCategory(categoryName)
  const isStructuredHistory = isStructuredWalletHistory(categoryName, note)
  const initialNote = walletHistoryUserNote(note, categoryName) ?? (isStructuredHistory ? '' : note)
  const [currentNote, setCurrentNote] = useState(initialNote)
  const [noteDraft, setNoteDraft] = useState(initialNote)
  const [noteModalVisible, setNoteModalVisible] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [selectCategoryOpen, setSelectCategoryOpen] = useState(false)
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<SelectedCategory | null>(() => {
    if (!Number.isFinite(categoryId) || categoryId <= 0 || !categoryName.trim()) {
      return null
    }
    return {
      id: categoryId,
      label: categoryName,
      icon: categoryIcon || 'pricetag',
      color: categoryColor || PASTEL_PALETTE.accentDeep,
      bgColor: categoryBgColor || PASTEL_PALETTE.accentSoft,
    }
  })
  const hasNote = currentNote.trim().length > 0
  const hasCategory = !!currentCategory?.id && !!currentCategory.label.trim()
  const canEditNote = fromHistory && !isStructuredHistory && transactionCode !== '—'
  const canEditCategory =
    (fromHistory || (isWithdraw && source === 'withdraw')) &&
    !isFundDeposit &&
    !isFundWithdraw &&
    !isSplitCategory(categoryName) &&
    transactionCode !== '—'

  const meta = getBankMeta(bankCodeParam) ?? getBankMetaByName(bankName)
  const bankCode = meta?.code ?? bankCodeParam
  const destinationLine = walletHistoryDestination({
    categoryName: hasCategory ? currentCategory!.label : categoryName,
    note,
    type,
    bankName,
    fromHistory,
  })
  const summaryTitle = isFundDeposit
    ? 'Nạp quỹ thành công'
    : isFundWithdraw
      ? 'Rút quỹ thành công'
      : isSplitCategory(categoryName) && isWithdraw
        ? 'Thanh toán chia tiền thành công'
        : isSplitCategory(categoryName)
          ? 'Nhận chia tiền thành công'
          : isInternalTransferHistory(categoryName, note) && isWithdraw
            ? 'Chuyển tiền thành công'
            : isInternalTransferHistory(categoryName, note)
              ? 'Nhận chuyển tiền thành công'
              : isWithdraw
                ? 'Rút tiền thành công'
                : 'Nạp tiền thành công'
  const hasRecipientInfo =
    bankAccountNumber !== '—' || accountName !== '—' || !!bankNameRaw
  const showRecipient = isWithdraw && !isStructuredHistory && hasRecipientInfo
  const showCategoryReminder =
    (isWithdraw && !fromHistory && showRecipient && !hasCategory) ||
    (fromHistory && canEditCategory && !hasCategory)
  const amountPrefix = isWithdraw ? '-' : '+'

  const categoryNode = useMemo(() => {
    if (!hasCategory || !currentCategory) return undefined
    return (
      <View
        style={[
          styles.categoryPill,
          { backgroundColor: currentCategory.bgColor || categoryBgColor },
        ]}
      >
        <Ionicons
          name={(currentCategory.icon || 'cash') as keyof typeof Ionicons.glyphMap}
          size={14}
          color={currentCategory.color || categoryColor}
        />
        <Text
          style={[styles.categoryText, { color: currentCategory.color || categoryColor }]}
          numberOfLines={1}
        >
          {currentCategory.label}
        </Text>
      </View>
    )
  }, [categoryBgColor, categoryColor, currentCategory, hasCategory])

  async function saveCategory(next: SelectedCategory) {
    if (!canEditCategory || !next.id) return
    try {
      await transactionService.updateTransaction(transactionCode, { categoryId: next.id })
      setCurrentCategory(next)
      setSelectCategoryOpen(false)
      showToast({ variant: 'success', message: 'Đã cập nhật danh mục' })
    } catch (e: any) {
      showToast({ variant: 'error', message: e?.message || 'Không thể cập nhật danh mục' })
    }
  }

  async function saveNote() {
    if (!canEditNote) return
    try {
      setSavingNote(true)
      const nextNote = noteDraft.trim()
      await transactionService.updateTransaction(transactionCode, {
        note: nextNote || undefined,
      })
      setCurrentNote(nextNote)
      setNoteModalVisible(false)
      showToast({ variant: 'success', message: 'Đã cập nhật ghi chú' })
    } catch (e: any) {
      showToast({ variant: 'error', message: e?.message || 'Không thể cập nhật ghi chú' })
    } finally {
      setSavingNote(false)
    }
  }

  function openCategoryPicker() {
    loadCategories()
    setSelectCategoryOpen(true)
  }

  function handleClose() {
    if (fromHistory) {
      if (router.canGoBack()) {
        router.back()
      } else {
        router.replace('/wallet/history')
      }
      return
    }

    if (router.canDismiss()) {
      router.dismissTo('/(tabs)/wallet')
    } else if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(tabs)/wallet')
    }
  }

  return (
    <View style={styles.container}>
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={handleClose}>
            <Ionicons name="chevron-back" size={22} color={PASTEL_PALETTE.accentDeep} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết giao dịch</Text>
          <View style={styles.headerRightSpacer} />
        </View>
      </PastelHeaderShell>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 28 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.receiptCard}>
          <Image source={RECEIPT_BG} style={styles.receiptBg} resizeMode="cover" />

          <View style={styles.receiptInner}>
            <View style={styles.successBadge}>
              <Ionicons name="checkmark" size={40} color="#FFFFFF" />
            </View>

            <Text style={styles.successTitle}>{summaryTitle}!</Text>
            <Text style={styles.successAmount}>
              {amountPrefix}
              {formatAmount(amount)}
            </Text>
            <Text style={styles.successHint}>{destinationLine}</Text>

            {showRecipient ? (
              <View style={styles.partiesBlock}>
                <View style={styles.partyRow}>
                  <View style={styles.partyAvatar}>
                    <SmartSpendIcon size={36} borderRadius={18} />
                  </View>
                  <View style={styles.partyText}>
                    <Text style={styles.partyName}>Ví SmartSpend</Text>
                    <Text style={styles.partySub}>Tài khoản nguồn</Text>
                  </View>
                </View>

                <View style={styles.partyConnector}>
                  <View style={styles.partyDotLine} />
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color={PASTEL_PALETTE.lavender}
                    style={styles.partyChevron}
                  />
                  <View style={styles.partyDotLine} />
                </View>

                <View style={styles.partyRow}>
                  <View style={styles.partyAvatar}>
                    <BankLogo
                      uri={meta?.logo}
                      shortName={getBankShortName(bankCode, bankName)}
                      size={36}
                    />
                  </View>
                  <View style={styles.partyText}>
                    <Text style={styles.partyName} numberOfLines={1}>
                      {accountName}
                    </Text>
                    <Text style={styles.partySub} numberOfLines={1}>
                      {maskAccount(bankAccountNumber)} | {bankName}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.detailsBlock}>
              <DetailRow label="Mã giao dịch" value={transactionCode} />
              <DetailRow
                label="Thời gian"
                value={createdAt ? formatTime(createdAt) : '—'}
              />
              <DetailRow label="Phí giao dịch" value="Miễn phí" />
              <DetailRow
                label="Danh mục"
                value={hasCategory ? undefined : 'Chưa thiết lập'}
                valueNode={categoryNode}
                muted={!hasCategory}
                trailing={
                  canEditCategory && !hasCategory ? (
                    <TouchableOpacity
                      style={styles.tagBtn}
                      onPress={openCategoryPicker}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="pricetag" size={12} color={PASTEL_PALETTE.accentDeep} />
                      <Text style={styles.tagBtnText}>Gắn danh mục</Text>
                    </TouchableOpacity>
                  ) : null
                }
                onPress={
                  canEditCategory
                    ? openCategoryPicker
                    : undefined
                }
              />
              <DetailRow
                label="Ghi chú"
                value={hasNote ? currentNote : 'Chưa thiết lập'}
                muted={!hasNote}
                last
                onPress={
                  canEditNote
                    ? () => {
                        setNoteDraft(currentNote)
                        setNoteModalVisible(true)
                      }
                    : undefined
                }
              />
            </View>
          </View>
        </View>

        {showCategoryReminder ? (
          <TouchableOpacity
            activeOpacity={canEditCategory ? 0.86 : 1}
            onPress={canEditCategory ? openCategoryPicker : undefined}
            disabled={!canEditCategory}
            accessibilityRole={canEditCategory ? 'button' : undefined}
            accessibilityLabel={canEditCategory ? 'Chọn danh mục cho giao dịch' : undefined}
          >
            <ImageBackground
              source={WALLET_TAG_HINT}
              style={styles.categoryReminderCard}
              imageStyle={styles.categoryReminderBackground}
              resizeMode="cover"
            >
              <View style={styles.categoryReminderContent}>
                <View style={styles.categoryReminderLabel}>
                  <Ionicons
                    name="sparkles"
                    size={12}
                    color={PASTEL_PALETTE.accentDeep}
                  />
                  <Text style={styles.categoryReminderLabelText}>
                    {canEditCategory ? 'Chạm để chọn' : 'Mẹo nhỏ'}
                  </Text>
                </View>
                <Text style={styles.categoryReminderTitle}>Đừng quên{`\n`}chọn danh mục</Text>
                <Text style={styles.categoryReminderText}>
                  Phân loại giao dịch giúp bạn{`\n`}
                  theo dõi chi tiêu chính xác và{`\n`}
                  quản lý tài chính hiệu quả hơn.
                </Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.85}>
          <Text style={styles.closeBtnText}>Đóng</Text>
        </TouchableOpacity>
      </ScrollView>

      <CategorySelectModal
        visible={selectCategoryOpen}
        categories={categories}
        onClose={() => setSelectCategoryOpen(false)}
        onSelect={(item) =>
          saveCategory({
            id: item.id,
            label: item.label,
            icon: item.icon,
            color: item.color,
            bgColor: item.bgColor,
          })
        }
        onAddCategory={() => {
          setSelectCategoryOpen(false)
          setCreateCategoryOpen(true)
        }}
      />
      <AddCategoryModal
        visible={createCategoryOpen}
        categories={categories}
        onClose={() => setCreateCategoryOpen(false)}
        onBack={() => {
          setCreateCategoryOpen(false)
          setSelectCategoryOpen(true)
        }}
        onCreateGroup={addGroup}
        onSubmit={async (payload) => {
          await addItem(payload)
          await loadCategories()
          setCreateCategoryOpen(false)
          setSelectCategoryOpen(true)
        }}
      />

      <Modal
        visible={noteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.noteOverlay}>
          <TouchableOpacity
            style={styles.noteBackdrop}
            activeOpacity={1}
            onPress={() => setNoteModalVisible(false)}
          />
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Thiết lập ghi chú</Text>
            <TextInput
              style={styles.noteInput}
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder="Nhập ghi chú..."
              placeholderTextColor={PASTEL_PALETTE.gray400}
              maxLength={100}
              multiline
            />
            <CharacterCounter value={noteDraft} maxLength={100} />
            <View style={styles.noteActions}>
              <TouchableOpacity
                style={styles.noteCancelBtn}
                onPress={() => setNoteModalVisible(false)}
                disabled={savingNote}
              >
                <Text style={styles.noteCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.noteSaveBtn, savingNote && styles.noteSaveBtnDisabled]}
                onPress={saveNote}
                disabled={savingNote}
              >
                <Text style={styles.noteSaveText}>{savingNote ? 'Đang lưu...' : 'Lưu'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}
