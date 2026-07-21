import React from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useLanguage } from '../../shared/contexts/ThemeLanguageContext';
import { styles } from './SettingsScreen.styles';

import { ProfileHeader } from './components/ProfileHeader';
import { QuickActionCard } from './components/QuickActionCard';
import { SettingsSection } from './components/SettingsSection';
import { SettingsItem } from './components/SettingsItem';
import { SecuritySection } from './components/SecuritySection';
import { LogoutButton } from './components/LogoutButton';

export function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10) + 90;
  const { theme } = useTheme();
  const { t } = useLanguage();

  const ICON = theme.primary;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader />

        <QuickActionCard />

        <SettingsSection title={t('finance')}>
          <SettingsItem
            icon={<Ionicons name="card-outline" size={20} color={ICON} />}
            title={t('bankBinding')}
            subtitle={t('bankBindingSub')}
            onPress={() => router.push('/settings/bank-binding')}
          />
          <SettingsItem
            icon={<Ionicons name="wallet-outline" size={20} color={ICON} />}
            title={t('smartSpendWallet')}
            subtitle={t('walletSub')}
            onPress={() => router.push('/(tabs)/wallet')}
          />
          <SettingsItem
            icon={<Feather name="pie-chart" size={19} color={ICON} />}
            title={t('expenseNotebook')}
            subtitle={t('notebookSub')}
            onPress={() => router.push('/(tabs)/notebook')}
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t('utilities')}>
          <SettingsItem
            icon={<Ionicons name="receipt-outline" size={20} color={ICON} />}
            title={t('invoiceManagement')}
            subtitle={t('invoiceSub')}
            onPress={() => router.push('/invoice')}
          />
          <SettingsItem
            icon={<Ionicons name="people-outline" size={20} color={ICON} />}
            title={t('groupFund')}
            subtitle={t('groupFundSub')}
            onPress={() => router.push('/(tabs)/funds')}
            isLast
          />
        </SettingsSection>

        <SecuritySection />

        <SettingsSection title={t('supportAndSettings')}>
          <SettingsItem
            icon={<Feather name="headphones" size={19} color={ICON} />}
            title={t('supportCenter')}
            subtitle={t('supportSub')}
          />
          <SettingsItem
            icon={<Ionicons name="settings-outline" size={20} color={ICON} />}
            title={t('appSettings')}
            subtitle={t('appSettingsSubtitle')}
            onPress={() => router.push('/settings/app-settings' as any)}
            isLast
          />
        </SettingsSection>

        <LogoutButton />
      </ScrollView>
    </View>
  );
}

