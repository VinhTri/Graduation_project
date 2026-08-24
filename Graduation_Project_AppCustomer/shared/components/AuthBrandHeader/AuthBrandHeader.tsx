import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette';
import { SmartSpendIcon } from '@/shared/components/SmartSpendIcon';

type AuthBrandHeaderProps = {
  subtitle?: string;
  variant?: 'default' | 'compact';
  style?: StyleProp<ViewStyle>;
};

export function AuthBrandHeader({
  subtitle,
  variant = 'default',
  style,
}: AuthBrandHeaderProps) {
  const isCompact = variant === 'compact';

  return (
    <View style={[styles.wrap, isCompact && styles.wrapCompact, style]}>
      <View
        style={[
          styles.brandRow,
          isCompact && styles.brandRowCompact,
          isCompact && styles.brandPill,
        ]}
      >
        <SmartSpendIcon
          size={isCompact ? 28 : 52}
          style={styles.brandLogo}
          borderRadius={isCompact ? 8 : 14}
        />
        <Text style={[styles.brandTitle, isCompact && styles.brandTitleCompact]}>
          <Text style={styles.brandSmart}>Smart</Text>
          <Text style={styles.brandSpend}>Spend</Text>
        </Text>
      </View>
      {subtitle ? (
        <Text style={[styles.brandSubtitle, isCompact && styles.brandSubtitleCompact]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 0,
  },
  wrapCompact: {
    alignSelf: 'flex-start',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  brandRowCompact: {
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 0,
  },
  brandPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    shadowColor: '#2E1065',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  brandLogo: {
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  brandTitleCompact: {
    fontSize: 18,
    letterSpacing: 0.2,
  },
  brandSmart: {
    color: PASTEL_PALETTE.title,
  },
  brandSpend: {
    color: PASTEL_PALETTE.accent,
  },
  brandSubtitle: {
    fontSize: 14,
    color: PASTEL_PALETTE.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  brandSubtitleCompact: {
    textAlign: 'left',
    marginTop: 8,
    marginBottom: 0,
    fontSize: 13,
  },
});

export default AuthBrandHeader;
