import { useEffect, useState } from 'react'
import { Animated, Modal, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import PinDots from '@/features/onboarding/components/PinDots'
import PinKeypad from '@/features/onboarding/components/PinKeypad'
import { styles } from '../PinModal/PinModal.styles'
import { useBottomSheetPresence } from '../PinModal/useBottomSheetPresence'

const PIN_LENGTH = 6

interface ResetPinModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (newPin: string) => void
  errorMessage?: string
}

export default function ResetPinModal({
  visible,
  onClose,
  onConfirm,
  errorMessage,
}: ResetPinModalProps) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState<1 | 2>(1)
  const [localError, setLocalError] = useState('')
  const { presented, backdropOpacity, sheetTranslateY } = useBottomSheetPresence(visible)

  useEffect(() => {
    if (visible) {
      setPin('')
      setConfirmPin('')
      setStep(1)
      setLocalError('')
    }
  }, [visible])

  useEffect(() => {
    if (errorMessage) {
      setConfirmPin('')
      setPin('')
      setStep(1)
    }
  }, [errorMessage])

  const currentPin = step === 1 ? pin : confirmPin
  const displayError = localError || errorMessage

  function handleKeyPress(key: string) {
    setLocalError('')

    if (key === 'backspace') {
      if (step === 1) {
        setPin((prev) => prev.slice(0, -1))
      } else {
        setConfirmPin((prev) => prev.slice(0, -1))
      }
      return
    }

    if (step === 1) {
      if (pin.length >= PIN_LENGTH) return
      const nextPin = pin + key
      setPin(nextPin)
      if (nextPin.length === PIN_LENGTH) {
        setTimeout(() => setStep(2), 200)
      }
      return
    }

    if (confirmPin.length >= PIN_LENGTH) return
    const nextConfirm = confirmPin + key
    setConfirmPin(nextConfirm)
    if (nextConfirm.length === PIN_LENGTH) {
      setTimeout(() => {
        if (pin === nextConfirm) {
          onConfirm(nextConfirm)
        } else {
          setLocalError('Mã PIN không khớp. Vui lòng nhập lại.')
          setConfirmPin('')
        }
      }, 200)
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
                <Text style={styles.pinTitle}>
                  {step === 1 ? 'Đặt lại mã PIN mới' : 'Xác nhận mã PIN'}
                </Text>
                <Text style={styles.pinSubtitle}>
                  {step === 1
                    ? 'Nhập mã PIN 6 số mới của bạn.'
                    : 'Nhập lại mã PIN vừa tạo để xác nhận.'}
                </Text>
              </View>

              <PinDots
                length={PIN_LENGTH}
                filled={currentPin.length}
                style={styles.pinDots}
              />

              {displayError ? (
                <Text style={styles.pinErrorText}>{displayError}</Text>
              ) : null}

              <PinKeypad
                onPressKey={handleKeyPress}
                style={styles.keypad}
                leftAction={{
                  label: step === 2 ? 'Quay lại' : 'Hủy',
                  onPress: () => {
                    if (step === 2) {
                      setConfirmPin('')
                      setLocalError('')
                      setStep(1)
                      return
                    }
                    onClose()
                  },
                }}
              />
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  )
}
