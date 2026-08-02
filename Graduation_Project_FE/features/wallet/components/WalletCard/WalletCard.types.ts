export interface WalletData {
  id: string;
  numericId?: number;
  name: string;
  type: "smartspend" | "quy" | "thantai" | "trasau";
  balance: number;
  subValue?: string; // limit or yield rate
  cardNumber?: string;
  isLimitEnabled?: boolean;
  dailyLimit?: number;
  transactionLimit?: number;
  color: string;
  flapColor: string;
  buttonType: "gold" | "silver" | "coin";
}

export interface WalletCardProps {
  wallet: WalletData;
  isExpanded: boolean;
  onPress: () => void;
  stackIndex: number;
}
