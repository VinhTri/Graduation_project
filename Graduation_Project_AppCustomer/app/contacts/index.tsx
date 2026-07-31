import { Stack } from 'expo-router';
import ContactsScreen from '../../features/contacts/screens/ContactsScreen/ContactsScreen';

export default function ContactsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ContactsScreen />
    </>
  );
}
