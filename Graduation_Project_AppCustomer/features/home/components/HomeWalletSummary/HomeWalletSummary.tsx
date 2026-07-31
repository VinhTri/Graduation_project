import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SmartSpendIcon } from "@/shared/components/SmartSpendIcon";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./HomeWalletSummary.styles";
import { PASTEL_PALETTE } from "@/shared/constants/PastelPalette";
import { walletService } from "@/shared/api/services/walletService";
import { useFocusEffect } from "expo-router";

import { useLanguage, useTheme } from "@/shared/contexts/ThemeLanguageContext";

export const HomeWalletSummary = () => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isEn = language === 'en';

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
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.walletsRow}>
        <TouchableOpacity onPress={toggleBalance} style={styles.eyeIcon}>
          <Ionicons name={isBalanceVisible ? "eye-outline" : "eye-off-outline"} size={22} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* SmartSpend */}
        <View style={[styles.walletItem, { borderRightColor: theme.divider }]}>
          <View style={styles.smartSpendHeader}>
            <SmartSpendIcon size={16} borderRadius={4} />
            <Text style={styles.smartSpendLabel}>
              <Text style={[styles.brandSmart, { color: theme.textPrimary }]}>Smart</Text>
              <Text style={styles.brandSpend}>Spend</Text>
            </Text>
          </View>
          <View style={styles.walletBalanceRow}>
            <Text style={[styles.walletBalance, { color: theme.textPrimary }]}>{isBalanceVisible ? `${walletBalance.toLocaleString("vi-VN")}đ` : "***"}</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
          </View>
        </View>

        {/* Tiết Kiệm */}
        <View style={[styles.walletItem, { borderRightColor: theme.divider }]}>
          <Text style={[styles.walletLabel, { color: theme.textSecondary }]}>{isEn ? 'Savings Wallet' : 'Ví Tiết Kiệm'}</Text>
          <View style={styles.walletBalanceRow}>
            <Text style={[styles.walletBalance, { color: theme.textMuted, fontSize: 13, fontWeight: "500" }]}>{isEn ? 'Not linked' : 'Chưa liên kết'}</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
          </View>
        </View>

        {/* Quỹ */}
        <View style={[styles.walletItem, styles.walletItemNoBorder]}>
          <Text style={[styles.walletLabel, { color: theme.textSecondary }]}>{isEn ? 'Group Fund' : 'Quỹ'}</Text>
          <View style={styles.walletBalanceRow}>
            <Text style={[styles.walletBalance, { color: theme.textMuted, fontSize: 13, fontWeight: "500" }]}>{isEn ? 'Not linked' : 'Chưa liên kết'}</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
          </View>
        </View>
      </View>

      {/* Financial Center Button */}
      <TouchableOpacity style={[styles.financialCenterBtn, { backgroundColor: theme.bgSoft, borderColor: theme.cardBorder }]} activeOpacity={0.7}>
        <View style={styles.financialCenterLeft}>
          <Ionicons name="trending-up-outline" size={20} color={theme.primary} />
          <Text style={[styles.financialCenterText, { color: theme.textPrimary }]}>{isEn ? 'Your Financial Center' : 'Trung Tâm Tài Chính của bạn'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );
};

export default HomeWalletSummary;
