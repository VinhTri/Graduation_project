import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, useLanguage } from '../../../shared/contexts/ThemeLanguageContext';
import { styles } from '../SettingsScreen.styles';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ChangePinFlow } from './ChangePinFlow';

const ANIM_CONFIG = {
  duration: 320,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
};

type SubItemsProps = {
  onPassword: () => void;
  onPin: () => void;
};

const SecuritySubItems = ({ onPassword, onPin }: SubItemsProps) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <View style={[styles.securitySubList, { backgroundColor: theme.bgSoft, borderTopColor: theme.divider }]}>
      <TouchableOpacity
        style={[styles.securitySubItem, { borderBottomColor: theme.divider }]}
        activeOpacity={0.75}
        onPress={onPassword}
      >
        <View style={[styles.securitySubIcon, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Feather name="lock" size={16} color={theme.primary} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>{t('changePassword')}</Text>
          <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>{t('changePasswordSub')}</Text>
        </View>
        <Feather name="chevron-right" size={16} color={theme.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.securitySubItem, { borderBottomWidth: 0 }]}
        activeOpacity={0.75}
        onPress={onPin}
      >
        <View style={[styles.securitySubIcon, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Feather name="key" size={16} color={theme.primary} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>{t('changePin')}</Text>
          <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>{t('changePinSub')}</Text>
        </View>
        <Feather name="chevron-right" size={16} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

export const SecuritySection = () => {
  const [expanded, setExpanded] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const { theme } = useTheme();
  const { t } = useLanguage();

  const progress = useSharedValue(0);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    progress.value = withTiming(next ? 1 : 0, ANIM_CONFIG);
  };

  const panelStyle = useAnimatedStyle(() => {
    const h = measuredHeight > 0 ? measuredHeight : 0;
    return {
      height: progress.value * h,
      opacity: interpolate(progress.value, [0, 0.35, 1], [0, 0.55, 1]),
      transform: [
        {
          translateY: interpolate(progress.value, [0, 1], [-6, 0]),
        },
      ],
    };
  });

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg`,
      },
    ],
  }));

  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('security')}</Text>
        </View>

        <View style={[styles.sectionBody, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Pressable
            style={[
              styles.itemContainer,
              { borderBottomWidth: expanded ? StyleSheet.hairlineWidth : 0, borderBottomColor: theme.divider },
            ]}
            onPress={toggle}
          >
            <View style={[styles.itemIconContainer, { backgroundColor: theme.primarySoft }]}>
              <Feather name="shield" size={19} color={theme.primary} />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>{t('accountSecurity')}</Text>
              <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>{t('accountSecuritySub')}</Text>
            </View>
            <Animated.View style={chevronStyle}>
              <Feather name="chevron-down" size={18} color={theme.textMuted} />
            </Animated.View>
          </Pressable>

          <View
            style={styles.securityMeasure}
            pointerEvents="none"
            onLayout={(e) => {
              const next = Math.ceil(e.nativeEvent.layout.height);
              if (next > 0 && next !== measuredHeight) {
                setMeasuredHeight(next);
              }
            }}
          >
            <SecuritySubItems
              onPassword={() => setPasswordVisible(true)}
              onPin={() => setPinVisible(true)}
            />
          </View>

          <Animated.View style={[styles.securityCollapse, panelStyle]}>
            <SecuritySubItems
              onPassword={() => setPasswordVisible(true)}
              onPin={() => setPinVisible(true)}
            />
          </Animated.View>
        </View>
      </View>

      <ChangePasswordModal visible={passwordVisible} onClose={() => setPasswordVisible(false)} />
      <ChangePinFlow visible={pinVisible} onClose={() => setPinVisible(false)} />
    </>
  );
};

