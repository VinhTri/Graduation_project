import React, { useState, useCallback } from "react";
import { View, ScrollView, Dimensions, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { styles } from "./HomeScreen.styles";
import Colors from "@/shared/constants/Colors";

import { HomeHeader } from "../../components/HomeHeader";
import { HomeWalletSummary } from "../../components/HomeWalletSummary";
import { AIRecommendationCard } from "../../components/AIRecommendationCard";
import { ServicesGrid } from "../../components/ServicesGrid";
import { SmartSpendProposals } from "../../components/SmartSpendProposals";
import { DiscoverMore } from "../../components/DiscoverMore";
import { PendingTransactionCard } from "../../components/PendingTransactionCard";
import { AIChatModal } from "../../components/AIChatModal";
import { transactionService, TopUpResponse } from "@/shared/api/services/transactionService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;

export default function HomeScreen() {
  const [pendingTopUp, setPendingTopUp] = useState<TopUpResponse | null>(null);
  const [isChatVisible, setIsChatVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchPendingTransaction = async () => {
        const response = await transactionService.getPendingTopUp();
        if (response && response.transactionCode) {
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          const isCancelled = await AsyncStorage.getItem(`cancelled_tx_${response.transactionCode}`);
          if (isCancelled === "true") {
            setPendingTopUp(null);
            return;
          }
        }
        setPendingTopUp(response);
      };
      
      fetchPendingTransaction();
    }, [])
  );

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
        
        <View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 16}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 16, marginTop: 16 }}
          >
            {pendingTopUp ? (
              <>
                <View style={{ width: CARD_WIDTH }}>
                  <PendingTransactionCard 
                    transaction={pendingTopUp} 
                    onDismiss={async () => {
                      if (pendingTopUp?.transactionCode) {
                        try {
                          await transactionService.cancelTransaction(pendingTopUp.transactionCode);
                        } catch (e) {
                          console.log("Failed to cancel on backend", e);
                        }
                      }
                      setPendingTopUp(null);
                    }}
                  />
                </View>
                <View style={{ width: CARD_WIDTH, marginLeft: 16 }}>
                  <AIRecommendationCard />
                </View>
              </>
            ) : (
              <View style={{ width: CARD_WIDTH }}>
                <AIRecommendationCard />
              </View>
            )}
          </ScrollView>
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
