export interface WalletData {
  id: string;
  name: string;
  type: "smartspend" | "quy" | "thantai" | "trasau";
  balance: number;
  subValue?: string; // limit or yield rate
  cardNumber?: string;
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
