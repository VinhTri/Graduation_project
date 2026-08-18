import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { SmartSpendIcon } from '@/shared/components/SmartSpendIcon/SmartSpendIcon'
import { PASTEL_HEADER_GRADIENT, PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { formatMoney } from '@/shared/utils/moneyFormat'
import { styles } from './WalletCard.styles'

type WalletCardProps = {
  name: string
  balance: number
  accountNumber?: string | null
  limitEnabled?: boolean
  transactionLimit?: number | null
  dailyLimit?: number | null
  expanded: boolean
  onToggle: () => void
}

type WalletAction = {
  id: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  route: string
}

const ACTIONS: WalletAction[] = [
  {
    id: 'topup',
    label: 'Nạp tiền',
    icon: 'add-circle-outline',
    color: '#059669',
    route: '/wallet/top-up',
  },
  {
    id: 'withdraw',
    label: 'Rút tiền',
    icon: 'arrow-up-circle-outline',
    color: '#EA580C',
    route: '/wallet/withdraw',
  },
  {
    id: 'history',
    label: 'Lịch sử',
    icon: 'time-outline',
    color: '#7C3AED',
    route: '/wallet/history',
  },
  {
    id: 'report',
    label: 'Báo cáo',
    icon: 'pie-chart-outline',
    color: '#4F46E5',
    route: '/wallet/report',
  },
]

function formatCurrency(value: number) {
  return formatMoney(value)
}

function toPositiveLimit(value: number | null | undefined) {
  if (value == null) return null
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function WalletCard({
  name,
  balance,
  accountNumber,
  limitEnabled = false,
  transactionLimit,
  dailyLimit,
  expanded,
  onToggle,
}: WalletCardProps) {
  const router = useRouter()
  const expandAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current
  const heightAnim = useRef(new Animated.Value(expanded ? 72 : 0)).current
  const [actionsHeight, setActionsHeight] = useState(72)

  const txLimit = toPositiveLimit(transactionLimit)
  const dayLimit = toPositiveLimit(dailyLimit)
  const showLimits = limitEnabled && (txLimit != null || dayLimit != null)

  useEffect(() => {
    Animated.parallel([
      Animated.timing(expandAnim, {
        toValue: expanded ? 1 : 0,
        duration: 320,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(heightAnim, {
        toValue: expanded ? actionsHeight : 0,
        duration: 320,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
    ]).start()
  }, [actionsHeight, expandAnim, expanded, heightAnim])

  const chevronRotate = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  })

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={[...PASTEL_HEADER_GRADIENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.walletBody}
      >
        <View style={styles.decorCircle} />

        <TouchableOpacity activeOpacity={0.95} onPress={onToggle}>
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <SmartSpendIcon size={44} style={styles.brandLogo} borderRadius={12} />
              <View style={styles.brandTextWrap}>
                <Text style={styles.brandTitle}>
                  <Text style={styles.brandSmart}>Smart</Text>
                  <Text style={styles.brandSpend}>Spend</Text>
                </Text>
                <Text style={styles.cardNumber}>{name}</Text>
                {accountNumber ? (
                  <Text style={styles.cardNumber}>STK: {accountNumber}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.limitBox}>
              {showLimits ? (
                <>
                  {txLimit != null ? (
                    <View style={styles.limitRow}>
                      <Text style={styles.limitLabel}>Mỗi GD</Text>
                      <Text style={styles.limitValue} numberOfLines={1}>
                        {formatCurrency(txLimit)}
                      </Text>
                    </View>
                  ) : null}
                  {dayLimit != null ? (
                    <View style={[styles.limitRow, txLimit != null ? styles.limitRowSpacing : null]}>
                      <Text style={styles.limitLabel}>Hạn mức ngày</Text>
                      <Text style={styles.limitValue} numberOfLines={1}>
                        {formatCurrency(dayLimit)}
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={styles.limitPlaceholder} numberOfLines={2}>
                  Chưa thiết lập hạn mức
                </Text>
              )}
            </View>
          </View>

          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
            <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
          </View>

          <View style={styles.expandHint}>
            <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
              <Ionicons name="chevron-down" size={16} color={PASTEL_PALETTE.subtitle} />
            </Animated.View>
            <Text style={styles.expandHintText}>
              {expanded ? 'Thu gọn' : 'Chạm để mở thao tác'}
            </Text>
          </View>
        </TouchableOpacity>

        <Animated.View style={{ height: heightAnim, overflow: 'hidden' }}>
          <View style={styles.actionsDivider} />
          <View style={styles.actionsRow}>
            {ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionItem}
                activeOpacity={0.7}
                onPress={() => router.push(action.route as never)}
              >
                <Ionicons name={action.icon} size={22} color={action.color} />
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <View
          pointerEvents="none"
          style={styles.measureWrap}
          onLayout={(event) => {
            const next = event.nativeEvent.layout.height
            if (next > 0 && Math.abs(next - actionsHeight) > 1) {
              setActionsHeight(next)
            }
          }}
        >
          <View style={styles.actionsDivider} />
          <View style={styles.actionsRow}>
            {ACTIONS.map((action) => (
              <View key={action.id} style={styles.actionItem}>
                <Ionicons name={action.icon} size={22} color={action.color} />
                <Text style={styles.actionLabel}>{action.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  )
}
