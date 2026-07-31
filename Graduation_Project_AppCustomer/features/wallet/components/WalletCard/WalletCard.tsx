import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { SmartSpendIcon } from "../../../../shared/components/SmartSpendIcon";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { WalletCardProps } from "./WalletCard.types";
import { styles } from "./WalletCard.styles";
import { PASTEL_PALETTE, PASTEL_HEADER_GRADIENT } from "../../../../shared/constants/PastelPalette";

import { useLanguage } from "../../../../shared/contexts/ThemeLanguageContext";

type WalletAction = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route?: string;
  kind?: "settings";
};

const getWalletActions = (isEn: boolean): WalletAction[] => [
  {
    id: "topup",
    label: isEn ? "Top Up" : "Nạp tiền",
    icon: "add-circle-outline",
    color: "#059669",
    route: "/wallet/checkout",
  },
  {
    id: "withdraw",
    label: isEn ? "Withdraw" : "Rút tiền",
    icon: "arrow-up-circle-outline",
    color: "#EA580C",
    route: "/wallet/withdraw",
  },
  {
    id: "history",
    label: isEn ? "History" : "Lịch sử",
    icon: "time-outline",
    color: "#7C3AED",
    route: "/wallet/history",
  },
  {
    id: "report",
    label: isEn ? "Report" : "Báo cáo",
    icon: "pie-chart-outline",
    color: "#DB2777",
    route: "/wallet/report",
  },
  {
    id: "settings",
    label: isEn ? "Settings" : "Cài đặt",
    icon: "settings-outline",
    color: "#4F46E5",
    kind: "settings",
  },
];

export const WalletCard: React.FC<WalletCardProps> = ({
  wallet,
  isExpanded,
  onPress,
}) => {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isEn = language === 'en';
  const walletActions = getWalletActions(isEn);

  const expandAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const heightAnim = useRef(new Animated.Value(isExpanded ? 68 : 0)).current;
  const [actionsHeight, setActionsHeight] = useState(68);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(expandAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 320,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(heightAnim, {
        toValue: isExpanded ? actionsHeight : 0,
        duration: 320,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
    ]).start();
  }, [actionsHeight, expandAnim, heightAnim, isExpanded]);

  const formatCurrency = (val: number) => `${val.toLocaleString("vi-VN")} ₫`;

  const handleActionPress = (action: WalletAction) => {
    if (action.kind === "settings") {
      const targetWalletId = wallet.numericId ?? Number(wallet.id);
      if (!targetWalletId || Number.isNaN(targetWalletId)) return;
      router.push({ pathname: "/wallet/settings", params: { walletId: String(targetWalletId) } });
      return;
    }
    if (action.route) {
      router.push(action.route as any);
    }
  };

  const actionsOpacity = expandAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.6, 1],
  });

  const actionsTranslateY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 0],
  });

  const chevronRotate = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const dividerScale = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const renderActionItem = (action: WalletAction, interactive = true) => {
    const content = (
      <>
        <Ionicons name={action.icon} size={22} color={action.color} />
        <Text style={styles.actionLabel} numberOfLines={2} ellipsizeMode="tail">
          {action.label}
        </Text>
      </>
    );

    if (!interactive) {
      return (
        <View key={action.id} style={styles.actionItem}>
          {content}
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={action.id}
        style={styles.actionItem}
        activeOpacity={0.7}
        accessibilityLabel={action.label}
        onPress={() => handleActionPress(action)}
      >
        {content}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={[...PASTEL_HEADER_GRADIENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.walletBody}
      >
        <View style={styles.decorCircle} />

        <TouchableOpacity activeOpacity={0.95} onPress={onPress}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.brandRow}>
                <SmartSpendIcon size={44} style={styles.brandLogo} borderRadius={12} />
                <View style={styles.brandTextWrap}>
                  <Text style={styles.brandTitle}>
                    <Text style={styles.brandSmart}>Smart</Text>
                    <Text style={styles.brandSpend}>Spend</Text>
                  </Text>
                  {wallet.cardNumber ? (
                    <Text style={styles.cardNumber}>{wallet.cardNumber}</Text>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={styles.limitBox}>
              {wallet.isLimitEnabled && (wallet.dailyLimit || wallet.transactionLimit) ? (
                <>
                  {wallet.transactionLimit ? (
                    <View style={styles.limitRow}>
                      <Text style={styles.limitLabel}>{isEn ? 'Per TX' : 'Mỗi GD'}</Text>
                      <Text style={styles.limitValue} numberOfLines={1}>
                        {formatCurrency(wallet.transactionLimit)}
                      </Text>
                    </View>
                  ) : null}
                  {wallet.dailyLimit ? (
                    <View style={[styles.limitRow, wallet.transactionLimit ? styles.limitRowSpacing : null]}>
                      <Text style={styles.limitLabel}>{isEn ? 'Daily Limit' : 'Hạn mức ngày'}</Text>
                      <Text style={styles.limitValue} numberOfLines={1}>
                        {formatCurrency(wallet.dailyLimit)}
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={styles.limitPlaceholder} numberOfLines={2}>
                  {isEn ? 'No limit set' : 'Chưa thiết lập hạn mức'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>{t('availableBalance')}</Text>
            <Text style={styles.balanceValue}>{formatCurrency(wallet.balance)}</Text>
            {wallet.subValue ? <Text style={styles.subValue}>{wallet.subValue}</Text> : null}
          </View>

          <View style={styles.expandHint}>
            <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
              <Ionicons name="chevron-down" size={16} color={PASTEL_PALETTE.subtitle} />
            </Animated.View>
            <Text style={styles.expandHintText}>
              {isExpanded ? (isEn ? "Collapse" : "Thu gọn") : (isEn ? "Tap to open actions" : "Chạm để mở thao tác")}
            </Text>
          </View>
        </TouchableOpacity>

        <Animated.View
          style={{
            height: heightAnim,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              opacity: actionsOpacity,
              transform: [{ translateY: actionsTranslateY }],
            }}
          >
            <Animated.View
              style={[
                styles.actionsDivider,
                { transform: [{ scaleX: dividerScale }] },
              ]}
            />
            <View style={styles.actionsSection}>
              <View style={styles.actionsRow}>
                {walletActions.map((action) => renderActionItem(action))}
              </View>
            </View>
          </Animated.View>
        </Animated.View>

        <View
          pointerEvents="none"
          style={styles.measureWrap}
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            if (nextHeight > 0 && Math.abs(nextHeight - actionsHeight) > 1) {
              setActionsHeight(nextHeight);
            }
          }}
        >
          <View style={styles.actionsDivider} />
          <View style={styles.actionsSection}>
            <View style={styles.actionsRow}>
              {walletActions.map((action) => renderActionItem(action, false))}
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default WalletCard;
