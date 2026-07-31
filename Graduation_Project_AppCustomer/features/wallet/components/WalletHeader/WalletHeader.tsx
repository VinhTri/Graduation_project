import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { WalletHeaderProps } from "./WalletHeader.types";
import { styles } from "./WalletHeader.styles";
import WalletTotalAsset from "../WalletTotalAsset";
import { PastelHeaderShell } from "../../../../shared/components/PastelHeaderShell";
import { useLanguage, useTheme } from "../../../../shared/contexts/ThemeLanguageContext";

export const WalletHeader: React.FC<WalletHeaderProps> = ({ onBackPress, onOpenAccountPress }) => {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useTheme();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <PastelHeaderShell contentStyle={styles.headerContainer}>
      <View style={styles.topBar}>
        <View style={styles.leftSection}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back-outline" size={22} color={theme.primary} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
              {t('smartSpendWallet')}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
              {t('walletSub')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.openAccountBtn, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
          onPress={onOpenAccountPress}
        >
          <Ionicons name="add-circle" size={18} color="#FFF" />
          <Text style={styles.openAccountText}>{t('deposit')}</Text>
        </TouchableOpacity>
      </View>

      <WalletTotalAsset />
    </PastelHeaderShell>
  );
};

export default WalletHeader;

