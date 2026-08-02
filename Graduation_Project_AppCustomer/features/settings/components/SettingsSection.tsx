import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../shared/contexts/ThemeLanguageContext';
import { styles } from '../SettingsScreen.styles';

interface SettingsSectionProps {
  title: string;
  rightLink?: string;
  children: ReactNode;
}

export const SettingsSection = ({ title, rightLink, children }: SettingsSectionProps) => {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{title}</Text>
        {rightLink && (
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={[styles.sectionLink, { color: theme.primary }]}>{rightLink}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={[styles.sectionBody, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        {children}
      </View>
    </View>
  );
};

