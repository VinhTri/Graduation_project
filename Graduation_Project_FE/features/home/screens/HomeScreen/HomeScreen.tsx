import React from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./HomeScreen.styles";
import Colors from "@/shared/constants/Colors";

import { HomeHeader } from "../../components/HomeHeader";
import { HomeWalletSummary } from "../../components/HomeWalletSummary";
import { AIRecommendationCard } from "../../components/AIRecommendationCard";
import { ServicesGrid } from "../../components/ServicesGrid";
import { SmartSpendProposals } from "../../components/SmartSpendProposals";
import { DiscoverMore } from "../../components/DiscoverMore";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top status bar filler for iOS */}
      <View style={{ backgroundColor: Colors.primary, position: "absolute", top: 0, left: 0, right: 0, height: 100, zIndex: -1 }} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        <HomeHeader />
        <HomeWalletSummary />
        
        <View style={styles.sectionContainer}>
          <AIRecommendationCard />
        </View>

        <View style={styles.sectionContainer}>
          <ServicesGrid />
        </View>

        <View style={styles.sectionContainer}>
          <SmartSpendProposals />
        </View>

        <View style={styles.sectionContainer}>
          <DiscoverMore />
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}
