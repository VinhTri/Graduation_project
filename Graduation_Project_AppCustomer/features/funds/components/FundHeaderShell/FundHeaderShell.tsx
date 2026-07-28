import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FUND_HEADER_GRADIENT } from '../../theme';

interface FundHeaderShellProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export default function FundHeaderShell({
  children,
  style,
  contentStyle,
}: FundHeaderShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={[...FUND_HEADER_GRADIENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { paddingTop: insets.top + 12 }, contentStyle]}
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
