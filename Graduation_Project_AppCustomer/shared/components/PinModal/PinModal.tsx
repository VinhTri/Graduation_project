import { useEffect, useState } from 'react'
import {
  Animated,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { startForgotPinFlowSafe } from '@/features/auth/forgot-pin/startForgotPinFlow'
import PinDots from '@/features/onboarding/components/PinDots'
import PinKeypad from '@/features/onboarding/components/PinKeypad'
import { styles } from './PinModal.styles'
import { useBottomSheetPresence } from './useBottomSheetPresence'

const PIN_LENGTH = 6

interface PinModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (pin: string) => void
  onForgotPin?: () => void
  errorMessage?: string
  title?: string
  subtitle?: string
}

export default function PinModal({
  visible,
  onClose,
  onConfirm,
  onForgotPin,
  errorMessage,
  title = 'Nhập mã PIN',
  subtitle = 'Vui lòng nhập mã PIN bảo mật để xác nhận giao dịch.',
}: PinModalProps) {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const { presented, backdropOpacity, sheetTranslateY } = useBottomSheetPresence(visible)

  useEffect(() => {
    if (visible) {
      setPin('')
    }
  }, [visible])

  useEffect(() => {
    if (errorMessage) {
      setPin('')
    }
  }, [errorMessage])

  function handleKeyPress(key: string) {
    if (sendingOtp) return

    if (key === 'backspace') {
      setPin((prev) => prev.slice(0, -1))
      return
    }

    if (pin.length >= PIN_LENGTH) return

    const nextPin = pin + key
    setPin(nextPin)

    if (nextPin.length === PIN_LENGTH) {
      setTimeout(() => onConfirm(nextPin), 200)
    }
  }

  async function handleForgotPin() {
    if (sendingOtp) return
    onForgotPin?.()
    setSendingOtp(true)
    try {
      const ok = await startForgotPinFlowSafe(router)
      if (ok) onClose()
    } finally {
      setSendingOtp(false)
    }
  }

  return (
    <Modal
      visible={presented}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={styles.backdropPressable} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[styles.sheetWrap, { transform: [{ translateY: sheetTranslateY }] }]}
        >
          <SafeAreaView edges={['bottom']} style={styles.modalContainer}>
            <View style={styles.dragIndicator} />

            <View style={styles.content}>
              <View style={styles.pinHeader}>
                <Text style={styles.pinTitle}>{title}</Text>
                <Text style={styles.pinSubtitle}>{subtitle}</Text>
              </View>

              <PinDots
                length={PIN_LENGTH}
                filled={pin.length}
                style={styles.pinDots}
              />

              {errorMessage ? (
                <Text style={styles.pinErrorText}>{errorMessage}</Text>
              ) : null}

              <TouchableOpacity onPress={handleForgotPin} disabled={sendingOtp}>
                <Text style={styles.forgotPinText}>
                  {sendingOtp ? 'Đang gửi OTP...' : 'Quên mã PIN?'}
                </Text>
              </TouchableOpacity>

              <PinKeypad
                onPressKey={handleKeyPress}
                style={styles.keypad}
                leftAction={{
                  label: 'Hủy',
                  onPress: onClose,
                  disabled: sendingOtp,
                }}
              />
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  )
}
