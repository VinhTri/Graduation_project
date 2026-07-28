import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Image } from "react-native";
import { SmartSpendIcon } from "../../../../shared/components/SmartSpendIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { PASTEL_PALETTE } from "../../../../shared/constants/PastelPalette";
import { PastelHeaderShell } from "../../../../shared/components/PastelHeaderShell";
import { styles } from "./TopUpCheckoutScreen.styles";
import { walletService } from "../../../../shared/api/services/walletService";
import { transactionService } from "../../../../shared/api/services/transactionService";

type TopUpQrCache = {
  transferContent: string;
  qrUrl: string;
};

let topUpQrCache: TopUpQrCache | null = null;

export default function TopUpCheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(!topUpQrCache);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transferContent, setTransferContent] = useState(topUpQrCache?.transferContent ?? "");
  const [qrUrl, setQrUrl] = useState(topUpQrCache?.qrUrl ?? "");

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      if (topUpQrCache) {
        setTransferContent(topUpQrCache.transferContent);
        setQrUrl(topUpQrCache.qrUrl);
        setLoading(false);
        setErrorMsg(null);
      } else {
        setLoading(true);
        setErrorMsg(null);
        (async () => {
          try {
            const res = await transactionService.initiateTopUp({});
            if (cancelled) return;
            topUpQrCache = {
              transferContent: res.transferContent,
              qrUrl: res.qrUrl,
            };
            setTransferContent(res.transferContent);
            setQrUrl(res.qrUrl);
          } catch (error: any) {
            if (cancelled) return;
            setErrorMsg(
              error?.response?.data?.message || "Không tạo được mã QR nạp tiền, vui lòng thử lại."
            );
          } finally {
            if (!cancelled) setLoading(false);
          }
        })();
      }

      return () => {
        cancelled = true;
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      let initialBalance: number | null = null;
      let cancelled = false;

      const pollTimer = setInterval(async () => {
        try {
          const wallet = await walletService.getMyWallet();
          if (cancelled) return;
          if (initialBalance === null) {
            initialBalance = wallet.balance;
            return;
          }
          if (wallet.balance > initialBalance) {
            clearInterval(pollTimer);
            topUpQrCache = null;
            router.replace('/(tabs)/home');
          }
        } catch (error) {
          console.log("Polling error:", error);
        }
      }, 3000);

      return () => {
        cancelled = true;
        clearInterval(pollTimer);
      };
    }, [router])
  );

  const qrImageUri =
    qrUrl ||
    "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" +
      encodeURIComponent(transferContent);

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <PastelHeaderShell contentStyle={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="chevron-back-outline" size={22} color={PASTEL_PALETTE.subtitle} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            Nạp tiền vào ví
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </PastelHeaderShell>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={PASTEL_PALETTE.accent} />
            <Text style={styles.stateText}>Đang tạo mã QR...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.stateBox}>
            <Ionicons name="alert-circle-outline" size={48} color={PASTEL_PALETTE.lavender} />
            <Text style={styles.stateText}>{errorMsg}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleBack} activeOpacity={0.8}>
              <Text style={styles.retryButtonText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardContainer}>
            {/* Brand */}
            <View style={styles.brandContainer}>
              <SmartSpendIcon size={36} style={styles.brandLogo} borderRadius={10} />
              <Text style={styles.brandName}>
                <Text style={styles.brandSmart}>Smart</Text>
                <Text style={styles.brandSpend}>Spend</Text>
              </Text>
            </View>

            {/* QR */}
            <View style={styles.qrWrapper}>
              <Image source={{ uri: qrImageUri }} style={styles.qrImage} resizeMode="contain" />
            </View>

            {/* Transfer content highlight */}
            <View style={styles.transferBox}>
              <Text style={styles.transferLabel}>NỘI DUNG CHUYỂN KHOẢN</Text>
              <Text style={styles.transferValue}>{transferContent}</Text>
            </View>

            {/* Hint badge */}
            <View style={styles.hintBadge}>
              <View style={styles.hintIconContainer}>
                <Ionicons name="shield-checkmark" size={18} color={PASTEL_PALETTE.accentDeep} />
              </View>
              <Text style={styles.hintText}>
                Tiền được cộng tự động vào ví ngay khi chuyển khoản thành công.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
