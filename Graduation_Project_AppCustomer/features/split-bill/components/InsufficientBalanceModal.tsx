import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette';

type InsufficientBalanceModalProps = {
  visible: boolean;
  onUnderstood: () => void;
};

const WalletWarningIllustration = () => (
  <View style={styles.illustration} accessibilityElementsHidden>
    <Svg width={112} height={112} viewBox="0 0 112 112">
      <Circle cx="56" cy="56" r="54" fill="#FFF1F2" />
      <Path
        d="M32 43.5h42a7 7 0 0 1 7 7v31a7 7 0 0 1-7 7H32a7 7 0 0 1-7-7v-41a8 8 0 0 1 6.2-7.8l36.5-8.1a4.8 4.8 0 0 1 5.8 4.7v14.2"
        fill="none"
        stroke="#EF4444"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x="65"
        y="59"
        width="22"
        height="15"
        rx="5"
        fill="#FFF1F2"
        stroke="#EF4444"
        strokeWidth="3.5"
      />
      <Circle cx="71.5" cy="66.5" r="2" fill="#EF4444" />
      <Circle cx="82" cy="29" r="14" fill="#FFFFFF" stroke="#EF4444" strokeWidth="3.5" />
      <Path
        d="M82 21v9"
        stroke="#EF4444"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <Circle cx="82" cy="35" r="2" fill="#EF4444" />
    </Svg>
  </View>
);

export default function InsufficientBalanceModal({
  visible,
  onUnderstood,
}: InsufficientBalanceModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onUnderstood}
    >
      <View style={styles.overlay}>
        <View style={styles.card} accessibilityViewIsModal>
          <WalletWarningIllustration />

          <Text style={styles.title}>Số dư không đủ</Text>
          <Text style={styles.message}>
            Số dư ví của bạn không đủ để thanh toán khoản chia này.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onUnderstood}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="Đã hiểu"
          >
            <Text style={styles.buttonText}>Đã hiểu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15, 17, 26, 0.62)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
    shadowColor: '#0F111A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
  illustration: {
    width: 112,
    height: 112,
    marginBottom: 20,
  },
  title: {
    color: '#18181B',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.35,
    textAlign: 'center',
  },
  message: {
    maxWidth: 285,
    marginTop: 12,
    color: '#52525B',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    minHeight: 52,
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: PASTEL_PALETTE.accentDeep,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
