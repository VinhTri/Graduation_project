import React, { useState } from "react";
import { View, LayoutAnimation, Platform, UIManager } from "react-native";
import { WalletData } from "../WalletCard/WalletCard.types";
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

const MOCK_WALLETS: WalletData[] = [
  {
    id: "smartspend",
    name: "Ví SmartSpend",
    type: "smartspend",
    balance: 12450000,
    cardNumber: "•••• •••• •••• 8888",
    color: "#0D9488", // Teal leather
    flapColor: "#0F766E", // Darker Teal
    buttonType: "gold",
  },
  {
    id: "quy",
    name: "Ví quỹ",
    type: "quy",
    balance: 8200000,
    subValue: "Lãi suất tích lũy: 5.5% / năm",
    cardNumber: "•••• •••• •••• 9999",
    color: "#3F51B5", // Royal Blue/Indigo leather
    flapColor: "#303F9F", // Darker Indigo
    buttonType: "silver",
  },
  {
    id: "thantai",
    name: "Ví thần tài",
    type: "thantai",
    balance: 5000000,
    subValue: "Tỷ suất sinh lời: 6.0% / năm",
    cardNumber: "•••• •••• •••• 7777",
    color: "#F59E0B", // Golden Orange leather
    flapColor: "#D97706", // Darker Orange
    buttonType: "coin",
  },
];

export const WalletList: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>("smartspend");

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
        {MOCK_WALLETS.map((wallet, index) => {
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
