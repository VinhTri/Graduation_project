import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import Colors from '../../../../shared/constants/Colors';
import { axiosClient } from '../../../../shared/api/axiosClient';

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tài khoản & Thẻ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Tài khoản liên kết</Text>

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
                <Ionicons name="business" size={20} color={Colors.primary} />
                <Text style={styles.bankName}>{account.bankName}</Text>
                {account.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Mặc định</Text>
                  </View>
                )}
              </View>
              <Text style={styles.accountNumber}>{account.accountNumber}</Text>
              <Text style={styles.accountName}>{account.accountName}</Text>
            </View>
          ))
        )}

        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/settings/bank-binding/add')}
        >
          <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
          <Text style={styles.addButtonText}>Thêm tài khoản / thẻ mới</Text>
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  accountNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  accountName: {
    fontSize: 14,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 145, 133, 0.1)',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  addButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});
