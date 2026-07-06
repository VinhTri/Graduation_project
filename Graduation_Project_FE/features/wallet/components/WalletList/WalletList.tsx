import React, { useState, useCallback } from "react";
import { View, LayoutAnimation, Platform, UIManager } from "react-native";
import { useFocusEffect } from "expo-router";
import { WalletData as LocalWalletData } from "../WalletCard/WalletCard.types";
import { walletService } from "../../../../shared/api/services/walletService";
import WalletCard from "../WalletCard/WalletCard";
import { styles } from "./WalletList.styles";
import Colors from "../../../../shared/constants/Colors";


if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const INITIAL_WALLET: LocalWalletData = {
  id: "smartspend",
  name: "Ví SmartSpend",
  type: "smartspend",
  balance: 0,
  cardNumber: "•••• •••• •••• 8888",
  color: "#0D9488", // Teal leather
  flapColor: "#0F766E", // Darker Teal
  buttonType: "gold",
};

export const WalletList: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>("smartspend");
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
              balance: data.balance,
              name: data.name
            }]);
            setExpandedId((prev) => (prev === "smartspend" || prev === null) ? stringId : prev);
          }
        } catch (error) {
          console.log("Error fetching wallet", error);
        }
      };
      fetchWallet();
    }, [])
  );

  const handlePressWallet = (id: string) => {
    LayoutAnimation.configureNext({
      duration: 350,
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.78,
      },
    });
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
          let marginTop = 0;
          if (index > 0) {
            marginTop = -95;
          }

          return (
            <View
              key={wallet.id}
              style={{
                zIndex,
                marginTop,
                position: "relative",
                backgroundColor: Colors.background,
                borderRadius: 24,
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
