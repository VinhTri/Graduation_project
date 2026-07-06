import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./ServicesGrid.styles";
import { friendshipService } from "../../../../shared/api/services/friendship.service";
import { useFocusEffect } from '@react-navigation/native';

const HOME_SERVICES = [
  { id: "1", label: "Chuyển tiền", icon: "paper-plane-outline", color: "#EF4444", bgColor: "#FEE2E2" },
  { id: "2", label: "Chuyển tiền", icon: "business-outline", color: "#3B82F6", bgColor: "#DBEAFE" },
  { id: "3", label: "Thanh toán", icon: "receipt-outline", color: "#10B981", bgColor: "#D1FAE5" },
  { id: "4", label: "Nạp tiền", icon: "phone-portrait-outline", color: "#0EA5E9", bgColor: "#E0F2FE" },

  { id: "5", label: "Data 4G/5G", icon: "wifi-outline", color: "#3B82F6", bgColor: "#DBEAFE" },
  { id: "6", label: "Túi Thần Tài", icon: "cash-outline", color: "#F59E0B", bgColor: "#FEF3C7" },
  { id: "7", label: "Ví Trả Sau", icon: "time-outline", color: "#EC4899", bgColor: "#FCE7F3" },
  { id: "8", label: "Thanh toán", icon: "card-outline", color: "#F97316", bgColor: "#FFEDD5" },

  { id: "9", label: "Tiết kiệm", icon: "save-outline", color: "#E11D48", bgColor: "#FFE4E6" },
  { id: "10", label: "Danh bạ", icon: "book-outline", color: "#8B5CF6", bgColor: "#EDE9FE" },
  { id: "11", label: "Mua vé", icon: "film-outline", color: "#06B6D4", bgColor: "#CFFAFE" },
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

  const handlePress = (id: string, label: string) => {
    if (id === "danh_muc") {
      router.push('/categories');
    } else if (id === "tat_ca") {
      router.push('/all-services');
    } else if (id === "10") {
      router.push('/contacts');
    } else if (label === "Nạp tiền") {
      router.push("/wallet/action?initialTab=topup");
    } else {
      // Handle normal service press
      console.log("Pressed service:", id);
    }
  };

  const displayServices = [...HOME_SERVICES];

  // Add the fixed "Danh mục" button
  displayServices.push({
    id: "danh_muc",
    label: "Danh mục",
    icon: "layers-outline" as any,
    color: "#3B82F6",
    bgColor: "#DBEAFE"
  });

  // Add the fixed "Tất cả" button at the end
  displayServices.push({
    id: "tat_ca",
    label: "Tất cả",
    icon: "grid-outline" as any,
    color: "#64748B",
    bgColor: "#F1F5F9"
  });

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {displayServices.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceItem}
            activeOpacity={0.7}
            onPress={() => handlePress(service.id, service.label)}
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
