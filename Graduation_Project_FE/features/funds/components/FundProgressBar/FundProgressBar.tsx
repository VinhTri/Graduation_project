import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { FUND_PALETTE } from '../../theme';

interface FundProgressBarProps {
  progress: number; // 0 - 1
  height?: number;
  trackColor?: string;
  fillColor?: string;
}

export default function FundProgressBar({
  progress,
  height = 8,
  trackColor = 'rgba(255,255,255,0.3)',
  fillColor = '#FFFFFF',
}: FundProgressBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: clamped,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [clamped, widthAnim]);

  const widthInterpolate = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { height, backgroundColor: trackColor, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.fill,
          { width: widthInterpolate, backgroundColor: fillColor, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});

export { FUND_PALETTE };
