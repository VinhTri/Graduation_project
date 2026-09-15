import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';
import { PASTEL_PALETTE } from '../../constants/PastelPalette';

function getInitials(name: string) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  borderWidth?: number;
}

export default function UserAvatar({
  name,
  avatarUrl,
  size = 52,
  borderWidth = 0,
}: UserAvatarProps) {
  const customUri = resolveMediaUrl(avatarUrl);
  const radius = Math.round(size * 0.31);
  const initials = getInitials(name);

  if (customUri) {
    return (
      <Image
        source={{ uri: customUri }}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          borderWidth,
          borderColor: PASTEL_PALETTE.border,
          backgroundColor: PASTEL_PALETTE.accentDeep,
        }}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: PASTEL_PALETTE.accentDeep,
          borderWidth,
          borderColor: PASTEL_PALETTE.border,
        },
      ]}
    >
      <Text style={[styles.fallbackText, { fontSize: size * 0.34 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fallbackText: {
    color: PASTEL_PALETTE.white,
    fontWeight: '800',
  },
});
