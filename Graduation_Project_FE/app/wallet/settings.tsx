import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import WalletSettingsScreen from '@/features/wallet/screens/WalletSettingsScreen/WalletSettingsScreen';

export default function WalletSettingsRoute() {
  const { walletId } = useLocalSearchParams();
  return <WalletSettingsScreen walletId={Number(walletId)} />;
}
