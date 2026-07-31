import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import WalletSettingsScreen from '@/features/wallet/screens/WalletSettingsScreen/WalletSettingsScreen';

export default function WalletSettingsRoute() {
  const { walletId } = useLocalSearchParams<{ walletId?: string | string[] }>();
  const walletIdParam = Array.isArray(walletId) ? walletId[0] : walletId;
  const parsedWalletId = walletIdParam ? Number(walletIdParam) : NaN;

  return <WalletSettingsScreen walletId={parsedWalletId} />;
}
