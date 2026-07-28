import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SmartSpendIcon } from "@/shared/components/SmartSpendIcon";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./HomeWalletSummary.styles";
import { PASTEL_PALETTE } from "@/shared/constants/PastelPalette";
import { walletService } from "@/shared/api/services/walletService";
import { useFocusEffect } from "expo-router";

export const HomeWalletSummary = () => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  const toggleBalance = () => setIsBalanceVisible(!isBalanceVisible);

  const fetchWallet = async () => {
    try {
      const response = await walletService.getMyWallet();
      if (response) {
        setWalletBalance(response.balance);
      }
    } catch (error) {
      console.log("Error fetching wallet in HomeWalletSummary", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWallet();
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.walletsRow}>
        <TouchableOpacity onPress={toggleBalance} style={styles.eyeIcon}>
          <Ionicons name={isBalanceVisible ? "eye-outline" : "eye-off-outline"} size={22} color={PASTEL_PALETTE.subtitle} />
        </TouchableOpacity>

        {/* SmartSpend */}
        <View style={styles.walletItem}>
          <View style={styles.smartSpendHeader}>
            <SmartSpendIcon size={16} borderRadius={4} />
            <Text style={styles.smartSpendLabel}>
              <Text style={styles.brandSmart}>Smart</Text>
              <Text style={styles.brandSpend}>Spend</Text>
            </Text>
          </View>
          <View style={styles.walletBalanceRow}>
            <Text style={styles.walletBalance}>{isBalanceVisible ? `${walletBalance.toLocaleString("vi-VN")}đ` : "***"}</Text>
            <Ionicons name="chevron-forward" size={14} color={PASTEL_PALETTE.textMuted} />
          </View>
        </View>

        {/* Tiết Kiệm */}
        <View style={styles.walletItem}>
          <Text style={styles.walletLabel}>Ví Tiết Kiệm</Text>
          <View style={styles.walletBalanceRow}>
            <Text style={[styles.walletBalance, { color: PASTEL_PALETTE.textMuted, fontSize: 13, fontWeight: "500" }]}>Chưa liên kết</Text>
            <Ionicons name="chevron-forward" size={14} color={PASTEL_PALETTE.textMuted} />
          </View>
        </View>

        {/* Quỹ */}
        <View style={[styles.walletItem, styles.walletItemNoBorder]}>
          <Text style={styles.walletLabel}>Quỹ</Text>
          <View style={styles.walletBalanceRow}>
            <Text style={[styles.walletBalance, { color: PASTEL_PALETTE.textMuted, fontSize: 13, fontWeight: "500" }]}>Chưa liên kết</Text>
            <Ionicons name="chevron-forward" size={14} color={PASTEL_PALETTE.textMuted} />
          </View>
        </View>
      </View>

      {/* Financial Center Button */}
      <TouchableOpacity style={styles.financialCenterBtn} activeOpacity={0.7}>
        <View style={styles.financialCenterLeft}>
          <Ionicons name="trending-up-outline" size={20} color={PASTEL_PALETTE.lavender} />
          <Text style={styles.financialCenterText}>Trung Tâm Tài Chính của bạn</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={PASTEL_PALETTE.lavender} />
      </TouchableOpacity>
    </View>
  );
};

export default HomeWalletSummary;
