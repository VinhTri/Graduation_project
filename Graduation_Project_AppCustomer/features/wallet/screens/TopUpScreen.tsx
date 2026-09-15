import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { transactionService, type TopUpResponse } from '@/shared/api/services/transactionService'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { moneyFlowStyles as styles } from '../styles/moneyFlow.styles'

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return 'Không thể tạo mã QR SePay'
}

export default function TopUpScreen() {
  const router = useRouter()
  const [topUp, setTopUp] = useState<TopUpResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadQr = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await transactionService.initiateTopUp({})
      if (!result.qrUrl || !result.transferContent) {
        throw new Error('Backend chưa trả về mã QR SePay')
      }
      setTopUp(result)
    } catch (requestError) {
      setTopUp(null)
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQr()
  }, [loadQr])

  return (
    <View style={styles.container}>
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={PASTEL_PALETTE.accentDeep} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Nạp tiền</Text>
            <Text style={styles.subtitle}>Quét QR và nhập số tiền trong ứng dụng ngân hàng</Text>
          </View>
        </View>
      </PastelHeaderShell>

      {loading ? (
        <View style={styles.sepayLoadingState}>
          <ActivityIndicator size="large" color={PASTEL_PALETTE.accentDeep} />
          <Text style={styles.sepayLoadingText}>Đang tạo mã QR SePay...</Text>
        </View>
      ) : error || !topUp ? (
        <View style={styles.sepayLoadingState}>
          <Ionicons name="cloud-offline-outline" size={44} color="#A78BBA" />
          <Text style={styles.sepayErrorTitle}>Chưa tạo được mã QR</Text>
          <Text style={styles.sepayLoadingText}>{error}</Text>
          <TouchableOpacity style={styles.sepayRetryButton} onPress={loadQr}>
            <Text style={styles.sepayRetryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.sepayContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sepayCard}>
            <View style={styles.sepayBrandRow}>
              <View style={styles.sepayBrandIcon}>
                <Ionicons name="qr-code-outline" size={24} color={PASTEL_PALETTE.accentDeep} />
              </View>
              <View style={styles.sepayBrandCopy}>
                <Text style={styles.sepayBrandTitle}>Nạp tiền qua SePay</Text>
                <Text style={styles.sepayBrandSubtitle}>QR không cố định số tiền</Text>
              </View>
              <View style={styles.sepayLiveBadge}>
                <View style={styles.sepayLiveDot} />
                <Text style={styles.sepayLiveText}>SẴN SÀNG</Text>
              </View>
            </View>

            <View style={styles.sepayQrFrame}>
              <Image source={{ uri: topUp.qrUrl }} style={styles.sepayQrImage} resizeMode="contain" />
            </View>
            <View style={styles.sepayTransferBox}>
              <Text style={styles.sepayTransferLabel}>Nội dung chuyển khoản</Text>
              <Text style={styles.sepayTransferContent} selectable>{topUp.transferContent}</Text>
            </View>
            <View style={styles.sepayNotice}>
              <Ionicons name="shield-checkmark-outline" size={19} color="#36735A" />
              <Text style={styles.sepayNoticeText}>
                Giữ nguyên nội dung chuyển khoản và tự nhập số tiền muốn nạp. Ví chỉ được cộng tiền sau khi SePay xác nhận.
              </Text>
            </View>
          </View>

        </ScrollView>
      )}
    </View>
  )
}
