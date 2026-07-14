import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { styles } from "./PendingTransactionCard.styles";
import { TopUpResponse } from "@/shared/api/services/transactionService";

interface Props {
  transaction: TopUpResponse | null;
  onDismiss: () => void;
}

export const PendingTransactionCard = ({ transaction, onDismiss }: Props) => {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!transaction?.expiresAt) return;

    const calculateTimeLeft = () => {
      const expires = new Date(transaction.expiresAt).getTime();
      const now = new Date().getTime();
      return Math.max(0, Math.floor((expires - now) / 1000));
    };

    const initialTimeLeft = calculateTimeLeft();
    if (initialTimeLeft <= 0) {
      onDismiss();
      return;
    }

    setTimeLeft(initialTimeLeft);

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      if (remaining <= 0) {
        clearInterval(timer);
        onDismiss();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [transaction, onDismiss]);

  if (!transaction) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handlePress = () => {
    router.push({
      pathname: "/wallet/checkout",
      params: { 
        amount: transaction.amount.toString(), 
        note: "",
        category: "Nạp tiền vào ví",
        categoryIcon: "wallet-outline",
        categoryColor: "#0EA5E9",
        categoryBgColor: "#E0F2FE",
        transactionCode: transaction.transactionCode,
        qrUrl: transaction.qrUrl,
        expiresAt: transaction.expiresAt,
        createdAt: transaction.createdAt
      }
    });
  };

  return (
    <View style={[styles.container, { flexDirection: "column", alignItems: "stretch" }]}>
      <TouchableOpacity 
        style={{ flexDirection: "row", alignItems: "flex-start" }}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="time-outline" size={24} color="#EAB308" />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Giao dịch chờ xử lý</Text>
          <Text style={styles.message}>
            Bạn có 1 giao dịch nạp tiền {transaction.amount.toLocaleString("vi-VN")}đ chưa hoàn tất. Chạm vào đây để tiếp tục thanh toán.
          </Text>
        </View>
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color="#A16207" />
        </View>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        <Text style={styles.timerText}>
          Hết hạn sau: {formatTime(timeLeft)}
        </Text>
        <TouchableOpacity style={styles.cancelButton} onPress={onDismiss}>
          <Text style={styles.cancelButtonText}>Hủy giao dịch</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PendingTransactionCard;
