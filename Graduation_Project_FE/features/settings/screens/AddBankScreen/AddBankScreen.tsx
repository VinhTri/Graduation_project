import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../../../shared/constants/Colors';
import { axiosClient } from '../../../../shared/api/axiosClient';

const COMMON_BANKS = [
  { code: '970422', name: 'MBBank', shortName: 'MB' },
  { code: '970436', name: 'Vietcombank', shortName: 'VCB' },
  { code: '970407', name: 'Techcombank', shortName: 'TCB' },
  { code: '970415', name: 'VietinBank', shortName: 'CTG' },
  { code: '970418', name: 'BIDV', shortName: 'BIDV' },
];

export default function AddBankScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [selectedBank, setSelectedBank] = useState(COMMON_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleLookup = async () => {
    if (!accountNumber) return;
    try {
      setIsLookingUp(true);
      const res: any = await axiosClient.get('/api/v1/bank-accounts/lookup', {
        params: {
          bankCode: selectedBank.code,
          accountNumber: accountNumber
        }
      });
      if (res.success && res.data) {
        setAccountName(res.data);
      }
    } catch (error: any) {
      Alert.alert('Lỗi tra cứu', error?.message || 'Không tìm thấy thông tin tài khoản');
      setAccountName('');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleLink = async () => {
    try {
      setIsLinking(true);
      const res: any = await axiosClient.post('/api/v1/bank-accounts', {
        bankCode: selectedBank.code,
        bankName: selectedBank.name,
        accountNumber: accountNumber,
        accountName: accountName.toUpperCase() // Ensure upper case
      });

      if (res.success) {
        Alert.alert('Thành công', 'Đã liên kết tài khoản ngân hàng', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Lỗi liên kết', error?.message || 'Không thể liên kết tài khoản');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm thẻ / tài khoản</Text>
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
              <Text style={[
                styles.bankItemText,
                selectedBank.code === bank.code && styles.bankItemTextSelected
              ]}>{bank.shortName}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Số tài khoản</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập số tài khoản"
            keyboardType="number-pad"
            value={accountNumber}
            onChangeText={(text) => {
              setAccountNumber(text);
              setAccountName(''); // Reset name when account number changes
            }}
          />
        </View>

        <TouchableOpacity 
          style={styles.lookupButton}
          onPress={handleLookup}
          disabled={isLookingUp || !accountNumber}
        >
          {isLookingUp ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={styles.lookupButtonText}>Tra cứu chủ tài khoản</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Tên chủ tài khoản</Text>
        <View style={[styles.inputContainer, { backgroundColor: Colors.background }]}>
          <TextInput
            style={[styles.input, { textTransform: 'uppercase', color: accountName ? Colors.primary : Colors.textMuted, fontWeight: accountName ? '700' : '400' }]}
            placeholder="Tên chủ tài khoản tự động điền"
            value={accountName}
            editable={false}
          />
        </View>

        <TouchableOpacity 
          style={styles.linkButton}
          onPress={handleLink}
          disabled={isLinking || !accountName || !accountNumber}
        >
          {isLinking ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.linkButtonText}>Liên kết thẻ ngay</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
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
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
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
  bankItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
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
  lookupButton: {
    backgroundColor: 'rgba(16, 145, 133, 0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  lookupButtonText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  resultContainer: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  resultName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 24,
    textAlign: 'center',
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
});
