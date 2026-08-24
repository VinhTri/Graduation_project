import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { styles } from "./ServicesGrid.styles";
import { friendshipService } from "../../../../shared/api/services/friendship.service";
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage, useTheme } from "../../../../shared/contexts/ThemeLanguageContext";

interface ServiceDef {
  id: string;
  label: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons';
  icon: string;
  color: string;
  bgColor: string;
  route: string;
}

export const ServicesGrid = () => {
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = React.useState(0);
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isEn = language === 'en';

  const homeServices: ServiceDef[] = [
    {
      id: "3",
      label: isEn ? "Invoices" : "Hóa đơn",
      iconFamily: "Ionicons",
      icon: "receipt-outline",
      color: "#10B981",
      bgColor: theme.isDark ? theme.bgSoft : "#ECFDF5",
      route: "/invoice",
    },
    {
      id: "10",
      label: isEn ? "Contacts" : "Danh bạ",
      iconFamily: "Ionicons",
      icon: "people-circle-outline",
      color: "#EC4899",
      bgColor: theme.isDark ? theme.bgSoft : "#FDF2F8",
      route: "/contacts",
    },
    {
      id: "split_bill",
      label: isEn ? "Split Bill" : "Chia tiền",
      iconFamily: "MaterialCommunityIcons",
      icon: "account-cash-outline",
      color: "#7C3AED",
      bgColor: theme.isDark ? theme.bgSoft : "#F5F3FF",
      route: "/split-bill",
    },
  ];

  const fixedServices: ServiceDef[] = [
    {
      id: "danh_muc",
      label: isEn ? "Categories" : "Danh mục",
      iconFamily: "Ionicons",
      icon: "layers-outline",
      color: "#6366F1",
      bgColor: theme.isDark ? theme.bgSoft : "#EEF2FF",
      route: "/categories",
    },
  ];

  useFocusEffect(
    React.useCallback(() => {
      fetchPendingRequests();
    }, [])
  );

  const fetchPendingRequests = async () => {
    try {
      const res = await friendshipService.getRequests();
      if (res.success) {
        setPendingRequests(res.data.length);
      }
    } catch (error: any) {
      const code = error?.code ?? error?.response?.data?.code;
      if (code !== 'AUTH_1017') {
        console.log('Error fetching requests in grid', error);
      }
    }
  };

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  const displayServices = [...homeServices, ...fixedServices];

  const renderIcon = (service: ServiceDef) => {
    if (service.iconFamily === "MaterialCommunityIcons") {
      return <MaterialCommunityIcons name={service.icon as any} size={26} color={service.color} />;
    }
    return <Ionicons name={service.icon as any} size={25} color={service.color} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.grid}>
        {displayServices.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceItem}
            activeOpacity={0.7}
            onPress={() => handlePress(service.route)}
          >
            <View style={[styles.iconContainer, { backgroundColor: service.bgColor, borderColor: theme.cardBorder }]}>
              {renderIcon(service)}
              {service.id === "10" && pendingRequests > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  backgroundColor: '#EF4444',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                  borderWidth: 2,
                  borderColor: theme.card
                }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {pendingRequests > 99 ? '99+' : pendingRequests}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.serviceLabel, { color: theme.textPrimary }]} numberOfLines={2}>{service.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default ServicesGrid;
