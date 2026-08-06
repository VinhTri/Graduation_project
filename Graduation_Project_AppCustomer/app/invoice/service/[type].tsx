import { useLocalSearchParams } from 'expo-router';
import { ServiceLookupScreen } from '../../../features/invoice/screens/ServiceLookupScreen/ServiceLookupScreen';
import { ElectricityInvoiceScreen } from '../../../features/invoice/screens/ElectricityInvoiceScreen/ElectricityInvoiceScreen';
import { WaterInvoiceScreen } from '../../../features/invoice/screens/WaterInvoiceScreen/WaterInvoiceScreen';
import { InternetInvoiceScreen } from '../../../features/invoice/screens/InternetInvoiceScreen/InternetInvoiceScreen';
import { RentInvoiceScreen } from '../../../features/invoice/screens/RentInvoiceScreen/RentInvoiceScreen';

export default function ServiceLookupRoute() {
  const { type } = useLocalSearchParams<{ type: string }>();

  if (type === 'electricity') {
    return <ElectricityInvoiceScreen />;
  }

  if (type === 'water') {
    return <WaterInvoiceScreen />;
  }

  if (type === 'internet') {
    return <InternetInvoiceScreen />;
  }

  if (type === 'rent') {
    return <RentInvoiceScreen />;
  }

  return <ServiceLookupScreen />;
}

