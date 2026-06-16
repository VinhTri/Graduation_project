import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../SettingsScreen.styles';
import Colors from '../../../shared/constants/Colors';

interface SettingsItemProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  showEye?: boolean;
  hideChevron?: boolean;
  isLast?: boolean;
  onPress?: () => void;
}

export const SettingsItem = ({
  icon,
  title,
  subtitle,
  value,
  showEye,
  hideChevron,
  isLast,
  onPress
}: SettingsItemProps) => {
  return (
    <TouchableOpacity 
      style={[styles.itemContainer, isLast && { borderBottomWidth: 0 }]} 
      activeOpacity={0.7}
      onPress={onPress}
    >
      {icon ? (
        <View style={styles.itemIconContainer}>
          {icon}
        </View>
      ) : (
        <View style={{ width: 16 }} /> // Spacer if no icon to align text slightly, or adjust based on design
      )}
      
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.itemRight}>
        {showEye && (
          <TouchableOpacity style={styles.eyeIcon} activeOpacity={0.7}>
            <Feather name="eye" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
        {value !== undefined && (
          <Text style={styles.itemValue}>{value}</Text>
        )}
        {!hideChevron && (
          <Feather name="chevron-right" size={20} color="#D1D5DB" />
        )}
      </View>
    </TouchableOpacity>
  );
};
