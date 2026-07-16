import React, { useState, useCallback } from "react";
import { View, LayoutAnimation, Platform, UIManager } from "react-native";
import { useFocusEffect } from "expo-router";
import { WalletData as LocalWalletData } from "../WalletCard/WalletCard.types";
import { walletService } from "../../../../shared/api/services/walletService";
import WalletCard from "../WalletCard/WalletCard";
import { styles } from "./WalletList.styles";
import { PASTEL_PALETTE } from "../../../../shared/constants/PastelPalette";


if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const INITIAL_WALLET: LocalWalletData = {
  id: "smartspend",
  name: "SmartSpend",
  type: "smartspend",
  balance: 0,
  cardNumber: "",
  color: PASTEL_PALETTE.accentDeep,
  flapColor: PASTEL_PALETTE.accent,
  buttonType: "gold" as const,
};

export const WalletList: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [wallets, setWallets] = useState<LocalWalletData[]>([INITIAL_WALLET]);

  useFocusEffect(
    useCallback(() => {
      const fetchWallet = async () => {
        try {
          const data = await walletService.getMyWallet();
          if (data) {
            const stringId = data.id.toString();
            setWallets([{
              ...INITIAL_WALLET,
              id: stringId,
              numericId: data.id,
              balance: data.balance,
              name: data.name,
              cardNumber: data.accountNumber || "Chưa thiết lập STK",
              isLimitEnabled: data.isLimitEnabled,
              dailyLimit: data.dailyLimit,
              transactionLimit: data.transactionLimit,
            }]);
          }
        } catch (error) {
          console.log("Error fetching wallet", error);
        }
      };
      fetchWallet();
    }, [])
  );

  const handlePressWallet = (id: string) => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(320, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.listContainer}>
        {wallets.map((wallet, index) => {
          const isExpanded = expandedId === wallet.id;
          const zIndex = isExpanded ? 10 : index + 1;

          return (
            <View
              key={wallet.id}
              style={{
                zIndex,
                position: "relative",
              }}
            >
              <WalletCard
                wallet={wallet}
                isExpanded={isExpanded}
                onPress={() => handlePressWallet(wallet.id)}
                stackIndex={index}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default WalletList;
