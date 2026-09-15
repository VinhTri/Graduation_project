import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';

export const EmptyBoxIllustration = () => {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 10 }}>
      <Svg width={180} height={150} viewBox="0 0 180 150" fill="none">
        {/* Dotted path of butterfly */}
        <Path
          d="M 68 80 C 60 40, 110 30, 100 60 C 95 75, 125 45, 135 35"
          stroke="#8B5CF6"
          strokeWidth="2.5"
          strokeDasharray="4 4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Back side of the box */}
        <Path
          d="M 38 45 L 122 45 L 138 75 L 22 75 Z"
          fill="#FCE7F3"
          stroke="#D92686"
          strokeWidth="2"
        />

        {/* Files/Folders inside box */}
        <Rect
          x="44"
          y="35"
          width="32"
          height="30"
          rx="4"
          fill="#DDD6FE"
          stroke="#7C3AED"
          strokeWidth="1.5"
        />
        <Rect
          x="52"
          y="46"
          width="16"
          height="6"
          rx="2"
          fill="#FFFFFF"
          stroke="#7C3AED"
          strokeWidth="1"
        />

        <Rect
          x="80"
          y="38"
          width="36"
          height="28"
          rx="4"
          fill="#FBCFE8"
          stroke="#D92686"
          strokeWidth="1.5"
        />
        <Circle cx="98" cy="50" r="3" fill="#D92686" />

        {/* Front Box Body */}
        <Rect
          x="22"
          y="72"
          width="116"
          height="62"
          rx="10"
          fill="#FFF0F7"
          stroke="#D92686"
          strokeWidth="2.2"
        />

        {/* Handle / Slot on front */}
        <Rect
          x="62"
          y="90"
          width="36"
          height="12"
          rx="6"
          fill="#FCE7F3"
          stroke="#D92686"
          strokeWidth="1.8"
        />
        <Circle cx="68" cy="96" r="2" fill="#D92686" />

        {/* Top edge shadow highlight */}
        <Path
          d="M 23 74 L 137 74"
          stroke="#F472B6"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Cute Butterfly */}
        <G transform="translate(130, 20) rotate(15)">
          {/* Top Left Wing */}
          <Path
            d="M 0 0 C -8 -14, -18 -8, -10 2 C -5 6, 0 3, 0 0"
            fill="#C084FC"
            stroke="#7C3AED"
            strokeWidth="1.5"
          />
          {/* Top Right Wing */}
          <Path
            d="M 0 0 C 8 -14, 18 -8, 10 2 C 5 6, 0 3, 0 0"
            fill="#C084FC"
            stroke="#7C3AED"
            strokeWidth="1.5"
          />
          {/* Bottom Left Wing */}
          <Path
            d="M 0 3 C -6 8, -12 12, -8 16 C -4 18, 0 8, 0 3"
            fill="#DDD6FE"
            stroke="#7C3AED"
            strokeWidth="1.2"
          />
          {/* Bottom Right Wing */}
          <Path
            d="M 0 3 C 6 8, 12 12, 8 16 C 4 18, 0 8, 0 3"
            fill="#DDD6FE"
            stroke="#7C3AED"
            strokeWidth="1.2"
          />
          {/* Body */}
          <Path
            d="M 0 -6 L 0 12"
            stroke="#5B21B6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Antenna */}
          <Path
            d="M 0 -6 Q -4 -12 -7 -10"
            stroke="#5B21B6"
            strokeWidth="1"
            fill="none"
          />
          <Path
            d="M 0 -6 Q 4 -12 7 -10"
            stroke="#5B21B6"
            strokeWidth="1"
            fill="none"
          />
        </G>
      </Svg>
    </View>
  );
};

export default EmptyBoxIllustration;
