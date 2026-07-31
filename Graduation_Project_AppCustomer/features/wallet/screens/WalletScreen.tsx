import React from "react";
import { StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../shared/contexts/ThemeLanguageContext";
import { PASTEL_PALETTE } from "../../../shared/constants/PastelPalette";
import { 
  WalletHeader, 
  WalletList 
} from "../components";

export default function WalletScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={["left", "right", "bottom"]}>
      <WalletHeader onOpenAccountPress={() => console.log("Open wallet account pressed")} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={[styles.scrollView, { backgroundColor: theme.bg }]}
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
