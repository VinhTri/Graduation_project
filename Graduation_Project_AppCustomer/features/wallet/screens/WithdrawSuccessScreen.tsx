import { type ReactNode } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { BankLogo } from '@/shared/components/BankLogo/BankLogo'
import { SmartSpendIcon } from '@/shared/components/SmartSpendIcon/SmartSpendIcon'
import {
  getBankMeta,
  getBankMetaByName,
  getBankShortName,
} from '@/shared/constants/commonBanks'
import { PASTEL_HEADER_GRADIENT, PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { formatMoney } from '@/shared/utils/moneyFormat'
import {
  isFundDepositCategory,
  isFundWithdrawCategory,
  isSplitCategory,
  isStructuredWalletHistory,
  isTransferInCategory,
  isTransferOutCategory,
  walletHistoryDestination,
  walletHistoryUserNote,
} from '../utils/walletHistoryDisplay'
import { styles } from './WithdrawSuccessScreen.styles'

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
  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const day = date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `${time} - ${day}`
}

function DetailRow({
  label,
  value,
  valueNode,
  muted,
  last,
}: {
  label: string
  value?: string
  valueNode?: ReactNode
  muted?: boolean
  last?: boolean
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      {valueNode ?? (
        <Text style={[styles.rowValue, muted && styles.rowValueMuted]} numberOfLines={2}>
          {value}
        </Text>
      )}
    </View>
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

  const transactionCode = paramText(params.transactionCode, '—')
  const amount = paramText(params.amount, '0')
  const createdAt = paramText(params.createdAt)
  const bankName = paramText(params.bankName, 'Ngân hàng')
  const bankCodeParam = paramText(params.bankCode)
  const bankAccountNumber = paramText(params.bankAccountNumber, '—')
  const accountNameRaw = paramText(params.accountName)
  const accountName = accountNameRaw.trim() || '—'
  const categoryName = paramText(params.categoryName)
  const categoryIcon = paramText(params.categoryIcon, 'cash')
  const categoryColor = paramText(params.categoryColor, PASTEL_PALETTE.accentDeep)
  const categoryBgColor = paramText(params.categoryBgColor, PASTEL_PALETTE.accentSoft)
  const note = paramText(params.note).trim()
  const isFundDeposit = isFundDepositCategory(categoryName)
  const isFundWithdraw = isFundWithdrawCategory(categoryName)
  const isStructuredHistory = isStructuredWalletHistory(categoryName, note)
  const displayNote = walletHistoryUserNote(note, categoryName) ?? (isStructuredHistory ? '' : note)
  const hasNote = displayNote.length > 0

  const meta =
    getBankMeta(bankCodeParam) ?? getBankMetaByName(bankName)
  const bankCode = meta?.code ?? bankCodeParam
  const destinationLine = walletHistoryDestination({
    categoryName,
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
          : isTransferOutCategory(categoryName)
            ? 'Chuyển tiền thành công'
            : isTransferInCategory(categoryName)
              ? 'Nhận chuyển tiền thành công'
              : isWithdraw
                ? 'Rút tiền thành công'
                : 'Nạp tiền thành công'
  const showRecipient = isWithdraw && !fromHistory && !isStructuredHistory && !!bankAccountNumber && bankAccountNumber !== '—'
  const amountPrefix = isWithdraw ? '-' : '+'

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
        <View style={styles.card}>
          <LinearGradient
            colors={['#86EFAC', '#4ADE80']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.successStrip}
          />

          <View style={styles.summaryBlock}>
            <View style={styles.summaryTop}>
              <View style={styles.logoWrap}>
                <SmartSpendIcon size={48} borderRadius={14} />
              </View>
              <View style={styles.summaryTextWrap}>
                <Text style={styles.summaryTitle}>{summaryTitle}</Text>
                <Text style={styles.summarySubtitle} numberOfLines={2}>
                  {destinationLine}
                </Text>
              </View>
            </View>
            <Text style={styles.summaryAmount}>
              {amountPrefix}
              {formatAmount(amount)}
            </Text>
          </View>

          <View style={styles.detailsBlock}>
            <DetailRow
              label="Trạng thái"
              valueNode={
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Thành công</Text>
                </View>
              }
            />
            <DetailRow label="Thời gian" value={createdAt ? formatTime(createdAt) : '—'} />
            <DetailRow label="Mã giao dịch" value={transactionCode} />
            <DetailRow label="Tài khoản/thẻ" value="Ví SmartSpend" />
            <DetailRow label="Phí giao dịch" value="Miễn phí" />
            <DetailRow
              label="Danh mục"
              valueNode={
                <View style={[styles.categoryPill, { backgroundColor: categoryBgColor }]}>
                  <Ionicons
                    name={categoryIcon as keyof typeof Ionicons.glyphMap}
                    size={14}
                    color={categoryColor}
                  />
                  <Text style={[styles.categoryText, { color: categoryColor }]} numberOfLines={1}>
                    {categoryName || '—'}
                  </Text>
                </View>
              }
            />
            <DetailRow
              label="Ghi chú"
              value={hasNote ? displayNote : 'Chưa thiết lập'}
              muted={!hasNote}
              last
            />
          </View>
        </View>

        {showRecipient ? (
          <View style={styles.card}>
            <LinearGradient
              colors={[...PASTEL_HEADER_GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.recipientBanner}
            >
              <BankLogo
                uri={meta?.logo}
                shortName={getBankShortName(bankCode, bankName)}
                size={40}
              />
              <View style={styles.recipientBannerText}>
                <Text style={styles.recipientBannerLabel}>Tài khoản nhận</Text>
                <Text style={styles.recipientBannerName} numberOfLines={1}>
                  {accountName}
                </Text>
              </View>
            </LinearGradient>

            <View style={styles.detailsBlock}>
              <DetailRow label="Số tài khoản" value={bankAccountNumber} />
              <DetailRow label="Ngân hàng" value={bankName} />
              <DetailRow label="Người nhận" value={accountName} />
              <DetailRow label="Số tiền" value={formatAmount(amount)} last />
            </View>
          </View>
        ) : null}

        <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.85}>
          <Text style={styles.closeBtnText}>Đóng</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}
