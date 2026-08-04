import React from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PASTEL_PALETTE } from '../../shared/constants/PastelPalette';
import { styles } from './SettingsScreen.styles';

import { ProfileHeader } from './components/ProfileHeader';
import { QuickActionCard } from './components/QuickActionCard';
import { SettingsSection } from './components/SettingsSection';
import { SettingsItem } from './components/SettingsItem';
import { SecuritySection } from './components/SecuritySection';
import { LogoutButton } from './components/LogoutButton';

const ICON = PASTEL_PALETTE.accentDeep;

export function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10) + 90;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader />

        <QuickActionCard />

        <SettingsSection title="Tài chính">
          <SettingsItem
            icon={<Ionicons name="card-outline" size={20} color={ICON} />}
            title="Liên kết ngân hàng"
            subtitle="Quản lý tài khoản ngân hàng"
            onPress={() => router.push('/settings/bank-binding')}
          />
          <SettingsItem
            icon={<Ionicons name="wallet-outline" size={20} color={ICON} />}
            title="Ví SmartSpend"
            subtitle="Số dư và cài đặt ví"
            onPress={() => router.push('/(tabs)/wallet')}
          />
          <SettingsItem
            icon={<Feather name="pie-chart" size={19} color={ICON} />}
            title="Sổ tay chi tiêu"
            subtitle="Ghi chép thu chi hàng ngày"
            onPress={() => router.push('/(tabs)/notebook')}
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Tiện ích">
          <SettingsItem
            icon={<Ionicons name="receipt-outline" size={20} color={ICON} />}
            title="Quản lý hóa đơn"
            subtitle="Theo dõi và thanh toán hóa đơn"
            onPress={() => router.push('/invoice')}
          />
          <SettingsItem
            icon={<Ionicons name="people-outline" size={20} color={ICON} />}
            title="Quỹ nhóm"
            subtitle="Quỹ chung cùng bạn bè"
            onPress={() => router.push('/(tabs)/funds')}
            isLast
          />
        </SettingsSection>

        <SecuritySection />

        <SettingsSection title="Hỗ trợ & Cài đặt">
          <SettingsItem
            icon={<Feather name="headphones" size={19} color={ICON} />}
            title="Trung tâm hỗ trợ"
            subtitle="FAQ, Hotline, gửi yêu cầu hỗ trợ"
            onPress={() => router.push('/settings/support')}
          />
          <SettingsItem
            icon={<Ionicons name="settings-outline" size={20} color={ICON} />}
            title="Cài đặt ứng dụng"
            subtitle="Thông báo, giao diện"
            isLast
          />
        </SettingsSection>

        <LogoutButton />
      </ScrollView>
    </View>
  );
}
