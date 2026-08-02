import React from "react";
import { StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PASTEL_PALETTE } from "../../../shared/constants/PastelPalette";
import { 
  WalletHeader, 
  WalletList 
} from "../components";

export default function WalletScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <WalletHeader onOpenAccountPress={() => console.log("Open wallet account pressed")} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <WalletList />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.bg,
  },
  scrollView: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.bg,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
});
