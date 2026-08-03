import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "./ServicesGrid.styles";
import { friendshipService } from "../../../../shared/api/services/friendship.service";
import { useFocusEffect } from '@react-navigation/native';

interface ServiceDef {
  id: string;
  label: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons';
  icon: string;
  color: string;
  gradient: readonly [string, string];
  borderColor: string;
  route: string;
}

const HOME_SERVICES: ServiceDef[] = [
  {
    id: "3",
    label: "Hóa đơn",
    iconFamily: "Ionicons",
    icon: "receipt-outline",
    color: "#059669",
    gradient: ["#ECFDF5", "#D1FAE5"],
    borderColor: "#A7F3D0",
    route: "/invoice",
  },
  {
    id: "10",
    label: "Danh bạ",
    iconFamily: "Ionicons",
    icon: "people-circle-outline",
    color: "#DB2777",
    gradient: ["#FDF2F8", "#FCE7F3"],
    borderColor: "#FBCFE8",
    route: "/contacts",
  },
  {
    id: "split_bill",
    label: "Chia tiền",
    iconFamily: "MaterialCommunityIcons",
    icon: "account-cash-outline",
    color: "#7C3AED",
    gradient: ["#F5F3FF", "#EDE9FE"],
    borderColor: "#DDD6FE",
    route: "/split-bill",
  },
  {
    id: "budget",
    label: "Ngân sách",
    iconFamily: "Ionicons",
    icon: "pie-chart-outline",
    color: "#D97706",
    gradient: ["#FFFBEB", "#FEF3C7"],
    borderColor: "#FDE68A",
    route: "/budget",
  },
];

const FIXED_SERVICES: ServiceDef[] = [
  {
    id: "danh_muc",
    label: "Danh mục",
    iconFamily: "Ionicons",
    icon: "layers-outline",
    color: "#6366F1",
    gradient: ["#EEF2FF", "#E0E7FF"],
    borderColor: "#C7D2FE",
    route: "/categories",
  },
];

export const ServicesGrid = () => {
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = React.useState(0);

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
    } catch (error) {
      console.log('Error fetching requests in grid', error);
    }
  };

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  const displayServices = [...HOME_SERVICES, ...FIXED_SERVICES];

  const renderIcon = (service: ServiceDef) => {
    if (service.iconFamily === "MaterialCommunityIcons") {
      return <MaterialCommunityIcons name={service.icon as any} size={26} color={service.color} />;
    }
    return <Ionicons name={service.icon as any} size={25} color={service.color} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {displayServices.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceItem}
            activeOpacity={0.7}
            onPress={() => handlePress(service.route)}
          >
            <LinearGradient
              colors={service.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.iconContainer, { borderColor: service.borderColor }]}
            >
              {renderIcon(service)}
              {service.id === "10" && pendingRequests > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {pendingRequests > 99 ? '99+' : pendingRequests}
                  </Text>
                </View>
              )}
            </LinearGradient>
            <Text style={styles.serviceLabel} numberOfLines={2}>{service.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default ServicesGrid;
