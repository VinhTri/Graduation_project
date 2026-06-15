import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Colors from "../../../../shared/constants/Colors";
import { WalletHeaderProps } from "./WalletHeader.types";
import { styles } from "./WalletHeader.styles";
import WalletTotalAsset from "../WalletTotalAsset";

export const WalletHeader: React.FC<WalletHeaderProps> = ({ onBackPress }) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      // Navigate back to the home screen tab
      router.replace("/(tabs)");
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* Top Bar Row */}
      <View style={styles.topBar}>
        <View style={styles.leftSection}>
          <TouchableOpacity 
            style={styles.backButton} 
            activeOpacity={0.7}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Ví của tôi</Text>
            <Text style={styles.headerSubtitle}>Quản lý tài sản thông minh</Text>
          </View>
        </View>
      </View>

      {/* Render Decoupled Total Asset Card Component */}
      <WalletTotalAsset />
    </View>
  );
};

export default WalletHeader;
