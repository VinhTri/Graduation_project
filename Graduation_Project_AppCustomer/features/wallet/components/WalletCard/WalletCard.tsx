import { Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { SmartSpendIcon } from '@/shared/components/SmartSpendIcon/SmartSpendIcon'
import { formatMoney } from '@/shared/utils/moneyFormat'
import { styles } from './WalletDashboardCard.styles'

type WalletCardProps = {
  name: string
  balance: number
  accountNumber?: string | null
  limitEnabled?: boolean
  transactionLimit?: number | null
  dailyLimit?: number | null
}

const ACTIONS = [
  { id: 'topup', label: 'Nạp tiền', icon: 'add' as const, route: '/wallet/top-up', accent: 'green' },
  { id: 'withdraw', label: 'Rút tiền', icon: 'arrow-up' as const, route: '/wallet/withdraw', accent: 'orange' },
  { id: 'history', label: 'Lịch sử', icon: 'time-outline' as const, route: '/wallet/history', accent: 'purple' },
  {
    id: 'report',
    label: 'Báo cáo',
    icon: 'stats-chart-outline' as const,
    route: '/finance-center?tab=cashflow',
    accent: 'blue',
  },
] as const

function positiveLimit(value: number | null | undefined) {
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

export function WalletCard({
  name,
  balance,
  accountNumber,
  limitEnabled = false,
  transactionLimit,
  dailyLimit,
}: WalletCardProps) {
  const router = useRouter()
  const perTransaction = limitEnabled ? positiveLimit(transactionLimit) : null
  const perDay = limitEnabled ? positiveLimit(dailyLimit) : null

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.identityRow}>
          <SmartSpendIcon size={42} borderRadius={13} />
          <View style={styles.identityCopy}>
            <Text style={styles.walletName} numberOfLines={1}>{name || 'Ví SmartSpend'}</Text>
            <Text style={styles.walletType}>Tài khoản chính</Text>
          </View>
        </View>
        <View style={styles.activeStatus}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>Hoạt động</Text>
        </View>
      </View>

      <View style={styles.balanceBlock}>
        <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
        <Text style={styles.balanceValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
          {formatMoney(balance)}
        </Text>
        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>STK</Text>
          <Text style={styles.accountNumber} selectable numberOfLines={1}>
            {accountNumber || 'Chưa thiết lập'}
          </Text>
          {accountNumber ? <Ionicons name="copy-outline" size={14} color="#8B5CF6" /> : null}
        </View>
        {accountNumber ? <Text style={styles.copyHint}>Nhấn giữ số tài khoản để sao chép</Text> : null}
      </View>

      <View style={styles.limitGrid}>
        <View style={styles.limitCell}>
          <View style={styles.limitLabelRow}>
            <Ionicons name="swap-horizontal-outline" size={14} color="#7C3AED" />
            <Text style={styles.limitLabel}>Mỗi giao dịch</Text>
          </View>
          <Text style={styles.limitValue} numberOfLines={1} adjustsFontSizeToFit>
            {perTransaction ? formatMoney(perTransaction) : 'Chưa thiết lập'}
          </Text>
        </View>
        <View style={styles.limitDivider} />
        <View style={styles.limitCell}>
          <View style={styles.limitLabelRow}>
            <Ionicons name="calendar-clear-outline" size={14} color="#7C3AED" />
            <Text style={styles.limitLabel}>Hạn mức ngày</Text>
          </View>
          <Text style={styles.limitValue} numberOfLines={1} adjustsFontSizeToFit>
            {perDay ? formatMoney(perDay) : 'Chưa thiết lập'}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        {ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.action}
            activeOpacity={0.76}
            onPress={() => router.push(action.route as never)}
          >
            <View style={[styles.actionIcon, styles[`${action.accent}Action`]]}>
              <Ionicons name={action.icon} size={19} color={styles[`${action.accent}Text`].color} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}
