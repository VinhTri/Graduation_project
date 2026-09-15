import { TransferScreen } from '../../features/transfer';
import { useLocalSearchParams } from 'expo-router';

export default function TransferRoute() {
  const { scan } = useLocalSearchParams<{ scan?: string }>();

  return <TransferScreen autoOpenScanner={scan === '1'} />;
}
