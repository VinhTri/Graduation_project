import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./HomeWalletSummary.styles";
import Colors from "@/shared/constants/Colors";

export const HomeWalletSummary = () => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const toggleBalance = () => setIsBalanceVisible(!isBalanceVisible);

  return (
    <View style={styles.container}>
      <View style={styles.walletsRow}>
        <TouchableOpacity onPress={toggleBalance} style={styles.eyeIcon}>
          <Ionicons name={isBalanceVisible ? "eye-outline" : "eye-off-outline"} size={22} color={Colors.text} />
        </TouchableOpacity>

        {/* SmartSpend */}
        <View style={styles.walletItem}>
          <Text style={styles.walletLabel}>
            Ví <Text style={styles.smartSpendLabel}>SmartSp...</Text>
          </Text>
          <View style={styles.walletBalanceRow}>
            <Text style={styles.walletBalance}>{isBalanceVisible ? "3.671đ" : "***"}</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          </View>
        </View>

        {/* Tiết Kiệm */}
        <View style={styles.walletItem}>
          <Text style={styles.walletLabel}>Ví Tiết Kiệm</Text>
          <View style={styles.walletBalanceRow}>
            <Text style={styles.walletBalance}>{isBalanceVisible ? "0đ" : "***"}</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          </View>
        </View>

        {/* Quỹ */}
        <View style={[styles.walletItem, styles.walletItemNoBorder]}>
          <Text style={styles.walletLabel}>Quỹ</Text>
          <View style={styles.walletBalanceRow}>
            <Text style={styles.walletBalance}>{isBalanceVisible ? "210đ" : "***"}</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          </View>
        </View>
      </View>

      {/* Financial Center Button */}
      <TouchableOpacity style={styles.financialCenterBtn} activeOpacity={0.7}>
        <View style={styles.financialCenterLeft}>
          <Ionicons name="trending-up-outline" size={20} color="#0284C7" />
          <Text style={styles.financialCenterText}>Trung Tâm Tài Chính của bạn</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#0284C7" />
      </TouchableOpacity>
    </View>
  );
};

export default HomeWalletSummary;
