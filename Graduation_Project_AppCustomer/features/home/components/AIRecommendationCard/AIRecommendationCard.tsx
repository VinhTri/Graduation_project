import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./AIRecommendationCard.styles";
import { PASTEL_PALETTE } from "@/shared/constants/PastelPalette";

export const AIRecommendationCard = () => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="sparkles" size={24} color={PASTEL_PALETTE.lavender} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Trợ lý AI khuyên bạn</Text>
        <Text style={styles.message}>
          Bạn đã chi tiêu ít hơn 15% so với cùng kỳ tuần trước. Hãy tiếp tục duy trì mức này để đạt mục tiêu tiết kiệm nhé!
        </Text>
      </View>
    </View>
  );
};

export default AIRecommendationCard;
