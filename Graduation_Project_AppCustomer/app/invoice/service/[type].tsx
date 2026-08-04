import { useLocalSearchParams } from 'expo-router';
import { ServiceLookupScreen } from '../../../features/invoice/screens/ServiceLookupScreen/ServiceLookupScreen';
import { ElectricityInvoiceScreen } from '../../../features/invoice/screens/ElectricityInvoiceScreen/ElectricityInvoiceScreen';
import { WaterInvoiceScreen } from '../../../features/invoice/screens/WaterInvoiceScreen/WaterInvoiceScreen';

export default function ServiceLookupRoute() {
  const { type } = useLocalSearchParams<{ type: string }>();

  if (type === 'electricity') {
    return <ElectricityInvoiceScreen />;
  }

  if (type === 'water') {
    return <WaterInvoiceScreen />;
  }

  return <ServiceLookupScreen />;
}

