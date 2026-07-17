import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { getUserAvatarUrl } from '../../utils/userAvatar';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';

const AVATAR_PALETTES = [
  { bg: '#FFE4EC', text: '#DB2777', border: '#FBCFE8' },
  { bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE' },
  { bg: '#FFEDD5', text: '#EA580C', border: '#FED7AA' },
  { bg: '#DBEAFE', text: '#2563EB', border: '#BFDBFE' },
  { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' },
];

const getFallbackPalette = (name: string) => {
  const code = name ? name.charCodeAt(0) : 0;
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length];
};

interface UserAvatarProps {
  name: string;
  email?: string;
  avatarUrl?: string | null;
  size?: number;
  borderWidth?: number;
}

export default function UserAvatar({
  name,
  email,
  avatarUrl,
  size = 52,
  borderWidth = 2,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const seed = email || name || 'user';
  const customUri = useMemo(() => resolveMediaUrl(avatarUrl), [avatarUrl]);
  const diceUri = useMemo(() => getUserAvatarUrl(seed, size * 2), [seed, size]);
  const uri = customUri || diceUri;
  const palette = getFallbackPalette(name);
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const radius = size >= 64 ? size * 0.28 : size * 0.34;

  useEffect(() => {
    setHasError(false);
  }, [uri]);

  if (hasError) {
    return (
      <View
        style={[
          styles.fallback,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: palette.bg,
            borderColor: palette.border,
            borderWidth,
          },
        ]}
      >
        <Text style={[styles.fallbackText, { color: palette.text, fontSize: size * 0.38 }]}>
          {initial}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[
        styles.image,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderColor: palette.border,
          borderWidth,
        },
      ]}
      contentFit="cover"
      transition={200}
      onError={() => setHasError(true)}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#F9FAFB',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontWeight: '800',
  },
});
