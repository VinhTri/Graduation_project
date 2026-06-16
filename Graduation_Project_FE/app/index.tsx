import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<any>(null);

  useEffect(() => {
    const checkState = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        
        if (token) {
          // Nếu đã có token (đã đăng nhập), vào thẳng Home.
          // Đảm bảo đánh dấu đã xem onboarding để sau này đăng xuất không bị lặp lại
          if (!hasSeenOnboarding) {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
          }
          setInitialRoute('/(tabs)/home');
        } else {
          // Nếu chưa có token, kiểm tra xem đã từng đăng nhập thành công chưa
          if (hasSeenOnboarding) {
            setInitialRoute('/(auth)/login');
          } else {
            setInitialRoute('/(auth)/onboarding');
          }
        }
      } catch (error) {
        setInitialRoute('/(auth)/onboarding');
      } finally {
        setIsReady(true);
      }
    };
    checkState();
  }, []);

  if (!isReady || !initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#109185" />
      </View>
    );
  }

  return <Redirect href={initialRoute} />;
}
