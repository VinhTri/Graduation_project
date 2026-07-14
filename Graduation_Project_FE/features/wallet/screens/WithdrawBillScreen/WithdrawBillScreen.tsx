import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '../../../../shared/constants/Colors';
import { styles } from './WithdrawBillScreen.styles';

export default function WithdrawBillScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const getCurrentFormattedDate = () => {
    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  // Mặc định hoặc dữ liệu truyền sang
  const amountStr = (params.amount as string) || "0";
  const amount = parseInt(amountStr, 10);
  const bankName = (params.bankName as string) || "";
  const accountNumber = (params.accountNumber as string) || "";
  const accountName = (params.accountName as string) || "";
  const note = (params.note as string) || "Chưa có ghi chú";
  const category = (params.category as string) || "Chưa có danh mục";
  const transactionDate = (params.transactionDate as string) || getCurrentFormattedDate();

  const formatDisplayAmount = (val: number) => {
    return val.toLocaleString("vi-VN");
  };

  const handleGoHome = () => {
    router.replace('/wallet');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.billCard}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
          </View>

          {/* Title & Amount */}
          <Text style={styles.title}>Rút tiền thành công</Text>
          <Text style={styles.amountText}>{formatDisplayAmount(amount)} ₫</Text>
          <Text style={styles.dateText}>{transactionDate}</Text>

          {/* Dashed Line */}
          <View style={styles.dashedLine} />

          {/* Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.row}>
              <Text style={styles.label}>Nguồn chuyển</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.value}>Ví SmartSpend</Text>
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Ngân hàng nhận</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.value}>{bankName}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Tài khoản nhận</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.value}>{accountNumber}</Text>
                {accountName ? (
                  <Text style={[styles.value, { color: Colors.textMuted, fontSize: 13, marginTop: 2, textTransform: 'uppercase' }]}>
                    {accountName}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Danh mục</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.value}>{category}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Ghi chú</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.value}>{note}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.homeButton} onPress={handleGoHome} activeOpacity={0.8}>
          <Text style={styles.homeButtonText}>Hoàn tất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
