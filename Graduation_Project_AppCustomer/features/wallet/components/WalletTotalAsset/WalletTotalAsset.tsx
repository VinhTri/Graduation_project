import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useFocusEffect } from "expo-router";
import { walletService } from "../../../../shared/api/services/walletService";
import { axiosClient } from "../../../../shared/api/axiosClient";
import { ENDPOINTS } from "../../../../shared/api/endpoints";
import { Ionicons } from "@expo/vector-icons";
import { WalletTotalAssetProps } from "./WalletTotalAsset.types";
import { styles } from "./WalletTotalAsset.styles";
import { useLanguage } from "../../../../shared/contexts/ThemeLanguageContext";

const getLinkedBankText = (count: number, isEn: boolean) => {
  if (count <= 0) return isEn ? "No bank linked" : "Chưa liên kết ngân hàng";
  if (count === 1) return isEn ? "1 bank account linked" : "1 tài khoản ngân hàng đang liên kết";
  return isEn ? `${count} bank accounts linked` : `${count} tài khoản ngân hàng đang liên kết`;
};

export const WalletTotalAsset: React.FC<WalletTotalAssetProps> = ({
  totalBalance = 0,
}) => {
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [balance, setBalance] = useState(totalBalance);
  const [linkedBankCount, setLinkedBankCount] = useState(0);
  const { t, language } = useLanguage();
  const isEn = language === 'en';

  useFocusEffect(
    useCallback(() => {
      const fetchWalletData = async () => {
        try {
          const [walletData, bankRes] = await Promise.all([
            walletService.getMyWallet(),
            axiosClient.get(ENDPOINTS.BANK_ACCOUNT.GET_ALL),
          ]);
          if (walletData) {
            setBalance(walletData.balance);
          }
          setLinkedBankCount(Array.isArray(bankRes.data) ? bankRes.data.length : 0);
        } catch (error) {
          console.log("Error fetching wallet header data", error);
        }
      };
      fetchWalletData();
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
          <Ionicons name="shield-checkmark-outline" size={14} color="#7C3AED" />
          <Text style={styles.balanceLabel}>{t('availableBalance').toUpperCase()}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setIsBalanceHidden(!isBalanceHidden)} 
          activeOpacity={0.7}
          style={styles.eyeButton}
        >
          <Ionicons 
            name={isBalanceHidden ? "eye-off-outline" : "eye-outline"} 
            size={18} 
            color="#7C3AED" 
          />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.balanceValue}>
        {formatCurrency(balance)}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={styles.statDot} />
          <Text style={styles.statText}>{isEn ? '1 wallet connected' : '1 ví đang kết nối'}</Text>
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statDot, linkedBankCount === 0 && styles.statDotMuted]} />
          <Text style={styles.statText}>{getLinkedBankText(linkedBankCount, isEn)}</Text>
        </View>
      </View>
    </View>
  );
};

export default WalletTotalAsset;

