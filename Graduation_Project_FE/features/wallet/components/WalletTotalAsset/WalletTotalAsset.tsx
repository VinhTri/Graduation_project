import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useFocusEffect } from "expo-router";
import { walletService } from "../../../../shared/api/services/walletService";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../../../shared/constants/Colors";
import { WalletTotalAssetProps } from "./WalletTotalAsset.types";
import { styles } from "./WalletTotalAsset.styles";

export const WalletTotalAsset: React.FC<WalletTotalAssetProps> = ({
  totalBalance = 0,
}) => {
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [balance, setBalance] = useState(totalBalance);

  useFocusEffect(
    useCallback(() => {
      const fetchWallet = async () => {
        try {
          const data = await walletService.getMyWallet();
          if (data) {
            setBalance(data.balance);
          }
        } catch (error) {
          console.log("Error fetching wallet balance", error);
        }
      };
      fetchWallet();
    }, [])
  );

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
        {formatCurrency(balance)}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={styles.statDot} />
          <Text style={styles.statText}>1 ví đang kết nối</Text>
        </View>
        <View style={styles.verticalDivider} />
        <Text style={styles.safetyText}>Bảo mật 256-bit</Text>
      </View>
    </View>
  );
};

export default WalletTotalAsset;
