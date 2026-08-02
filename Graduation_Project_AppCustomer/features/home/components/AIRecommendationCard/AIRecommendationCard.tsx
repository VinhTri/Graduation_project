import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./AIRecommendationCard.styles";
import { PASTEL_PALETTE } from "@/shared/constants/PastelPalette";
import { useTheme } from "@/shared/contexts/ThemeLanguageContext";

export const AIRecommendationCard = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.bgSoft }]}>
        <Ionicons name="sparkles" size={24} color={theme.primary} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Trợ lý AI khuyên bạn</Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          Bạn đã chi tiêu ít hơn 15% so với cùng kỳ tuần trước. Hãy tiếp tục duy trì mức này để đạt mục tiêu tiết kiệm nhé!
        </Text>
      </View>
    </View>
  );
};

export default AIRecommendationCard;
