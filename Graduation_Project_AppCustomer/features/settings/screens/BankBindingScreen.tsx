import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { BankLogo } from '@/shared/components/BankLogo/BankLogo'
import ConfirmModal from '@/shared/components/ConfirmModal/ConfirmModal'
import PinModal from '@/shared/components/PinModal/PinModal'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { useToast } from '@/shared/components/Toast'
import { getBankMeta, getBankShortName } from '@/shared/constants/commonBanks'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { getBankAccounts, unlinkBankAccount, verifyCurrentPin } from '@/shared/services'
import type { BankAccountResponse } from '@/shared/types/bankAccount'
import { styles } from './BankBindingScreen.styles'

const MAX_BANK_ACCOUNTS = 3

function maskAccount(accountNumber: string) {
  if (accountNumber.length <= 4) return accountNumber
  return `${'•'.repeat(Math.max(accountNumber.length - 4, 4))}${accountNumber.slice(-4)}`
}

export default function BankBindingScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const [accounts, setAccounts] = useState<BankAccountResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accountToUnlink, setAccountToUnlink] = useState<BankAccountResponse | null>(null)
  const [pendingUnlink, setPendingUnlink] = useState<BankAccountResponse | null>(null)
  const [pinVisible, setPinVisible] = useState(false)
  const [pinError, setPinError] = useState('')
  const [unlinking, setUnlinking] = useState(false)

  const load = useCallback(async () => {
    try {
      setError('')
      setAccounts(await getBankAccounts())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách')
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      load()
    }, [load]),
  )

  function handleConfirmUnlink() {
    if (!accountToUnlink) return
    const account = accountToUnlink
    setAccountToUnlink(null)
    setPendingUnlink(account)
    setPinError('')
    setPinVisible(true)
  }

  function closePinModal() {
    if (unlinking) return
    setPinVisible(false)
    setPinError('')
    setPendingUnlink(null)
  }

  async function handlePinConfirm(pinCode: string) {
    if (!pendingUnlink) return

    setUnlinking(true)
    setPinError('')
    try {
      await verifyCurrentPin({ currentPinCode: pinCode })
      await unlinkBankAccount(pendingUnlink.id)
      setPinVisible(false)
      setPendingUnlink(null)
      showToast({ variant: 'success', message: 'Đã hủy liên kết ngân hàng' })
      await load()
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Xác thực PIN thất bại')
    } finally {
      setUnlinking(false)
    }
  }

  function handleAddBank() {
    if (accounts.length >= MAX_BANK_ACCOUNTS) {
      showToast({
        variant: 'warning',
        message: `Liên kết ngân hàng đã đạt tối đa ${accounts.length}/${MAX_BANK_ACCOUNTS}`,
      })
      return
    }
    router.push('/settings/bank-binding/add')
  }

  return (
    <View style={styles.container}>
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={24} color="#7C3AED" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Liên kết ngân hàng</Text>
            <Text style={styles.subtitle}>Tối đa 3 tài khoản · liên kết ảo</Text>
          </View>
        </View>
      </PastelHeaderShell>

      {loading ? (
        <ActivityIndicator color={PASTEL_PALETTE.accentDeep} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Chưa có ngân hàng liên kết</Text>
              <Text style={styles.emptyText}>
                Chọn ngân hàng và nhập số tài khoản để liên kết ảo, dùng cho rút tiền.
              </Text>
            </View>
          }
          ListFooterComponent={
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleAddBank}
              activeOpacity={0.85}
            >
              <Text style={styles.addBtnText}>Thêm liên kết tài khoản ngân hàng</Text>
            </TouchableOpacity>
          }
          renderItem={({ item }) => {
            const meta = getBankMeta(item.bankCode)
            return (
              <View style={styles.card}>
                <View style={styles.cardLeft}>
                  <BankLogo
                    uri={meta?.logo}
                    shortName={getBankShortName(item.bankCode, item.bankName)}
                    size={40}
                    style={styles.logo}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bankName}>{item.bankName}</Text>
                    <Text style={styles.accountNumber}>{maskAccount(item.accountNumber)}</Text>
                    <Text style={styles.accountName}>{item.accountName}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.unlinkBtn}
                  onPress={() => setAccountToUnlink(item)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.unlinkText}>Hủy liên kết</Text>
                </TouchableOpacity>
              </View>
            )
          }}
        />
      )}

      <ConfirmModal
        visible={!!accountToUnlink}
        title="Hủy liên kết ngân hàng"
        message={
          accountToUnlink
            ? `Bạn có chắc chắn muốn ngừng liên kết ví SmartSpend với tài khoản ${accountToUnlink.bankName} · ${maskAccount(accountToUnlink.accountNumber)}?`
            : ''
        }
        confirmText="Hủy liên kết"
        cancelText="Quay lại"
        image={require('../../../assets/images/unlink-bank-hero.png')}
        isDestructive={false}
        onConfirm={handleConfirmUnlink}
        onCancel={() => setAccountToUnlink(null)}
      />

      <PinModal
        visible={pinVisible}
        onClose={closePinModal}
        onConfirm={handlePinConfirm}
        errorMessage={pinError}
        title="Xác nhận hủy liên kết"
        subtitle={
          pendingUnlink
            ? `Nhập mã PIN 6 số để xác nhận hủy liên kết tài khoản ${pendingUnlink.bankName}.`
            : 'Nhập mã PIN 6 số để xác nhận hủy liên kết.'
        }
      />
    </View>
  )
}
