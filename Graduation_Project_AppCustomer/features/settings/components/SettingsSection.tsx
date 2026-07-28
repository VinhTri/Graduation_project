import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../SettingsScreen.styles';

interface SettingsSectionProps {
  title: string;
  rightLink?: string;
  children: ReactNode;
}

export const SettingsSection = ({ title, rightLink, children }: SettingsSectionProps) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {rightLink && (
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.sectionLink}>{rightLink}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.sectionBody}>
        {children}
      </View>
    </View>
  );
};
