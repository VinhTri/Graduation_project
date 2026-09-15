import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import {
  continueAccountUnlock,
  getAccountLockModalState,
  subscribeAccountLockModal,
  type AccountLockModalState,
} from '@/features/auth/accountLock'

export function AccountLockedModal() {
  const [state, setState] = useState<AccountLockModalState>(getAccountLockModalState())
  const [continuing, setContinuing] = useState(false)
  const [displayVisible, setDisplayVisible] = useState(false)

  useEffect(() => subscribeAccountLockModal((next) => {
    setState(next)
    if (next.visible) setContinuing(false)
  }), [])

  useEffect(() => {
    if (!state.visible) {
      setDisplayVisible(false)
      return
    }
    const timer = setTimeout(() => setDisplayVisible(true), 220)
    return () => clearTimeout(timer)
  }, [state.visible])

  const handleContinue = () => {
    if (continuing) return
    setContinuing(true)
    continueAccountUnlock()
  }

  return (
    <Modal visible={displayVisible} transparent animationType="fade" statusBarTranslucent
      hardwareAccelerated onRequestClose={() => undefined}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.imageHalo}>
            <Image source={require('../../../assets/images/security/account-locked.png')}
              style={styles.image} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Tài khoản đã bị khóa</Text>
          <Text style={styles.message}>
            Bạn đã nhập sai thông tin bảo mật quá 5 lần. Hãy xác thực OTP gửi về Gmail để mở khóa tài khoản.
          </Text>
          {state.email ? (
            <View style={styles.emailPill}>
              <Text style={styles.email} numberOfLines={1}>{state.email}</Text>
            </View>
          ) : null}
          <Pressable accessibilityRole="button" accessibilityLabel="Tiếp tục xác thực OTP"
            disabled={continuing} onPress={handleContinue}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed,
              continuing && styles.buttonDisabled]}>
            {continuing ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.buttonText}>Tiếp tục</Text>}
          </Pressable>
          <Text style={styles.hint}>OTP chỉ được gửi sau khi bạn bấm Tiếp tục</Text>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
    backgroundColor: 'rgba(31, 27, 51, 0.58)' },
  card: { width: '100%', maxWidth: 390, alignItems: 'center', borderRadius: 28,
    paddingHorizontal: 24, paddingTop: 18, paddingBottom: 22, backgroundColor: '#FFFFFF',
    shadowColor: '#2F2857', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.24,
    shadowRadius: 24, elevation: 16 },
  imageHalo: { width: 164, height: 146, alignItems: 'center', justifyContent: 'center',
    borderRadius: 82, backgroundColor: '#F5F2FF', overflow: 'hidden' },
  image: { width: 164, height: 164 },
  title: { marginTop: 8, color: '#292342', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  message: { marginTop: 10, color: '#68627A', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  emailPill: { maxWidth: '100%', marginTop: 14, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999, backgroundColor: '#F2F7FF' },
  email: { color: '#4A6795', fontSize: 13, fontWeight: '700' },
  button: { width: '100%', minHeight: 52, marginTop: 20, alignItems: 'center',
    justifyContent: 'center', borderRadius: 16, backgroundColor: '#7766CC' },
  buttonPressed: { transform: [{ scale: 0.985 }], backgroundColor: '#6857BE' },
  buttonDisabled: { opacity: 0.72 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  hint: { marginTop: 12, color: '#9A94A9', fontSize: 12, textAlign: 'center' },
})
