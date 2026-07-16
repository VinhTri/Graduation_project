import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./ServicesGrid.styles";
import { friendshipService } from "../../../../shared/api/services/friendship.service";
import { useFocusEffect } from '@react-navigation/native';

const HOME_SERVICES = [
  { id: "3", label: "Hóa đơn", icon: "receipt-outline", color: "#10B981", bgColor: "#D1FAE5", route: "/invoice" },
  { id: "10", label: "Danh bạ", icon: "people-circle-outline", color: "#EC4899", bgColor: "#FFE4F0", route: "/contacts" },
] as const;

const FIXED_SERVICES = [
  { id: "danh_muc", label: "Danh mục", icon: "layers-outline", color: "#7C3AED", bgColor: "#EDE9FE", route: "/categories" },
  { id: "tat_ca", label: "Tất cả", icon: "grid-outline", color: "#64748B", bgColor: "#F1F5F9", route: "/all-services" },
] as const;

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
            <View style={[styles.iconContainer, { backgroundColor: service.bgColor }]}>
              <Ionicons name={service.icon as any} size={24} color={service.color} />
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
                  borderColor: 'white'
                }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {pendingRequests > 99 ? '99+' : pendingRequests}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.serviceLabel} numberOfLines={2}>{service.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default ServicesGrid;
