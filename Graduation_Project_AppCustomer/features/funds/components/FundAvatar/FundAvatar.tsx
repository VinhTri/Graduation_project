import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';

interface FundAvatarProps {
  name: string;
  size?: number;
}

function getInitials(name: string) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function FundAvatar({ name, size = 40 }: FundAvatarProps) {
  const radius = size >= 64 ? 20 : Math.round(size * 0.31);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: PASTEL_PALETTE.accentDeep,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.34 }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  text: {
    color: PASTEL_PALETTE.white,
    fontWeight: '800',
  },
});
