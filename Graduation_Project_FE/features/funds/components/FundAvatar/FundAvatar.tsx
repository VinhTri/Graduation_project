import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { getInitials } from '../../utils';
import { pickFundGradient } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';

interface FundAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: number;
  seed?: number;
}

export default function FundAvatar({ name, avatarUrl, size = 40, seed = 0 }: FundAvatarProps) {
  const gradient = pickFundGradient(seed + name.length);
  const radius = size / 2;

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, { width: size, height: size, borderRadius: radius }]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{getInitials(name)}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
