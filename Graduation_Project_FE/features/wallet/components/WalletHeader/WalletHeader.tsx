import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { WalletHeaderProps } from "./WalletHeader.types";
import { styles } from "./WalletHeader.styles";
import WalletTotalAsset from "../WalletTotalAsset";
import { PastelHeaderShell } from "../../../../shared/components/PastelHeaderShell";

export const WalletHeader: React.FC<WalletHeaderProps> = ({ onBackPress, onOpenAccountPress }) => {
  const router = useRouter();

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
            <Ionicons name="chevron-back-outline" size={22} color="#7C3AED" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
              Ví của tôi
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
              Quản lý tài sản thông minh
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.openAccountBtn}
          activeOpacity={0.85}
          onPress={onOpenAccountPress}
        >
          <Ionicons name="add-circle" size={18} color="#FFF" />
          <Text style={styles.openAccountText}>Mở ví</Text>
        </TouchableOpacity>
      </View>

      <WalletTotalAsset />
    </PastelHeaderShell>
  );
};

export default WalletHeader;
