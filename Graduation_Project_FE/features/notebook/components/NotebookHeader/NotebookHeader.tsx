import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { PastelHeaderShell } from '../../../../shared/components/PastelHeaderShell';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';
import { NotebookHeaderProps } from './NotebookHeader.types';
import { styles } from './NotebookHeader.styles';
import { useLanguage, useTheme } from '../../../../shared/contexts/ThemeLanguageContext';

export const NotebookHeader: React.FC<NotebookHeaderProps> = ({
  totalBalance,
  onAddCashBalance,
  onSpendCashBalance,
}) => {
  const router = useRouter();
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isEn = language === 'en';

  const formatCurrency = (val: number) => {
    if (isBalanceHidden) return '•••••• ₫';
    return `${val.toLocaleString('vi-VN')} ₫`;
  };

  return (
    <PastelHeaderShell contentStyle={styles.headerContent}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.isDark ? theme.card : 'rgba(255,255,255,0.72)', borderColor: theme.cardBorder }]}
          onPress={() => router.push('/(tabs)/home')}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: theme.isDark ? '#FFFFFF' : PASTEL_PALETTE.title }]}>{t('expenseNotebook')}</Text>
          <Text style={[styles.subtitle, { color: theme.isDark ? theme.textSecondary : PASTEL_PALETTE.subtitle }]}>{t('notebookSub')}</Text>
        </View>
      </View>

      <View style={[styles.balanceCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.balanceHeader}>
          <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>{t('cashBalance').toUpperCase()}</Text>
          <TouchableOpacity
            style={[styles.eyeBtn, { backgroundColor: theme.isDark ? theme.bgSoft : PASTEL_PALETTE.accentSoft }]}
            onPress={() => setIsBalanceHidden((v) => !v)}
            activeOpacity={0.75}
          >
            <Feather
              name={isBalanceHidden ? 'eye-off' : 'eye'}
              size={15}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>
        <Text style={[styles.balanceValue, { color: theme.textPrimary }]}>{formatCurrency(totalBalance)}</Text>

        {(onAddCashBalance || onSpendCashBalance) && (
          <View style={styles.balanceActions}>
            {onAddCashBalance ? (
              <TouchableOpacity
                style={[styles.addBalanceBtn, { backgroundColor: theme.isDark ? theme.bgSoft : PASTEL_PALETTE.accentSoft, borderColor: theme.cardBorder }]}
                onPress={onAddCashBalance}
                activeOpacity={0.85}
              >
                <Feather name="plus-circle" size={16} color={theme.primary} />
                <Text style={[styles.addBalanceText, { color: theme.primary }]}>{isEn ? 'Add Cash' : 'Thêm số dư'}</Text>
              </TouchableOpacity>
            ) : null}
            {onSpendCashBalance ? (
              <TouchableOpacity
                style={[styles.spendBalanceBtn, { backgroundColor: theme.isDark ? 'rgba(220,38,38,0.15)' : '#FEE2E2', borderColor: '#FECACA' }]}
                onPress={onSpendCashBalance}
                activeOpacity={0.85}
              >
                <Feather name="minus-circle" size={16} color="#DC2626" />
                <Text style={styles.spendBalanceText}>{isEn ? 'Spend Cash' : 'Chi số dư'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    </PastelHeaderShell>
  );
};

export default NotebookHeader;

