import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./HomeHeader.styles";
import { PASTEL_PALETTE } from "@/shared/constants/PastelPalette";
import { PastelHeaderShell } from "@/shared/components/PastelHeaderShell";
import { useRouter } from "expo-router";
import { notificationService } from "@/shared/api/services/notification.service";
import { useFocusEffect } from "@react-navigation/native";
import { HomeReceiveQr } from "../HomeReceiveQr";

import { useLanguage, useTheme } from "@/shared/contexts/ThemeLanguageContext";

export const HomeHeader = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = useState(0);
  const [receiveVisible, setReceiveVisible] = useState(false);
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isEn = language === 'en';

  const quickActions = [
    {
      id: "receive-qr",
      label: isEn ? "Receive QR" : "QR nhận tiền",
      icon: "qr-code" as const,
      color: theme.isDark ? theme.primary : PASTEL_PALETTE.accentDeep,
    },
    {
      id: "withdraw",
      label: isEn ? "Withdraw" : "Rút tiền",
      icon: "arrow-down-outline" as const,
      color: theme.isDark ? theme.primary : PASTEL_PALETTE.subtitle,
      route: "/wallet/withdraw",
    },
    {
      id: "transfer",
      label: isEn ? "Transfer" : "Chuyển tiền",
      icon: "paper-plane-outline" as const,
      color: theme.isDark ? theme.primary : PASTEL_PALETTE.lavender,
      route: "/transfer",
    },
    {
      id: "scan-qr",
      label: isEn ? "Scan QR" : "Quét mã QR",
      icon: "scan-outline" as const,
      color: theme.isDark ? theme.primary : PASTEL_PALETTE.accentDeep,
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
      coverImage={require('../../../../assets/images/home-list-header.png')}
    >
      {/* Search and Notification Row */}
      <View style={styles.topRow}>
        <View style={[styles.searchContainer, { borderColor: theme.isDark ? theme.primary : PASTEL_PALETTE.subtitle }]}>
          <Ionicons name="search-outline" size={20} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput 
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder={isEn ? "Search transactions, funds..." : "Tìm kiếm giao dịch, quỹ..."}
            placeholderTextColor={theme.textMuted}
          />
        </View>
        <TouchableOpacity 
          style={[styles.notificationBtn, { borderColor: theme.isDark ? theme.primary : PASTEL_PALETTE.subtitle }]} 
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
              if (action.id === "receive-qr") {
                setReceiveVisible(true);
                return;
              }
              if (action.id === "scan-qr") {
                router.push({
                  pathname: "/transfer",
                  params: { scan: "1" },
                });
                return;
              }
              if (action.route) router.push(action.route as any);
            }}
          >
            <View style={[styles.iconWrapper, { borderColor: action.color }]}>
              <Ionicons name={action.icon} size={24} color={action.color} />
            </View>
            <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <HomeReceiveQr
        visible={receiveVisible}
        onClose={() => setReceiveVisible(false)}
      />
    </PastelHeaderShell>
  );
};


export default HomeHeader;
