import React from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../shared/constants/Colors';
import { styles } from './SettingsScreen.styles';

import { ProfileHeader } from './components/ProfileHeader';
import { QuickActionCard } from './components/QuickActionCard';
import { SettingsSection } from './components/SettingsSection';
import { SettingsItem } from './components/SettingsItem';
import { LogoutButton } from './components/LogoutButton';

export function SettingsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader />
        
        <QuickActionCard />

        <SettingsSection title="Ưu đãi">
          <SettingsItem 
            icon={<MaterialCommunityIcons name="ticket-confirmation-outline" size={22} color="#60A5FA" />}
            title="Quà của tôi"
            subtitle="10 ưu đãi"
          />
          <SettingsItem 
            icon={<MaterialCommunityIcons name="cat" size={22} color="#F59E0B" />}
            title="Xu tích lũy"
            subtitle="1223 xu"
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Quản lý tài chính" rightLink="Xem thêm">
          <SettingsItem 
            icon={<Ionicons name="card-outline" size={22} color={Colors.textMuted} />}
            title="Tài khoản/thẻ liên kết"
          />
          <SettingsItem 
            title="Số dư hiện có"
            showEye
            hideChevron
          />
          <SettingsItem 
            icon={<Ionicons name="wallet-outline" size={22} color={Colors.primary} />}
            title="Ví SmartSpend"
            value="0đ"
            hideChevron
          />
          <SettingsItem 
            icon={<Ionicons name="card-outline" size={22} color="#3B82F6" />}
            title="Tài khoản trả sau"
            value="0đ"
            hideChevron
          />
          <SettingsItem 
            icon={<Ionicons name="leaf-outline" size={22} color={Colors.success} />}
            title="Số dư sinh lời"
            value="894đ"
            hideChevron
          />
          <SettingsItem 
            icon={<Ionicons name="settings-outline" size={22} color={Colors.textMuted} />}
            title="Cài đặt thanh toán tự động"
            subtitle="Sắp xếp nguồn tiền, cài đặt dịch vụ"
          />
          <SettingsItem 
            icon={<MaterialCommunityIcons name="speedometer" size={22} color={Colors.textMuted} />}
            title="Điểm tin cậy SmartSpend"
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Tiện ích">
          <SettingsItem 
            icon={<Ionicons name="receipt-outline" size={22} color={Colors.textMuted} />}
            title="Quản lý hóa đơn"
            subtitle="Thêm hóa đơn để thanh toán bạn nhé"
          />
          <SettingsItem 
            icon={<Ionicons name="document-text-outline" size={22} color={Colors.textMuted} />}
            title="Quản lý hợp đồng"
          />
          <SettingsItem 
            icon={<Ionicons name="ticket-outline" size={22} color={Colors.textMuted} />}
            title="Quản lý vé"
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Hỗ trợ và Cài đặt">
          <SettingsItem 
            icon={<Feather name="headphones" size={22} color={Colors.textMuted} />}
            title="Trung tâm hỗ trợ"
          />
          <SettingsItem 
            icon={<Feather name="shield" size={22} color={Colors.textMuted} />}
            title="Trung tâm bảo mật"
          />
          <SettingsItem 
            icon={<Ionicons name="settings-outline" size={22} color={Colors.textMuted} />}
            title="Cài đặt ứng dụng"
            isLast
          />
        </SettingsSection>

        <LogoutButton />
      </ScrollView>
    </View>
  );
}
