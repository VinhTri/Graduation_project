import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { moneyFlowStyles as styles } from '../styles/moneyFlow.styles'

type Props = {
  enabled: boolean
  transactionLimit: number | null
  dailyLimit: number | null
  dailyTransactedAmount: number
  withdrawAmount: number
}

function getLimitProgress(used: number, limit: number) {
  if (limit <= 0) {
    return { progressPercentage: 0, remaining: 0, remainingPercent: 0 }
  }
  const progressPercentage = Math.min(100, (used / limit) * 100)
  const remaining = Math.max(0, limit - used)
  const remainingPercent = Math.max(0, 100 - progressPercentage)
  return { progressPercentage, remaining, remainingPercent }
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <View style={styles.limitProgressTrack}>
      <View
        style={[
          styles.limitProgressFill,
          {
            backgroundColor: percent >= 100 ? '#EF4444' : PASTEL_PALETTE.accentDeep,
            width: `${percent}%`,
          },
        ]}
      />
    </View>
  )
}

export function WalletLimitPanel({
  enabled,
  transactionLimit,
  dailyLimit,
  dailyTransactedAmount,
  withdrawAmount,
}: Props) {
  const hasTransactionLimit = Boolean(enabled && transactionLimit && transactionLimit > 0)
  const hasDailyLimit = Boolean(enabled && dailyLimit && dailyLimit > 0)
  const hasLimitsConfigured = hasTransactionLimit || hasDailyLimit

  const [expanded, setExpanded] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const expandAnim = useRef(new Animated.Value(0)).current
  const heightAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!hasLimitsConfigured) return
    Animated.parallel([
      Animated.timing(expandAnim, {
        toValue: expanded ? 1 : 0,
        duration: 320,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(heightAnim, {
        toValue: expanded ? contentHeight : 0,
        duration: 320,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
    ]).start()
  }, [hasLimitsConfigured, expanded, contentHeight, expandAnim, heightAnim])

  const chevronRotate = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  })
  const contentOpacity = expandAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.6, 1],
  })
  const contentTranslateY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 0],
  })

  const summaryParts: string[] = []
  if (hasTransactionLimit) {
    summaryParts.push(`Mỗi GD: ${transactionLimit!.toLocaleString('vi-VN')} ₫`)
  }
  if (hasDailyLimit) {
    summaryParts.push(`Ngày: ${dailyLimit!.toLocaleString('vi-VN')} ₫`)
  }

  const txProgress = hasTransactionLimit
    ? getLimitProgress(withdrawAmount, transactionLimit!)
    : null
  const dailyProgress = hasDailyLimit
    ? getLimitProgress(dailyTransactedAmount, dailyLimit!)
    : null

  const details = (
    <>
      <View style={styles.limitRow}>
        <Text style={styles.limitLabel}>Hạn mức mỗi lần giao dịch</Text>
        {hasTransactionLimit ? (
          <Text style={styles.limitValue}>{transactionLimit!.toLocaleString('vi-VN')} ₫</Text>
        ) : (
          <Text style={styles.limitPlaceholder}>Chưa thiết lập</Text>
        )}
      </View>

      {hasTransactionLimit && txProgress ? (
        <>
          <View style={styles.limitStatsRow}>
            <View style={styles.limitStatBlock}>
              <Text style={styles.limitStatLabel}>Số tiền đang rút</Text>
              <Text style={styles.limitStatValue}>
                {withdrawAmount.toLocaleString('vi-VN')} ₫
              </Text>
            </View>
            <View style={styles.limitStatBlockEnd}>
              <Text style={styles.limitStatLabel}>Hạn mức còn lại</Text>
              <Text style={styles.limitStatValue}>
                {txProgress.remaining.toLocaleString('vi-VN')} ₫
              </Text>
            </View>
          </View>
          <ProgressBar percent={txProgress.progressPercentage} />
          <Text style={[styles.limitStatLabel, styles.limitStatHint]}>
            {Math.round(txProgress.remainingPercent)}% còn lại
          </Text>
        </>
      ) : null}

      <View style={[styles.limitRow, styles.limitRowSpacing]}>
        <Text style={styles.limitLabel}>Hạn mức giao dịch / ngày</Text>
        {hasDailyLimit ? (
          <Text style={styles.limitValue}>{dailyLimit!.toLocaleString('vi-VN')} ₫</Text>
        ) : (
          <Text style={styles.limitPlaceholder}>Chưa thiết lập</Text>
        )}
      </View>

      {hasDailyLimit && dailyProgress ? (
        <>
          <View style={styles.limitStatsRow}>
            <View style={styles.limitStatBlock}>
              <Text style={styles.limitStatLabel}>Đã giao dịch trong ngày</Text>
              <Text style={styles.limitStatValue}>
                {dailyTransactedAmount.toLocaleString('vi-VN')} ₫
              </Text>
            </View>
            <View style={styles.limitStatBlockEnd}>
              <Text style={styles.limitStatLabel}>Hạn mức còn lại</Text>
              <Text style={styles.limitStatValue}>
                {dailyProgress.remaining.toLocaleString('vi-VN')} ₫
              </Text>
            </View>
          </View>
          <ProgressBar percent={dailyProgress.progressPercentage} />
          <Text style={[styles.limitStatLabel, styles.limitStatHint]}>
            {Math.round(dailyProgress.remainingPercent)}% còn lại
          </Text>
        </>
      ) : null}
    </>
  )

  return (
    <View style={styles.limitSection}>
      <View style={styles.limitDivider} />
      {hasLimitsConfigured ? (
        <>
          <TouchableOpacity
            style={styles.limitToggleRow}
            activeOpacity={0.85}
            onPress={() => setExpanded((prev) => !prev)}
          >
            <View style={styles.limitToggleTextWrap}>
              <Text style={styles.limitToggleTitle}>Hạn mức giao dịch</Text>
              {!expanded ? (
                <Text style={styles.limitToggleSummary} numberOfLines={1}>
                  {summaryParts.join(' · ')}
                </Text>
              ) : null}
            </View>
            <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
              <Ionicons name="chevron-down" size={18} color={PASTEL_PALETTE.subtitle} />
            </Animated.View>
          </TouchableOpacity>

          <Animated.View style={{ height: heightAnim, overflow: 'hidden' }}>
            <Animated.View
              style={{
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              }}
            >
              <View style={styles.limitDetails}>{details}</View>
            </Animated.View>
          </Animated.View>

          <View
            pointerEvents="none"
            style={styles.limitMeasureWrap}
            onLayout={(event) => {
              const next = event.nativeEvent.layout.height
              if (next > 0 && Math.abs(next - contentHeight) > 1) {
                setContentHeight(next)
              }
            }}
          >
            <View style={styles.limitDetails}>{details}</View>
          </View>
        </>
      ) : (
        <Text style={styles.limitPlaceholder}>Chưa thiết lập hạn mức</Text>
      )}
    </View>
  )
}
