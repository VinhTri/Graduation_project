import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../../../shared/constants/Colors";
import { WalletLinkCardProps } from "./WalletLinkCard.types";
import { styles } from "./WalletLinkCard.styles";

export const WalletLinkCard: React.FC<WalletLinkCardProps> = ({ onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.linkCardBtn} 
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
      <Text style={styles.linkCardText}>Liên kết tài khoản / thẻ mới</Text>
    </TouchableOpacity>
  );
};

export default WalletLinkCard;
