import React, { useCallback, useState } from "react";
import { View, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useFocusEffect } from "expo-router";
import { transactionService } from "@/shared/api/services/transactionService";
import { AIRecommendationCard } from "../AIRecommendationCard";
import { TopUpReminderCard } from "../TopUpReminderCard";
import { styles } from "./HomeInsightCarousel.styles";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const HomeInsightCarousel = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const data = await transactionService.getTransactionHistory();
          if (cancelled) return;
          // Giao dịch nạp tiền chưa gắn danh mục -> cần người dùng vào phân loại.
          const count = (data || []).filter(
            (t: any) => t?.type === "TOP_UP" && !t?.categoryId
          ).length;
          setPendingCount(count);
        } catch (error) {
          if (!cancelled) setPendingCount(0);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const hasReminder = pendingCount > 0;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  // Chưa có nhắc nhở -> chỉ hiển thị card Trợ lý AI, không cần vuốt.
  if (!hasReminder) {
    return (
      <View style={styles.page}>
        <AIRecommendationCard />
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        decelerationRate="fast"
        directionalLockEnabled
        nestedScrollEnabled
      >
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <AIRecommendationCard />
        </View>
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <TopUpReminderCard count={pendingCount} />
        </View>
      </ScrollView>

      <View style={styles.dotsRow}>
        {[0, 1].map((i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
};

export default HomeInsightCarousel;
