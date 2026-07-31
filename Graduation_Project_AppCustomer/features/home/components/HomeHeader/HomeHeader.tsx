import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { SmartSpendIcon } from "@/shared/components/SmartSpendIcon";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./HomeHeader.styles";
import { PASTEL_PALETTE } from "@/shared/constants/PastelPalette";
import { PastelHeaderShell } from "@/shared/components/PastelHeaderShell";
import { useRouter } from "expo-router";
import { notificationService } from "@/shared/api/services/notification.service";
import { useFocusEffect } from "@react-navigation/native";

const QUICK_ACTIONS = [
  {
    id: "topup",
    label: "Nạp/Rút",
    route: "/wallet/action?initialTab=topup",
    type: "logo" as const,
    bgColor: PASTEL_PALETTE.accentSoft,
  },
  {
    id: "transfer",
    label: "Chuyển tiền",
    icon: "paper-plane-outline" as const,
    color: PASTEL_PALETTE.lavender,
    bgColor: PASTEL_PALETTE.lavenderSoft,
    route: "/transfer",
  },
  {
    id: "qr",
    label: "Quét mã QR",
    icon: "qr-code-outline" as const,
    color: PASTEL_PALETTE.accentDeep,
    bgColor: PASTEL_PALETTE.accentSoft,
  },
  {
    id: "utilities",
    label: "Ví tiện ích",
    icon: "grid-outline" as const,
    color: PASTEL_PALETTE.subtitle,
    bgColor: "rgba(255, 255, 255, 0.72)",
  },
];

import { useLanguage, useTheme } from "@/shared/contexts/ThemeLanguageContext";

export const HomeHeader = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = useState(0);
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isEn = language === 'en';

  const quickActions = [
    {
      id: "topup",
      label: isEn ? "Top Up/Withdraw" : "Nạp/Rút",
      route: "/wallet/action?initialTab=topup",
      type: "logo" as const,
      bgColor: theme.isDark ? theme.bgSoft : PASTEL_PALETTE.accentSoft,
    },
    {
      id: "transfer",
      label: isEn ? "Transfer" : "Chuyển tiền",
      icon: "paper-plane-outline" as const,
      color: theme.isDark ? theme.primary : PASTEL_PALETTE.lavender,
      bgColor: theme.isDark ? theme.bgSoft : PASTEL_PALETTE.lavenderSoft,
    },
    {
      id: "qr",
      label: isEn ? "Scan QR" : "Quét mã QR",
      icon: "qr-code-outline" as const,
      color: theme.isDark ? theme.primary : PASTEL_PALETTE.accentDeep,
      bgColor: theme.isDark ? theme.bgSoft : PASTEL_PALETTE.accentSoft,
    },
    {
      id: "utilities",
      label: isEn ? "Utilities" : "Ví tiện ích",
      icon: "grid-outline" as const,
      color: theme.textSecondary,
      bgColor: theme.isDark ? theme.bgSoft : "rgba(255, 255, 255, 0.72)",
    },
  ];

  useFocusEffect(
    React.useCallback(() => {
      loadUnreadCount();
    }, [])
  );

  const loadUnreadCount = async () => {
    try {
      const res: any = await notificationService.getUnreadCount();
      if (res && res.success !== undefined) {
         setUnreadCount(Number(res.data));
      }
    } catch (error) {
      console.log("Error loading unread count", error);
    }
  };

  return (
    <PastelHeaderShell
      style={styles.headerShell}
      contentStyle={[styles.container, { paddingTop: insets.top + 6 }]}
    >
      {/* Search and Notification Row */}
      <View style={styles.topRow}>
        <View style={[styles.searchContainer, { backgroundColor: theme.isDark ? theme.card : 'rgba(255,255,255,0.85)', borderColor: theme.cardBorder }]}>
          <Ionicons name="search-outline" size={20} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput 
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder={isEn ? "Search transactions, funds..." : "Tìm kiếm giao dịch, quỹ..."}
            placeholderTextColor={theme.textMuted}
          />
        </View>
        <TouchableOpacity 
          style={[styles.notificationBtn, { backgroundColor: theme.isDark ? theme.card : 'rgba(255,255,255,0.85)' }]} 
          activeOpacity={0.7}
          onPress={() => router.push("/notifications")}
        >
          <Ionicons name="notifications-outline" size={22} color={theme.textPrimary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionItem}
            activeOpacity={0.7}
            onPress={() => {
              if (action.route) router.push(action.route as any);
            }}
          >
            <View style={[styles.iconWrapper, { backgroundColor: action.bgColor, borderColor: theme.cardBorder }]}>
              {action.type === "logo" ? (
                <SmartSpendIcon size={32} borderRadius={8} />
              ) : (
                <Ionicons name={action.icon!} size={24} color={action.color} />
              )}
            </View>
            <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </PastelHeaderShell>
  );
};


export default HomeHeader;
