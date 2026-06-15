import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../../../shared/constants/Colors";
import { WalletTotalAssetProps } from "./WalletTotalAsset.types";
import { styles } from "./WalletTotalAsset.styles";

export const WalletTotalAsset: React.FC<WalletTotalAssetProps> = ({
  totalBalance = 25650000,
}) => {
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  const formatCurrency = (val: number) => {
    if (isBalanceHidden) return "•••••• ₫";
    return val.toLocaleString("vi-VN") + " ₫";
  };

  return (
    <View style={styles.balanceCard}>
      <View style={styles.balanceHeader}>
        <View style={styles.balanceLabelContainer}>
          <Ionicons name="shield-checkmark-outline" size={14} color="rgba(255, 255, 255, 0.75)" />
          <Text style={styles.balanceLabel}>TỔNG TÀI SẢN KHẢ DỤNG</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setIsBalanceHidden(!isBalanceHidden)} 
          activeOpacity={0.7}
          style={styles.eyeButton}
        >
          <Ionicons 
            name={isBalanceHidden ? "eye-off-outline" : "eye-outline"} 
            size={18} 
            color="rgba(255, 255, 255, 0.85)" 
          />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.balanceValue}>
        {formatCurrency(totalBalance)}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={styles.statDot} />
          <Text style={styles.statText}>3 ví đang kết nối</Text>
        </View>
        <View style={styles.verticalDivider} />
        <Text style={styles.safetyText}>Bảo mật 256-bit</Text>
      </View>
    </View>
  );
};

export default WalletTotalAsset;
