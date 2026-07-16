import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { SMARTSPEND_ICON } from '../../assets/brandAssets';

interface SmartSpendIconProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
  borderRadius?: number;
}

export function SmartSpendIcon({ size = 44, style, borderRadius }: SmartSpendIconProps) {
  const radius = borderRadius ?? Math.round(size * 0.26);

  return (
    <Image
      source={SMARTSPEND_ICON}
      style={[{ width: size, height: size, borderRadius: radius }, style]}
      resizeMode="cover"
      fadeDuration={0}
    />
  );
}

export default SmartSpendIcon;
