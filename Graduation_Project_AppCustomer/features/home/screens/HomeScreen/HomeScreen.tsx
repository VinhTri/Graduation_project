import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./HomeScreen.styles";
import { PASTEL_PALETTE } from "@/shared/constants/PastelPalette";

import { HomeHeader } from "../../components/HomeHeader";
import { HomeWalletSummary } from "../../components/HomeWalletSummary";
import { HomeInsightCarousel } from "../../components/HomeInsightCarousel";
import { ServicesGrid } from "../../components/ServicesGrid";
import { DiscoverMore } from "../../components/DiscoverMore";
import { AIChatModal } from "../../components/AIChatModal";

export default function HomeScreen() {
  const [isChatVisible, setIsChatVisible] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        directionalLockEnabled
        removeClippedSubviews={false}
      >
        <HomeHeader />
        <HomeWalletSummary />

        <View style={styles.carouselSection}>
          <HomeInsightCarousel />
        </View>

        <View style={styles.sectionContainer}>
          <ServicesGrid />
        </View>

        <View style={styles.sectionContainer}>
          <DiscoverMore />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.aiBubble}
        activeOpacity={0.8}
        onPress={() => setIsChatVisible(true)}
      >
        <Ionicons name="sparkles" size={28} color={PASTEL_PALETTE.white} />
      </TouchableOpacity>

      <AIChatModal
        visible={isChatVisible}
        onClose={() => setIsChatVisible(false)}
      />
    </View>
  );
}
