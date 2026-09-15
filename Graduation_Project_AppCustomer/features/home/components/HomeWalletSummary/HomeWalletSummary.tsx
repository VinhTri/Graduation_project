import React, { useCallback, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { SmartSpendIcon } from '@/shared/components/SmartSpendIcon'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { useLanguage, useTheme } from '@/shared/contexts/ThemeLanguageContext'
import { useMoneyFormat } from '@/shared/contexts/MoneyFormatContext'
import { fundService } from '@/shared/api/services/fundService'
import { getCashNotebook } from '@/shared/services/notebook.service'
import { getDefaultWalletBalance } from '@/shared/services/wallet.service'
import { styles } from './HomeWalletSummary.styles'
import { BorderPiggy, useBorderPiggy } from './BorderPiggy'

const CARD_RADIUS = 20

export const HomeWalletSummary = () => {
  const router = useRouter()
  const { language } = useLanguage()
  const { theme } = useTheme()
  const { formatMoney } = useMoneyFormat()
  const isEn = language === 'en'
  const { pigStyle, onLayout, playLap } = useBorderPiggy(CARD_RADIUS)

  const [isBalanceVisible, setIsBalanceVisible] = useState(true)
  const [walletBalance, setWalletBalance] = useState(0)
  const [notebookBalance, setNotebookBalance] = useState(0)
  const [fundBalance, setFundBalance] = useState(0)

  const loadBalances = useCallback(async () => {
    const [wallet, notebook, funds] = await Promise.allSettled([
      getDefaultWalletBalance(),
      getCashNotebook(),
      fundService.listMyFunds(),
    ])

    setWalletBalance(wallet.status === 'fulfilled' ? wallet.value : 0)
    setNotebookBalance(
      notebook.status === 'fulfilled' ? Number(notebook.value.balance) || 0 : 0,
    )
    setFundBalance(
      funds.status === 'fulfilled'
        ? funds.value.reduce((sum, fund) => sum + (Number(fund.balance) || 0), 0)
        : 0,
    )
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadBalances()
      playLap()
    }, [loadBalances, playLap]),
  )

  const total = walletBalance + notebookBalance + fundBalance
  const display = (value: number) => (isBalanceVisible ? formatMoney(value) : '••••')

  const tiles = [
    {
      key: 'wallet',
      label: isEn ? 'Wallet' : 'Ví',
      amount: walletBalance,
      onPress: () => router.push('/wallet'),
      icon: <SmartSpendIcon size={18} borderRadius={5} />,
    },
    {
      key: 'notebook',
      label: isEn ? 'Cash' : 'Sổ tay',
      amount: notebookBalance,
      onPress: () => router.push('/(tabs)/notebook'),
      icon: <Ionicons name="book-outline" size={14} color={PASTEL_PALETTE.accentDeep} />,
    },
    {
      key: 'funds',
      label: isEn ? 'Funds' : 'Quỹ',
      amount: fundBalance,
      onPress: () => router.push('/(tabs)/funds'),
      icon: <MaterialCommunityIcons name="piggy-bank-outline" size={15} color={PASTEL_PALETTE.accentDeep} />,
    },
  ]

  return (
    <View
      style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
      onLayout={onLayout}
    >
      <View style={styles.totalRow}>
        <View style={styles.totalCopy}>
          <Text style={[styles.totalLabel, { color: theme.textMuted }]}>
            {isEn ? 'Total' : 'Tổng số dư'}
          </Text>
          <Text
            style={[styles.totalValue, { color: theme.textPrimary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {display(total)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsBalanceVisible((prev) => !prev)}
          hitSlop={10}
          style={styles.eyeBtn}
        >
          <Ionicons
            name={isBalanceVisible ? 'eye-outline' : 'eye-off-outline'}
            size={18}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.tiles}>
        {tiles.map((tile) => (
          <TouchableOpacity
            key={tile.key}
            style={[styles.tile, { borderColor: theme.cardBorder }]}
            activeOpacity={0.75}
            onPress={tile.onPress}
          >
            <View style={styles.tileHead}>
              {tile.icon}
              <Text style={[styles.tileLabel, { color: theme.textMuted }]} numberOfLines={1}>
                {tile.label}
              </Text>
            </View>
            <Text
              style={[styles.tileAmount, { color: theme.textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
            >
              {display(tile.amount)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.centerLink}
        activeOpacity={0.75}
        onPress={() => router.push('/finance-center')}
      >
        <Text style={[styles.centerLinkText, { color: theme.primary }]}>
          {isEn ? 'Financial center' : 'Trung tâm tài chính'}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={theme.primary} />
      </TouchableOpacity>

      <BorderPiggy pigStyle={pigStyle} />
    </View>
  )
}

export default HomeWalletSummary
