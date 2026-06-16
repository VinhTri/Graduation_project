import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../SettingsScreen.styles';
import Colors from '../../../shared/constants/Colors';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      // Chúng ta không xóa hasSeenOnboarding để lần sau đăng nhập không hiện lại onboarding
      router.replace('/(auth)/login');
    } catch (error) {
      console.log('Error logging out:', error);
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.logoutContainer}>
      <TouchableOpacity 
        style={styles.logoutButton} 
        activeOpacity={0.7}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
};
