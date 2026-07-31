import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage, useTheme } from '../../../shared/contexts/ThemeLanguageContext';
import { styles } from '../SettingsScreen.styles';

export const LogoutButton = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useTheme();

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'userAvatarUrl']);
      router.replace('/(auth)/login' as any);
    } catch {
      router.replace('/(auth)/login' as any);
    }
  };

  return (
    <View style={styles.logoutContainer}>
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: theme.card, borderColor: '#FECACA' }]}
        activeOpacity={0.75}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={18} color="#DC2626" />
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>
      <Text style={[styles.versionText, { color: theme.textMuted }]}>SmartSpend · v1.0.0</Text>
    </View>
  );
};

