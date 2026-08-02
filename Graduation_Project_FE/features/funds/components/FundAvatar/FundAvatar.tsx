import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { getInitials } from '../../utils';
import { pickFundGradient } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { resolveMediaUrl } from '../../../../shared/utils/resolveMediaUrl';

interface FundAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: number;
  seed?: number;
}

export default function FundAvatar({ name, avatarUrl, size = 40, seed = 0 }: FundAvatarProps) {
  const gradient = pickFundGradient(seed + name.length);
  const radius = size / 2;
  const uri = resolveMediaUrl(avatarUrl);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [uri]);

  if (uri && !hasError) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: '#F3F4F6' }}
        contentFit="cover"
        onError={() => setHasError(true)}
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
