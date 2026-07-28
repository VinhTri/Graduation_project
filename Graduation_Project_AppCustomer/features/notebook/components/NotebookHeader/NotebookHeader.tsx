import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { PastelHeaderShell } from '../../../../shared/components/PastelHeaderShell';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';
import { NotebookHeaderProps } from './NotebookHeader.types';
import { styles } from './NotebookHeader.styles';

export const NotebookHeader: React.FC<NotebookHeaderProps> = ({
  totalBalance,
  onAddCashBalance,
  onSpendCashBalance,
}) => {
  const router = useRouter();
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  const formatCurrency = (val: number) => {
    if (isBalanceHidden) return '•••••• ₫';
    return `${val.toLocaleString('vi-VN')} ₫`;
  };

  return (
    <PastelHeaderShell contentStyle={styles.headerContent}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push('/(tabs)/home')}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-back" size={22} color={PASTEL_PALETTE.title} />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Sổ tay tiền mặt</Text>
          <Text style={styles.subtitle}>Ghi chép thu chi tiền mặt hàng ngày</Text>
        </View>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>SỐ DƯ TIỀN MẶT</Text>
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setIsBalanceHidden((v) => !v)}
            activeOpacity={0.75}
          >
            <Feather
              name={isBalanceHidden ? 'eye-off' : 'eye'}
              size={15}
              color={PASTEL_PALETTE.accentDeep}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.balanceValue}>{formatCurrency(totalBalance)}</Text>

        {(onAddCashBalance || onSpendCashBalance) && (
          <View style={styles.balanceActions}>
            {onAddCashBalance ? (
              <TouchableOpacity
                style={styles.addBalanceBtn}
                onPress={onAddCashBalance}
                activeOpacity={0.85}
              >
                <Feather name="plus-circle" size={16} color={PASTEL_PALETTE.accentDeep} />
                <Text style={styles.addBalanceText}>Thêm số dư</Text>
              </TouchableOpacity>
            ) : null}
            {onSpendCashBalance ? (
              <TouchableOpacity
                style={styles.spendBalanceBtn}
                onPress={onSpendCashBalance}
                activeOpacity={0.85}
              >
                <Feather name="minus-circle" size={16} color="#DC2626" />
                <Text style={styles.spendBalanceText}>Chi số dư</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    </PastelHeaderShell>
  );
};

export default NotebookHeader;
