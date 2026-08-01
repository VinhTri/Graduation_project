import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { BankWalletDetailScreen } from '../../features/notebook/screens/BankWalletDetailScreen/BankWalletDetailScreen';

export default function BankNotebookPage() {
  const { id } = useLocalSearchParams();
  return <BankWalletDetailScreen walletId={Number(id)} />;
}
