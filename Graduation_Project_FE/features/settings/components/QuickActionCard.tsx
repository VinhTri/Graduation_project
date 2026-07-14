import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from '../SettingsScreen.styles';
import Colors from '../../../shared/constants/Colors';

export const QuickActionCard = () => {
  return (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
        <View style={styles.quickActionHeader}>
          <Text style={styles.quickActionTitle}>Quản lý mã</Text>
          <View style={[styles.iconBox, styles.iconBoxGreen]}>
            <Ionicons name="qr-code-outline" size={18} color={Colors.primary} />
          </View>
        </View>
        <Text style={styles.quickActionSubtitle}>Quản lý các mã QR quan trọng của bạn</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
        <View style={styles.quickActionHeader}>
          <Text style={styles.quickActionTitle}>SmartSpend{"\n"}Priority</Text>
          <View style={[styles.iconBox, styles.iconBoxGray]}>
            <MaterialCommunityIcons name="diamond-outline" size={18} color={Colors.textMuted} />
          </View>
        </View>
        <Text style={styles.quickActionSubtitle}>Hội viên Bạc</Text>
      </TouchableOpacity>
    </View>
  );
};
