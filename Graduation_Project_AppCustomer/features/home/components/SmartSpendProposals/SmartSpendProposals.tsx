import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./SmartSpendProposals.styles";
import Colors from "@/shared/constants/Colors";

const PROPOSALS = [
  { id: "1", label: "Phân tích", icon: "stats-chart", color: "#0D9488", bgColor: "#F0FDFA" }, // Teal
  { id: "2", label: "Hạn mức", icon: "speedometer-outline", color: "#2563EB", bgColor: "#EFF6FF" }, // Blue
  { id: "3", label: "Mục tiêu", icon: "flag-outline", color: "#D97706", bgColor: "#FEF3C7" }, // Yellow/Gold
  { id: "4", label: "Nhắc nhở", icon: "alarm-outline", color: "#DB2777", bgColor: "#FDF2F8" }, // Pink
];

export const SmartSpendProposals = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={24} color={Colors.primary} />
        <Text style={styles.title}>SmartSpend đề xuất</Text>
      </View>
      <View style={styles.itemsRow}>
        {PROPOSALS.map((item) => (
          <TouchableOpacity key={item.id} style={styles.proposalItem} activeOpacity={0.7}>
            <View style={[styles.iconWrapper, { backgroundColor: item.bgColor }]}>
              <Ionicons name={item.icon as any} size={28} color={item.color} />
            </View>
            <Text style={styles.itemLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default SmartSpendProposals;
