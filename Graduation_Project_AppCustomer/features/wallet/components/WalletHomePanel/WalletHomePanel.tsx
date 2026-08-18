import { Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import type { WalletResponse, WalletTransactionResponse } from '@/shared/types/wallet'
import { formatMoney } from '@/shared/utils/moneyFormat'
import {
  parseWalletTxDate,
  toLocalDateKey,
} from '../../report/walletReportUtils'
import { styles } from './WalletHomePanel.styles'

const RECENT_COUNT = 5

type WalletHomePanelProps = {
  wallet: WalletResponse
  bankCount: number
  transactions: WalletTransactionResponse[]
}

function txDate(item: WalletTransactionResponse) {
  return parseWalletTxDate({
    transactionCode: item.transactionCode,
    amount: Number(item.amount) || 0,
    type: item.type,
    note: item.note,
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    categoryIcon: item.categoryIcon,
    categoryColor: item.categoryColor,
    categoryBgColor: item.categoryBgColor,
    categoryDeleted: item.categoryDeleted,
    createdAt: item.createdAt,
  })
}

function sumBy(items: WalletTransactionResponse[], type: WalletTransactionResponse['type']) {
  return items
    .filter((item) => item.type === type)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
}

function formatShortTime(iso: string) {
  const d = parseWalletTxDate({
    transactionCode: '',
    amount: 0,
    type: 'TOP_UP',
    note: null,
    categoryId: null,
    categoryName: null,
    categoryIcon: null,
    categoryColor: null,
    categoryBgColor: null,
    categoryDeleted: false,
    createdAt: iso,
  })
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function WalletHomePanel({
  wallet,
  bankCount,
  transactions,
}: WalletHomePanelProps) {
  const router = useRouter()
  const now = new Date()
  const todayKey = toLocalDateKey(now)
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const todayTxs = transactions.filter((item) => toLocalDateKey(txDate(item)) === todayKey)
  const monthTxs = transactions.filter((item) => toLocalDateKey(txDate(item)).startsWith(monthPrefix))

  const todayOut = sumBy(todayTxs, 'WITHDRAW')
  const todayIn = sumBy(todayTxs, 'TOP_UP')
  const monthOut = sumBy(monthTxs, 'WITHDRAW')
  const monthIn = sumBy(monthTxs, 'TOP_UP')

  const limitOn = wallet.limitStatus === 'ENABLED'
  const dailyLimit = Number(wallet.dailyLimit)
  const dailyUsed = Number(wallet.dailyTransactedAmount) || 0
  const hasDailyLimit = limitOn && Number.isFinite(dailyLimit) && dailyLimit > 0
  const dailyLeft = hasDailyLimit ? Math.max(0, dailyLimit - dailyUsed) : 0

  const recent = [...transactions]
    .sort((a, b) => txDate(b).getTime() - txDate(a).getTime())
    .slice(0, RECENT_COUNT)

  return (
    <View style={styles.wrap}>
      {bankCount === 0 && (
        <TouchableOpacity
          style={styles.tipBanner}
          activeOpacity={0.88}
          onPress={() => router.push('/settings/bank-binding')}
        >
          <View style={styles.tipIcon}>
            <Ionicons name="link-outline" size={18} color="#C2410C" />
          </View>
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipTitle}>Liên kết ngân hàng để rút tiền</Text>
            <Text style={styles.tipSub}>Chưa có tài khoản ngân hàng nào được gắn với ví</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#C2410C" />
        </TouchableOpacity>
      )}

      {hasDailyLimit && (
        <TouchableOpacity
          style={styles.limitBanner}
          activeOpacity={0.88}
          onPress={() => router.push('/wallet/limit-settings')}
        >
          <View style={[styles.tipIcon, styles.limitIcon]}>
            <Ionicons name="speedometer-outline" size={18} color="#6D28D9" />
          </View>
          <View style={styles.tipTextWrap}>
            <Text style={styles.limitTitle}>Hạn mức ngày</Text>
            <Text style={styles.limitSub}>
              Đã dùng {formatMoney(dailyUsed)} / {formatMoney(dailyLimit)} · còn {formatMoney(dailyLeft)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#6D28D9" />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.summaryCard}
        activeOpacity={0.9}
        onPress={() => router.push('/wallet/report')}
      >
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Tóm tắt</Text>
          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Báo cáo</Text>
            <Ionicons name="chevron-forward" size={14} color={PASTEL_PALETTE.accentDeep} />
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Hôm nay</Text>
            <Text style={styles.summaryOut}>-{formatMoney(todayOut)}</Text>
            <Text style={styles.summaryIn}>+{formatMoney(todayIn)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Tháng này</Text>
            <Text style={styles.summaryOut}>-{formatMoney(monthOut)}</Text>
            <Text style={styles.summaryIn}>+{formatMoney(monthIn)}</Text>
          </View>
        </View>
        <Text style={styles.summaryHint}>Chi · Nạp</Text>
      </TouchableOpacity>

      <View style={styles.recentCard}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
          <TouchableOpacity
            style={styles.linkRow}
            activeOpacity={0.8}
            onPress={() => router.push('/wallet/history')}
          >
            <Text style={styles.linkText}>Xem tất cả</Text>
            <Ionicons name="chevron-forward" size={14} color={PASTEL_PALETTE.accentDeep} />
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <Text style={styles.emptyRecent}>Chưa có giao dịch nào</Text>
        ) : (
          recent.map((item, index) => {
            const isTopUp = item.type === 'TOP_UP'
            return (
              <TouchableOpacity
                key={item.transactionCode}
                style={[styles.txRow, index === recent.length - 1 && styles.txRowLast]}
                activeOpacity={0.85}
                onPress={() => router.push('/wallet/history')}
              >
                <View
                  style={[
                    styles.txIcon,
                    { backgroundColor: isTopUp ? 'rgba(16,185,129,0.12)' : 'rgba(234,88,12,0.12)' },
                  ]}
                >
                  <Ionicons
                    name={isTopUp ? 'arrow-down' : 'arrow-up'}
                    size={18}
                    color={isTopUp ? '#059669' : '#EA580C'}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txTitle} numberOfLines={1}>
                    {item.categoryName?.trim() || (isTopUp ? 'Nạp tiền' : 'Rút tiền')}
                  </Text>
                  <Text style={styles.txMeta}>{formatShortTime(item.createdAt)}</Text>
                </View>
                <Text style={[styles.txAmount, { color: isTopUp ? '#059669' : '#EA580C' }]}>
                  {isTopUp ? '+' : '-'}
                  {formatMoney(Number(item.amount) || 0)}
                </Text>
              </TouchableOpacity>
            )
          })
        )}
      </View>
    </View>
  )
}
