import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { SMARTSPEND_FUND_ICON } from '../../assets/brandAssets';

interface FundIconProps {
  size?: number;
  color?: string;
  style?: StyleProp<ImageStyle>;
  borderRadius?: number;
}

export function FundIcon({ size = 44, style, borderRadius }: FundIconProps) {
  const radius = borderRadius ?? Math.round(size * 0.26);

  return (
    <Image
      source={SMARTSPEND_FUND_ICON}
      style={[{ width: size, height: size, borderRadius: radius }, style]}
      resizeMode="cover"
      fadeDuration={0}
    />
  );
}

export default FundIcon;
