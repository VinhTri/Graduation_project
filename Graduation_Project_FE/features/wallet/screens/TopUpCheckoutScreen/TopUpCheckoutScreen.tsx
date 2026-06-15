import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import Colors from "../../../../../shared/constants/Colors";
import { styles } from "./TopUpCheckoutScreen.styles";

const { width } = Dimensions.get("window");
const TRIANGLE_SIZE = 16;
const NUM_TRIANGLES = Math.floor((width - 48) / TRIANGLE_SIZE);

const SawtoothTop = () => {
  return (
    <View style={styles.sawtoothContainer}>
      {Array.from({ length: NUM_TRIANGLES }).map((_, i) => (
        <View key={`top-${i}`} style={styles.triangleUp} />
      ))}
    </View>
  );
};

const SawtoothBottom = () => {
  return (
    <View style={styles.sawtoothContainer}>
      {Array.from({ length: NUM_TRIANGLES }).map((_, i) => (
        <View key={`bottom-${i}`} style={styles.triangleDown} />
      ))}
    </View>
  );
};

export default function TopUpCheckoutScreen() {
  const router = useRouter();
  const { amount } = useLocalSearchParams();
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCurrency = (val: string | string[]) => {
    if (!val) return "0 ₫";
    const num = parseInt(val as string, 10);
    return num.toLocaleString("vi-VN") + " ₫";
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Generate a dummy transaction ID
  const txId = "TX" + Math.floor(Math.random() * 1000000000).toString();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán Hóa đơn</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Bill Paper Container */}
        <View style={styles.billContainer}>
          <SawtoothTop />
          
          <View style={styles.billBody}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>S</Text>
            </View>
            <Text style={styles.brandName}>SmartSpend Pay</Text>
            <Text style={styles.billType}>Hóa đơn nạp tiền</Text>

            {/* Amount */}
            <Text style={styles.amountLabel}>Số tiền cần thanh toán</Text>
            <Text style={styles.amountValue}>{formatCurrency(amount || "0")}</Text>

            {/* Dashed Separator */}
            <View style={styles.dashedLine} />

            {/* Transaction Info */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mã giao dịch</Text>
              <Text style={styles.infoValue}>{txId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Thời gian tạo</Text>
              <Text style={styles.infoValue}>{new Date().toLocaleTimeString("vi-VN")}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hết hạn sau</Text>
              <Text style={[styles.infoValue, { color: Colors.error }]}>{formatTime(timeLeft)}</Text>
            </View>

            {/* Dashed Separator */}
            <View style={styles.dashedLine} />

            {/* QR Section */}
            <View style={styles.qrContainer}>
              <View style={styles.qrWrapper}>
                <Image 
                  source={{ uri: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + txId }}
                  style={styles.qrImage}
                />
              </View>
              <Text style={styles.instructionText}>
                Sử dụng ứng dụng Ngân hàng hoặc Ví điện tử để quét mã QR phía trên.
              </Text>
            </View>

          </View>
          
          <SawtoothBottom />
        </View>

        {/* Cancel Button */}
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Hủy giao dịch</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
