import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette';
import { SmartSpendIcon } from '@/shared/components/SmartSpendIcon';

interface AuthBrandHeaderProps {
  subtitle: string;
}

export function AuthBrandHeader({ subtitle }: AuthBrandHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.brandRow}>
        <SmartSpendIcon size={52} style={styles.brandLogo} borderRadius={14} />
        <Text style={styles.brandTitle}>
          <Text style={styles.brandSmart}>Smart</Text>
          <Text style={styles.brandSpend}>Spend</Text>
        </Text>
      </View>
      <Text style={styles.brandSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 0,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
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
});

export default AuthBrandHeader;
