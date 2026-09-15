import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, ImageBackground, type ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PASTEL_PALETTE } from '../../constants/PastelPalette';
import { useTheme } from '../../contexts/ThemeLanguageContext';

interface PastelHeaderShellProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  coverImage?: ImageSourcePropType;
}

export default function PastelHeaderShell({
  children,
  style,
  contentStyle,
  coverImage,
}: PastelHeaderShellProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const padded = [styles.gradient, { paddingTop: insets.top + 12 }, contentStyle];

  if (coverImage) {
    return (
      <View style={[styles.wrap, style]}>
        <ImageBackground
          source={coverImage}
          style={padded}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(255,248,252,0.18)', 'rgba(255,241,248,0.38)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.decorCircleLarge} />
          <View style={styles.decorCircleSmall} />
          {children}
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={[...theme.headerGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={padded}
      >
        <View style={styles.decorCircleLarge} />
        <View style={styles.decorCircleSmall} />
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  gradient: {
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  decorCircleLarge: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    top: -24,
    right: -20,
  },
  decorCircleSmall: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    bottom: 18,
    left: 18,
  },
});

export { PASTEL_PALETTE };
