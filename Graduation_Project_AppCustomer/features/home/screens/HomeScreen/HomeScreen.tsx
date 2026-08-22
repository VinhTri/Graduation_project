import React, { useEffect, useState } from "react";
import { View, ScrollView } from "react-native";
import { styles } from "./HomeScreen.styles";

import { HomeHeader } from "../../components/HomeHeader";
import { HomeWalletSummary } from "../../components/HomeWalletSummary";
import { HomeInsightCarousel } from "../../components/HomeInsightCarousel";
import { ServicesGrid } from "../../components/ServicesGrid";
import { HomeNotebookCalendar } from "../../components/HomeNotebookCalendar";
import { DiscoverMore } from "../../components/DiscoverMore";
import { AIChatModal } from "../../components/AIChatModal";
import { AIChatButton } from "../../components/AIChatButton/AIChatButton";
import { HomeBudgetOverview } from "../../components/HomeBudgetOverview";

import { consumePinSetupSuccessPending } from "@/features/auth/pinSetupSuccessFlag";
import { SuccessModal } from "@/shared/components";
import { useTheme } from "@/shared/contexts/ThemeLanguageContext";

export default function HomeScreen() {
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [pinSuccessVisible, setPinSuccessVisible] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (consumePinSetupSuccessPending()) {
      setPinSuccessVisible(true);
    }
  }, []);

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
        <HomeBudgetOverview />

        <View style={styles.carouselSection}>
          <HomeInsightCarousel />
        </View>

        <View style={styles.sectionContainer}>
          <ServicesGrid />
        </View>

        <HomeNotebookCalendar />

        <View style={styles.sectionContainer}>
          <DiscoverMore />
        </View>
      </ScrollView>

      <AIChatButton onPress={() => setIsChatVisible(true)} />

      <AIChatModal
        visible={isChatVisible}
        onClose={() => setIsChatVisible(false)}
      />

      <SuccessModal
        visible={pinSuccessVisible}
        title="Thiết lập mã PIN thành công!"
        message="Mã PIN của bạn đã được lưu. Bạn có thể dùng PIN để xác thực các giao dịch quan trọng."
        confirmLabel="Đã hiểu"
        variant="pastel"
        imageSource={require("../../../../assets/images/onboarding/pin-success.png")}
        onClose={() => setPinSuccessVisible(false)}
      />
    </View>
  );
}
