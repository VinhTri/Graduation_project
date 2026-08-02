import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
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

const getBankLogo = (bankCode: string) => {
  const bank = COMMON_BANKS.find(b => b.code === bankCode);
  return bank ? bank.logo : 'https://api.vietqr.io/img/VNPAY.png';
};

interface BankAccount {
  id: number;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

export default function BankBindingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);

  const handleUnlink = async () => {
    if (!selectedAccount) return;
    try {
      const res: any = await axiosClient.delete(`/api/v1/bank-accounts/${selectedAccount.id}`);
      if (res.success) {
        setIsConfirmVisible(false);
        setIsSuccessVisible(true);
        fetchBankAccounts(); // Refresh list
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể hủy liên kết. Vui lòng thử lại sau.');
      setIsConfirmVisible(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBankAccounts();
    }, [])
  );

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const res: any = await axiosClient.get('/api/v1/bank-accounts');
      if (res.success) {
        setAccounts(res.data);
      }
    } catch (error) {
      console.log('Error fetching bank accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liên kết tài khoản ngân hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/settings/bank-binding/add')}
        >
          <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
          <Text style={styles.addButtonText}>Thêm tài khoản ngân hàng</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Ngân hàng đã liên kết</Text>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={60} color={Colors.border} />
            <Text style={styles.emptyText}>Bạn chưa liên kết tài khoản ngân hàng nào.</Text>
          </View>
        ) : (
          accounts.map((account) => (
            <View key={account.id} style={styles.cardContainer}>
              <View style={styles.cardHeader}>
                <Image 
                  source={{ uri: getBankLogo(account.bankCode) }} 
                  style={styles.bankLogo}
                  resizeMode="contain"
                />
                <Text style={styles.bankName}>{account.bankName}</Text>
                {account.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.defaultText}>Mặc định</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.cardBody}>
                <Text style={styles.accountNumberLabel}>SỐ TÀI KHOẢN</Text>
                <Text style={styles.accountNumber}>
                  {account.accountNumber.replace(/.(?=.{4})/g, '* ')}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.accountNameLabel}>CHỦ TÀI KHOẢN</Text>
                  <Text style={styles.accountName}>{account.accountName}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.cardAction, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                  onPress={() => {
                    setSelectedAccount(account);
                    setIsConfirmVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cardActionText, { color: Colors.error, marginHorizontal: 4 }]}>Hủy liên kết</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <ConfirmModal
        visible={isConfirmVisible}
        title="Hủy liên kết"
        message={`Bạn có chắc chắn muốn hủy liên kết tài khoản ngân hàng ${selectedAccount?.bankName} này khỏi ví SmartSpend?`}
        confirmText="Hủy liên kết"
        cancelText="Đóng"
        isDestructive={true}
        onConfirm={handleUnlink}
        onCancel={() => setIsConfirmVisible(false)}
      />

      <SuccessModal
        visible={isSuccessVisible}
        title="Hủy liên kết thành công"
        message="Tài khoản ngân hàng đã được gỡ khỏi ví SmartSpend."
        isAutoClose={true}
        onClose={() => setIsSuccessVisible(false)}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  cardContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 145, 133, 0.1)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bankLogo: {
    width: 60,
    height: 30,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginLeft: 12,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  defaultText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  cardBody: {
    marginBottom: 20,
  },
  accountNumberLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  accountNameLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  accountName: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    marginRight: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 145, 133, 0.1)',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  addButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});
