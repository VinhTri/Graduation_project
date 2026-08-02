import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../../../shared/constants/Colors';
import { axiosClient } from '../../../../shared/api/axiosClient';
import ConfirmModal from '../../../../shared/components/ConfirmModal/ConfirmModal';
import SuccessModal from '../../../../shared/components/SuccessModal/SuccessModal';

const COMMON_BANKS = [
  { code: '970422', name: 'MBBank', shortName: 'MB', logo: 'https://api.vietqr.io/img/MB.png' },
  { code: '970436', name: 'Vietcombank', shortName: 'VCB', logo: 'https://api.vietqr.io/img/VCB.png' },
  { code: '970407', name: 'Techcombank', shortName: 'TCB', logo: 'https://api.vietqr.io/img/TCB.png' },
  { code: '970418', name: 'BIDV', shortName: 'BIDV', logo: 'https://api.vietqr.io/img/BIDV.png' },
  { code: '970432', name: 'VPBank', shortName: 'VPB', logo: 'https://api.vietqr.io/img/VPB.png' },
  { code: '970423', name: 'TPBank', shortName: 'TPB', logo: 'https://api.vietqr.io/img/TPB.png' },
  { code: '970415', name: 'VietinBank', shortName: 'ICB', logo: 'https://api.vietqr.io/img/ICB.png' },
  { code: '970405', name: 'Agribank', shortName: 'VBA', logo: 'https://api.vietqr.io/img/VBA.png' },
  { code: '970403', name: 'Sacombank', shortName: 'STB', logo: 'https://api.vietqr.io/img/STB.png' },
  { code: '970416', name: 'ACB', shortName: 'ACB', logo: 'https://api.vietqr.io/img/ACB.png' },
  { code: '970441', name: 'VIB', shortName: 'VIB', logo: 'https://api.vietqr.io/img/VIB.png' },
  { code: '970443', name: 'SHB', shortName: 'SHB', logo: 'https://api.vietqr.io/img/SHB.png' },
];

export default function AddBankScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [selectedBank, setSelectedBank] = useState(COMMON_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [verifiedName, setVerifiedName] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const handleLink = async () => {
    try {
      setIsLinking(true);
      // BE tự chi 2.000đ tới STK để xác minh & lấy tên chủ tài khoản,
      // nên FE chỉ cần gửi ngân hàng + số tài khoản.
      const res: any = await axiosClient.post('/api/v1/bank-accounts', {
        bankCode: selectedBank.code,
        bankName: selectedBank.name,
        accountNumber: accountNumber,
      });

      if (res.success) {
        setVerifiedName(res.data?.accountName || '');
        setIsSuccessModalVisible(true);
      }
    } catch (error: any) {
      if (error?.message?.includes('đã được liên kết')) {
        setAccountError(error.message);
      } else {
        Alert.alert('Lỗi liên kết', error?.message || 'Không thể liên kết tài khoản. Vui lòng kiểm tra lại số tài khoản.');
      }
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liên kết ngân hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <Text style={styles.label}>Chọn Ngân hàng</Text>
        <View style={styles.bankGrid}>
          {COMMON_BANKS.map((bank) => (
            <TouchableOpacity 
              key={bank.code}
              style={[
                styles.bankItem, 
                selectedBank.code === bank.code && styles.bankItemSelected
              ]}
              onPress={() => setSelectedBank(bank)}
            >
              <Image 
                source={{ uri: bank.logo }} 
                style={styles.bankLogo}
                resizeMode="contain"
              />
              <Text style={[
                styles.bankItemText,
                selectedBank.code === bank.code && styles.bankItemTextSelected
              ]}>{bank.shortName}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Số tài khoản</Text>
        <View style={[styles.inputContainer, accountError ? { borderColor: '#EF4444', marginBottom: 8 } : null]}>
          <TextInput
            style={styles.input}
            placeholder="Nhập số tài khoản"
            keyboardType="number-pad"
            value={accountNumber}
            onChangeText={(text) => {
              setAccountNumber(text);
              setAccountError('');
            }}
          />
        </View>
        {!!accountError && <Text style={styles.errorText}>{accountError}</Text>}

        <View style={styles.feeNotice}>
          <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
          <Text style={styles.feeNoticeText}>
            Liên kết <Text style={styles.feeHighlight}>miễn phí</Text>! Hệ thống chuyển <Text style={styles.feeHighlight}>2.000đ</Text> vào chính số tài khoản này để xác minh và bạn được nhận luôn. Mỗi người liên kết tối đa <Text style={styles.feeHighlight}>3 tài khoản</Text>.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => setIsConfirmModalVisible(true)}
          disabled={isLinking || !accountNumber.trim()}
        >
          {isLinking ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.linkButtonText}>Liên kết & xác minh</Text>
          )}
        </TouchableOpacity>

      </ScrollView>

      <ConfirmModal
        visible={isConfirmModalVisible}
        title="Xác nhận liên kết"
        iconName="link-outline"
        iconColor={Colors.primary}
        confirmText="Xác nhận"
        cancelText="Hủy"
        onConfirm={() => {
          setIsConfirmModalVisible(false);
          handleLink();
        }}
        onCancel={() => setIsConfirmModalVisible(false)}
        isDestructive={false}
      >
        <View style={styles.modalContent}>
          <Image 
            source={{ uri: selectedBank.logo }} 
            style={styles.modalBankLogo}
            resizeMode="contain"
          />
          <Text style={styles.modalBankName}>{selectedBank.name}</Text>
          <View style={styles.modalAccountInfo}>
            <Text style={styles.modalAccountLabel}>Số tài khoản</Text>
            <Text style={styles.modalAccountNumber}>{accountNumber}</Text>
          </View>
          <View style={styles.modalAccountInfo}>
            <Text style={styles.modalAccountLabel}>Phí liên kết</Text>
            <Text style={styles.modalAccountName}>Miễn phí</Text>
          </View>
        </View>
      </ConfirmModal>

      <SuccessModal
        visible={isSuccessModalVisible}
        title="Liên kết thành công"
        message={verifiedName
          ? `Đã xác minh chủ tài khoản: ${verifiedName}. Ngân hàng đã được liên kết với ví SmartSpend của bạn.`
          : "Ngân hàng đã được liên kết với ví SmartSpend của bạn."}
        isAutoClose={true}
        onClose={() => {
          setIsSuccessModalVisible(false);
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10,
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  bankLogo: {
    width: 60,
    height: 30,
    marginBottom: 8,
  },
  bankItem: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    width: '30%',
  },
  bankItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(16, 145, 133, 0.1)',
  },
  bankItemText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  bankItemTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  inputContainer: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  input: {
    fontSize: 16,
    color: Colors.text,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 16,
    marginLeft: 4,
  },
  feeNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(16, 145, 133, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  feeNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text,
  },
  feeHighlight: {
    fontWeight: '800',
    color: Colors.primary,
  },
  linkButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  linkButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  modalContent: {
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 8,
    width: '100%',
  },
  modalBankLogo: {
    width: 100,
    height: 50,
    marginBottom: 12,
  },
  modalBankName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalAccountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 8,
  },
  modalAccountLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  modalAccountNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  modalAccountName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
