import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../../../shared/constants/Colors";
import { NotebookHeaderProps } from "./NotebookHeader.types";
import { styles } from "./NotebookHeader.styles";

export const NotebookHeader: React.FC<NotebookHeaderProps> = ({ 
  totalBalance,
  monthlyIncome = 0,
  monthlyExpense = 0
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  const formatCurrency = (val: number) => {
    if (isBalanceHidden) return "•••••• ₫";
    return val.toLocaleString("vi-VN") + " ₫";
  };

  return (
    <View style={styles.container}>
      {/* Background Header */}
      <View style={[styles.headerBackground, { paddingTop: insets.top + 10 }]}>
        {/* Decorative elements */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        {/* Top Greeting Bar */}
        <View style={styles.greetingBar}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/home')} style={styles.backButton}>
            <Ionicons name="chevron-back-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
          <View>
            <Text style={styles.greetingText}>Sổ tay</Text>
            <Text style={styles.subGreetingText}>Ghi chép quản lý thu chi đa tài khoản</Text>
          </View>
        </View>

        {/* Main Balance */}
        <View style={styles.balanceSection}>
          <View style={styles.balanceHeader}>
            <Text style={styles.totalBalanceLabel}>TỔNG TÀI SẢN</Text>
            <TouchableOpacity 
              onPress={() => setIsBalanceHidden(!isBalanceHidden)}
              style={styles.eyeButton}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isBalanceHidden ? "eye-off" : "eye"} 
                size={16} 
                color="rgba(255,255,255,0.8)" 
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.totalBalanceValue}>{formatCurrency(totalBalance)}</Text>
          
          <View style={styles.badgeContainer}>
            <Ionicons name="trending-up" size={14} color={Colors.white} />
            <Text style={styles.badgeText}>+2.5% so với tháng trước</Text>
          </View>
        </View>
      </View>

      {/* Overlapping Modern Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statGroup}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Ionicons name="arrow-down" size={20} color="#10B981" />
          </View>
          <View style={styles.statTextGroup}>
            <Text style={styles.statLabel}>Thu nhập</Text>
            <Text style={styles.statValueIncome}>{formatCurrency(monthlyIncome)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statGroup}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="arrow-up" size={20} color="#EF4444" />
          </View>
          <View style={styles.statTextGroup}>
            <Text style={styles.statLabel}>Chi tiêu</Text>
            <Text style={styles.statValueExpense}>{formatCurrency(monthlyExpense)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default NotebookHeader;
