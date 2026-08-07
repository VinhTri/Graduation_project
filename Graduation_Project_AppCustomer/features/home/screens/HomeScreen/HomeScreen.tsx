import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./HomeScreen.styles";
import { PASTEL_PALETTE } from "@/shared/constants/PastelPalette";

import { HomeHeader } from "../../components/HomeHeader";
import { HomeWalletSummary } from "../../components/HomeWalletSummary";
import { HomeInsightCarousel } from "../../components/HomeInsightCarousel";
import { ServicesGrid } from "../../components/ServicesGrid";
import { HomeNotebookCalendar } from "../../components/HomeNotebookCalendar";
import { DiscoverMore } from "../../components/DiscoverMore";
import { AIChatModal } from "../../components/AIChatModal";

import { useTheme } from "@/shared/contexts/ThemeLanguageContext";

export default function HomeScreen() {
  const [isChatVisible, setIsChatVisible] = useState(false);
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={[styles.scrollView, { backgroundColor: theme.bg }]}
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
          <HomeNotebookCalendar />
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
