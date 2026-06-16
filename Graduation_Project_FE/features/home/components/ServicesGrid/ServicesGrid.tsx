import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./ServicesGrid.styles";

const SERVICES = [
  { id: "1", label: "Chuyển tiền", icon: "paper-plane-outline", color: "#EF4444", bgColor: "#FEE2E2" },
  { id: "2", label: "Chuyển tiền", icon: "business-outline", color: "#3B82F6", bgColor: "#DBEAFE" },
  { id: "3", label: "Thanh toán", icon: "receipt-outline", color: "#10B981", bgColor: "#D1FAE5" },
  { id: "4", label: "Nạp tiền", icon: "phone-portrait-outline", color: "#0EA5E9", bgColor: "#E0F2FE" },
  
  { id: "5", label: "Data 4G/5G", icon: "wifi-outline", color: "#3B82F6", bgColor: "#DBEAFE" },
  { id: "6", label: "Túi Thần Tài", icon: "cash-outline", color: "#F59E0B", bgColor: "#FEF3C7" },
  { id: "7", label: "Ví Trả Sau", icon: "time-outline", color: "#EC4899", bgColor: "#FCE7F3" },
  { id: "8", label: "Thanh toán", icon: "card-outline", color: "#F97316", bgColor: "#FFEDD5" },
  
  { id: "9", label: "Tiết kiệm", icon: "save-outline", color: "#E11D48", bgColor: "#FFE4E6" },
  { id: "10", label: "Cộng đồng", icon: "people-outline", color: "#8B5CF6", bgColor: "#EDE9FE" },
  { id: "11", label: "Mua vé", icon: "film-outline", color: "#06B6D4", bgColor: "#CFFAFE" },
  { id: "12", label: "Xem thêm", icon: "grid-outline", color: "#64748B", bgColor: "#F1F5F9" },
];

export const ServicesGrid = () => {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {SERVICES.map((service) => (
          <TouchableOpacity key={service.id} style={styles.serviceItem} activeOpacity={0.7}>
            <View style={[styles.iconContainer, { backgroundColor: service.bgColor }]}>
              <Ionicons name={service.icon as any} size={24} color={service.color} />
            </View>
            <Text style={styles.serviceLabel} numberOfLines={2}>{service.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default ServicesGrid;
