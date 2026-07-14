import React, { useState } from "react";
import { View, ScrollView, Dimensions, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./HomeScreen.styles";
import Colors from "@/shared/constants/Colors";

import { HomeHeader } from "../../components/HomeHeader";
import { HomeWalletSummary } from "../../components/HomeWalletSummary";
import { AIRecommendationCard } from "../../components/AIRecommendationCard";
import { ServicesGrid } from "../../components/ServicesGrid";
import { SmartSpendProposals } from "../../components/SmartSpendProposals";
import { DiscoverMore } from "../../components/DiscoverMore";
import { AIChatModal } from "../../components/AIChatModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;

export default function HomeScreen() {
  const [isChatVisible, setIsChatVisible] = useState(false);

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
        
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
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

      {/* Floating AI Bubble */}
      <TouchableOpacity 
        style={styles.aiBubble} 
        activeOpacity={0.8}
        onPress={() => setIsChatVisible(true)}
      >
        <Ionicons name="sparkles" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* AI Chat Modal */}
      <AIChatModal 
        visible={isChatVisible} 
        onClose={() => setIsChatVisible(false)} 
      />
    </SafeAreaView>
  );
}
