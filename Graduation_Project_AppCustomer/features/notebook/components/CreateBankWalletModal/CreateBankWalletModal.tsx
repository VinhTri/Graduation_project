import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (bankName: string, accountNumber: string) => Promise<void>;
}

export const CreateBankWalletModal = ({ visible, onClose, onSubmit }: Props) => {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedInput, setFocusedInput] = useState<'bankName' | 'accountNumber' | null>(null);

  const bankNameRef = React.useRef<TextInput>(null);
  const accountNumberRef = React.useRef<TextInput>(null);

  const handleSubmit = async () => {
    if (!bankName.trim()) {
      setError('Vui lòng nhập tên ngân hàng');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await onSubmit(bankName.trim(), accountNumber.trim());
      setBankName('');
      setAccountNumber('');
    } catch (e: any) {
      setError(e?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons name="bank" size={24} color={PASTEL_PALETTE.accentDeep} />
                </View>
                <Text style={styles.title}>Thêm sổ tay mới</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={24} color={PASTEL_PALETTE.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.body}>
              <Text style={styles.label}>Tên ngân hàng <Text style={styles.asterisk}>*</Text></Text>
              <Pressable 
                style={[styles.inputContainer, focusedInput === 'bankName' && styles.inputFocused]}
                onPress={() => bankNameRef.current?.focus()}
              >
                <MaterialCommunityIcons name="bank-outline" size={20} color={focusedInput === 'bankName' ? PASTEL_PALETTE.accentDeep : PASTEL_PALETTE.textMuted} style={styles.inputIcon} />
                <TextInput
                  ref={bankNameRef}
                  style={styles.input}
                  value={bankName}
                  onChangeText={setBankName}
                  onFocus={() => setFocusedInput('bankName')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="VD: Vietcombank, MBBank..."
                  placeholderTextColor={PASTEL_PALETTE.textMuted}
                  autoCorrect={false}
                />
              </Pressable>

              <Text style={styles.label}>Số tài khoản <Text style={styles.optional}>(Tùy chọn)</Text></Text>
              <Pressable 
                style={[styles.inputContainer, focusedInput === 'accountNumber' && styles.inputFocused]}
                onPress={() => accountNumberRef.current?.focus()}
              >
                <MaterialCommunityIcons name="credit-card-outline" size={20} color={focusedInput === 'accountNumber' ? PASTEL_PALETTE.accentDeep : PASTEL_PALETTE.textMuted} style={styles.inputIcon} />
                <TextInput
                  ref={accountNumberRef}
                  style={styles.input}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  onFocus={() => setFocusedInput('accountNumber')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Nhập số tài khoản"
                  keyboardType="numeric"
                  placeholderTextColor={PASTEL_PALETTE.textMuted}
                />
              </Pressable>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={PASTEL_PALETTE.white} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="plus-circle" size={20} color={PASTEL_PALETTE.white} />
                    <Text style={styles.submitBtnText}>Thêm sổ tay</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  keyboardWrap: {
    width: '100%',
  },
  modalContainer: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 28,
    padding: 24,
    shadowColor: PASTEL_PALETTE.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: PASTEL_PALETTE.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: PASTEL_PALETTE.bg,
    borderRadius: 20,
  },
  body: {},
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
    marginBottom: 8,
  },
  asterisk: {
    color: PASTEL_PALETTE.danger,
  },
  optional: {
    color: PASTEL_PALETTE.textMuted,
    fontWeight: '500',
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PASTEL_PALETTE.bg,
    borderWidth: 1.5,
    borderColor: PASTEL_PALETTE.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  inputFocused: {
    borderColor: PASTEL_PALETTE.accentDeep,
    backgroundColor: PASTEL_PALETTE.white,
    shadowColor: PASTEL_PALETTE.accentSoft,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: PASTEL_PALETTE.textMain,
    fontWeight: '500',
  },
  errorText: {
    color: PASTEL_PALETTE.danger,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
    marginTop: -8,
  },
  submitBtn: {
    backgroundColor: PASTEL_PALETTE.accentDeep,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    shadowColor: PASTEL_PALETTE.accentDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: PASTEL_PALETTE.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
