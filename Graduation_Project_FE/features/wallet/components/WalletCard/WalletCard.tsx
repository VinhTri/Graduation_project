import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { WalletCardProps } from "./WalletCard.types";
import { styles } from "./WalletCard.styles";
import Colors from "../../../../shared/constants/Colors";

export const WalletCard: React.FC<WalletCardProps> = ({
  wallet,
  isExpanded,
  onPress,
  stackIndex,
}) => {
  const router = useRouter();

  const formatCurrency = (val: number) => {
    return val.toLocaleString("vi-VN") + " ₫";
  };

  // Determine snap button color
  const getSnapButtonStyles = () => {
    switch (wallet.buttonType) {
      case "gold":
        return {
          backgroundColor: "#F59E0B",
          borderColor: "#D97706",
          borderWidth: 2,
        };
      case "silver":
        return {
          backgroundColor: "#CBD5E1",
          borderColor: "#94A3B8",
          borderWidth: 2,
        };
      case "coin":
        return {
          backgroundColor: "#FBBF24",
          borderColor: "#F59E0B",
          borderWidth: 2,
        };
      default:
        return {
          backgroundColor: "#CBD5E1",
          borderColor: "#94A3B8",
          borderWidth: 2,
        };
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* Main Leather Wallet Body */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        style={[
          styles.walletBody,
          { 
            backgroundColor: wallet.color,
          }
        ]}
      >
        {/* Dashed Stitching Border */}
        <View style={styles.walletStitchBorder} />

        {/* Pocket slit representing physical opening */}
        <View style={styles.walletSlit} />

        {/* Physical Wallet Folding Flap */}
        <View style={[styles.walletFlap, { backgroundColor: wallet.flapColor }]}>
          <View style={styles.walletFlapStitch} />
          
          {/* Metallic Snap Button */}
          <View style={[styles.snapButton, getSnapButtonStyles()]}>
            <View style={styles.snapButtonInner}>
              <View style={styles.snapDot} />
            </View>
          </View>
        </View>

        {/* Wallet Information */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.walletName}>{wallet.name}</Text>
            {wallet.cardNumber && (
              <Text style={styles.cardNumber}>{wallet.cardNumber}</Text>
            )}
            {wallet.type === "smartspend" && (
              <View style={styles.goldFoilBadge}>
                <Text style={styles.goldFoilText}>PLATINUM MEMBER</Text>
              </View>
            )}
            {wallet.type === "quy" && (
              <View style={[styles.goldFoilBadge, { backgroundColor: "rgba(255, 255, 255, 0.15)", borderColor: "rgba(255, 255, 255, 0.3)" }]}>
                <Text style={[styles.goldFoilText, { color: Colors.white }]}>FUND ACCOUNT</Text>
              </View>
            )}
            {wallet.type === "thantai" && (
              <View style={[styles.goldFoilBadge, { backgroundColor: "rgba(255, 215, 0, 0.15)", borderColor: "rgba(255, 215, 0, 0.5)" }]}>
                <Text style={[styles.goldFoilText, { color: "#FBBF24" }]}>DOUBLE INTEREST</Text>
              </View>
            )}
          </View>
          <Ionicons 
            name={
              wallet.type === "thantai" 
                ? "gift-outline" 
                : wallet.type === "quy" 
                ? "save-outline" 
                : "wallet-outline"
            } 
            size={22} 
            color="rgba(255,255,255,0.7)" 
          />
        </View>

        {/* Balance details */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(wallet.balance)}
          </Text>
          {wallet.subValue && (
            <Text style={styles.subValue}>{wallet.subValue}</Text>
          )}
        </View>

        {/* Expanded Actions Tray (Nạp, Rút, Lịch sử, Cài đặt) */}
        {isExpanded && (
          <View style={styles.actionsTray}>
            <TouchableOpacity 
              style={styles.actionButton} 
              activeOpacity={0.7}
              onPress={() => router.push("/wallet/topup")}
            >
              <View style={styles.actionIconBg}>
                <Ionicons name="arrow-down-outline" size={18} color={wallet.color} />
              </View>
              <Text style={styles.actionLabel}>Nạp tiền</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton} 
              activeOpacity={0.7}
              onPress={() => router.push("/wallet/withdraw")}
            >
              <View style={styles.actionIconBg}>
                <Ionicons name="arrow-up-outline" size={18} color={wallet.color} />
              </View>
              <Text style={styles.actionLabel}>Rút tiền</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton} 
              activeOpacity={0.7}
              onPress={() => router.push("/wallet/history")}
            >
              <View style={styles.actionIconBg}>
                <Ionicons name="time-outline" size={18} color={wallet.color} />
              </View>
              <Text style={styles.actionLabel}>Lịch sử</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton} 
              activeOpacity={0.7}
              onPress={() => router.push("/wallet/report" as any)}
            >
              <View style={styles.actionIconBg}>
                <Ionicons name="pie-chart-outline" size={18} color={wallet.color} />
              </View>
              <Text style={styles.actionLabel}>Báo cáo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
              <View style={styles.actionIconBg}>
                <Ionicons name="settings-outline" size={18} color={wallet.color} />
              </View>
              <Text style={styles.actionLabel}>Cài đặt</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default WalletCard;
