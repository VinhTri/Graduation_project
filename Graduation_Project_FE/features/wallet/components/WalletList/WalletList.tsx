import React, { useState, useCallback } from "react";
import { View, LayoutAnimation, Platform, UIManager } from "react-native";
import { useFocusEffect } from "expo-router";
import { WalletData as LocalWalletData } from "../WalletCard/WalletCard.types";
import { walletService } from "../../../../shared/api/services/walletService";
import WalletCard from "../WalletCard/WalletCard";
import { styles } from "./WalletList.styles";
import Colors from "../../../../shared/constants/Colors";

// Enable LayoutAnimation for Android
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
            setWallets([{
              ...INITIAL_WALLET,
              balance: data.balance,
              name: data.name
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
    LayoutAnimation.configureNext({
      duration: 350,
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.78, // Smooth physical slide rebound without any opacity flashing
      },
    });
    if (expandedId === id) {
      // Toggle off
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
          
          // Calculate zIndex: base zIndex increases as we go down the stack
          // so that Wallet 3 overlaps Wallet 2, and Wallet 2 overlaps Wallet 1.
          // If a wallet is expanded, we give it zIndex 10 so it floats above all others.
          const zIndex = isExpanded ? 10 : index + 1;

          // Overlap calculation:
          // We always stack them tightly by overlapping them by -95px
          // to keep the realistic pocket-nested wallet stack design.
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
                backgroundColor: Colors.background, // Match system background color
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
