import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, useLanguage } from '../../../shared/contexts/ThemeLanguageContext';
import { styles } from '../SettingsScreen.styles';

export const QuickActionCard = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity
        style={[styles.quickActionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        activeOpacity={0.85}
        onPress={() => router.push('/(tabs)/wallet')}
      >
        <View style={styles.quickActionHeader}>
          <Text style={[styles.quickActionTitle, { color: theme.textPrimary }]}>{t('smartSpendWallet')}</Text>
          <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="wallet-outline" size={18} color={theme.primary} />
          </View>
        </View>
        <Text style={[styles.quickActionSubtitle, { color: theme.textSecondary }]}>{t('walletSub')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.quickActionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        activeOpacity={0.85}
        onPress={() => router.push('/settings/bank-binding')}
      >
        <View style={styles.quickActionHeader}>
          <Text style={[styles.quickActionTitle, { color: theme.textPrimary }]}>{t('bankBinding')}</Text>
          <View style={[styles.iconBox, { backgroundColor: theme.bgSoft }]}>
            <Feather name="credit-card" size={17} color={theme.primary} />
          </View>
        </View>
        <Text style={[styles.quickActionSubtitle, { color: theme.textSecondary }]}>{t('bankBindingSub')}</Text>
      </TouchableOpacity>
    </View>
  );
};

