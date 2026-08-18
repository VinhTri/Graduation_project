import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { getBankAccounts, getDefaultWallet, getWalletTransactions } from '@/shared/services'
import type { WalletResponse, WalletTransactionResponse } from '@/shared/types/wallet'
import { WalletCard } from '../components/WalletCard/WalletCard'
import { WalletHomePanel } from '../components/WalletHomePanel/WalletHomePanel'
import { styles } from './WalletScreen.styles'

export default function WalletScreen() {
  const router = useRouter()
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const [bankCount, setBankCount] = useState(0)
  const [transactions, setTransactions] = useState<WalletTransactionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      setError('')
      const [walletData, banks, txs] = await Promise.all([
        getDefaultWallet(),
        getBankAccounts(),
        getWalletTransactions().catch(() => [] as WalletTransactionResponse[]),
      ])
      setWallet(walletData)
      setBankCount(banks.length)
      setTransactions(Array.isArray(txs) ? txs : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được thông tin ví')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [loadData]),
  )

  return (
    <View style={styles.container}>
      <PastelHeaderShell
        contentStyle={styles.headerContent}
        coverImage={require('../../../assets/images/wallet-list-header.png')}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push('/(tabs)/home')}
            activeOpacity={0.75}
          >
            <Ionicons name="chevron-back-outline" size={24} color="#7C3AED" />
          </TouchableOpacity>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Ví SmartSpend</Text>
            <Text style={styles.subtitle}>
              {bankCount > 0
                ? `${bankCount} tài khoản ngân hàng đã liên kết`
                : 'Chưa liên kết ngân hàng'}
            </Text>
          </View>
        </View>
      </PastelHeaderShell>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              loadData()
            }}
            tintColor={PASTEL_PALETTE.accentDeep}
          />
        }
      >
        {loading ? (
          <ActivityIndicator color={PASTEL_PALETTE.accentDeep} style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : wallet ? (
          <>
            <WalletCard
              name={wallet.name}
              balance={Number(wallet.balance)}
              accountNumber={wallet.accountNumber}
              limitEnabled={wallet.limitStatus === 'ENABLED'}
              transactionLimit={
                wallet.transactionLimit != null ? Number(wallet.transactionLimit) : null
              }
              dailyLimit={wallet.dailyLimit != null ? Number(wallet.dailyLimit) : null}
              expanded={expanded}
              onToggle={() => setExpanded((prev) => !prev)}
            />
            <WalletHomePanel
              wallet={wallet}
              bankCount={bankCount}
              transactions={transactions}
            />
          </>
        ) : (
          <Text style={styles.errorText}>Chưa có ví SmartSpend</Text>
        )}
      </ScrollView>
    </View>
  )
}
