import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, ImageBackground, type ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FUND_HEADER_GRADIENT } from '../../theme';

interface FundHeaderShellProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Ảnh nền header */
  coverImage?: ImageSourcePropType;
  /** dark = màn chi tiết (chữ trắng); light = danh sách quỹ (chữ tím) */
  coverTone?: 'dark' | 'light';
}

export default function FundHeaderShell({
  children,
  style,
  contentStyle,
  coverImage,
  coverTone = 'dark',
}: FundHeaderShellProps) {
  const insets = useSafeAreaInsets();
  const padded = [styles.gradient, { paddingTop: insets.top + 12 }, contentStyle];

  if (coverImage) {
    const overlay =
      coverTone === 'light'
        ? (['rgba(255,248,252,0.42)', 'rgba(255,241,248,0.62)'] as const)
        : (['rgba(15,23,42,0.28)', 'rgba(15,23,42,0.78)'] as const);

    return (
      <View style={[styles.wrap, style]}>
        <ImageBackground
          source={coverImage}
          style={padded}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[...overlay]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          {coverTone === 'light' && (
            <>
              <View style={styles.decorCircleLarge} />
              <View style={styles.decorCircleSmall} />
            </>
          )}
          {children}
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={[...FUND_HEADER_GRADIENT]}
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
    paddingBottom: 22,
  },
  decorCircleLarge: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    top: -30,
    right: -24,
  },
  decorCircleSmall: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    bottom: 12,
    left: 20,
  },
});
