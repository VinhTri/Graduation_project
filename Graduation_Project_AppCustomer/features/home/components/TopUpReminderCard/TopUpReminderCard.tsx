import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { styles } from "./TopUpReminderCard.styles";

interface Props {
  count: number;
}

export const TopUpReminderCard = ({ count }: Props) => {
  const router = useRouter();

  if (count <= 0) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.85}
      onPress={() => router.push("/wallet/history")}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.iconEmoji}>🐷</Text>
        <View style={styles.sparkleBadge}>
          <Ionicons name="sparkles" size={12} color="#F59E0B" />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Ví vừa nhận tiền, hoan hô! 🎉</Text>
        <Text style={styles.message}>
          Bạn có {count} giao dịch nạp tiền chưa phân loại. Ghé lịch sử giao dịch
          gắn danh mục & ghi chú để quản chi tiêu gọn gàng hơn nha! 💖
        </Text>

        <View style={styles.ctaRow}>
          <Text style={styles.ctaText}>Phân loại ngay</Text>
          <Ionicons name="arrow-forward-circle" size={18} color="#DB2777" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default TopUpReminderCard;
