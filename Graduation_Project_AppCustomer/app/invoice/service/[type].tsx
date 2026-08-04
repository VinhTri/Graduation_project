import { useLocalSearchParams } from 'expo-router';
import { ServiceLookupScreen } from '../../../features/invoice/screens/ServiceLookupScreen/ServiceLookupScreen';
import { ElectricityInvoiceScreen } from '../../../features/invoice/screens/ElectricityInvoiceScreen/ElectricityInvoiceScreen';

export default function ServiceLookupRoute() {
  const { type } = useLocalSearchParams<{ type: string }>();

  if (type === 'electricity') {
    return <ElectricityInvoiceScreen />;
  }

  return <ServiceLookupScreen />;
}

