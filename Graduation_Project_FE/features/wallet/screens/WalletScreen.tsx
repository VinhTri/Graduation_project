import React from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../../shared/constants/Colors";
import { 
  WalletHeader, 
  WalletList, 
  WalletLinkCard 
} from "../components";

export default function WalletScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top status bar Teal filler */}
      <View style={styles.statusBarFiller} />

      {/* Decoupled Top Header */}
      <WalletHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Link New Wallet Button (placed right below total assets header) */}
        <WalletLinkCard onPress={() => console.log("Link card pressed")} />

        {/* 3 Wallets Stacked Component */}
        <WalletList />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background, // Light grey background allows header curves to be visible
    position: "relative",
  },
  statusBarFiller: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100, // Covers status bar area
    backgroundColor: Colors.primary, // Teal
    zIndex: -1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Space for CustomTabBar
  },
});
