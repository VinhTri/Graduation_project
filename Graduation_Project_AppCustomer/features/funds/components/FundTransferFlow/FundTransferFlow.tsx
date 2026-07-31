import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SmartSpendIcon } from '../../../../shared/components/SmartSpendIcon';
import { FundIcon } from '../../../../shared/components/FundIcon';
import { FUND_PALETTE } from '../../theme';
import { formatCurrency } from '../../utils';

type TransferParty = {
  kind: 'wallet' | 'fund';
  name: string;
  balance: number;
  colorSeed?: number;
};

interface FundTransferFlowProps {
  from: TransferParty;
  to: TransferParty;
  /** 'deposit' = tiền vào quỹ | 'withdraw' = tiền ra khỏi quỹ */
  direction: 'deposit' | 'withdraw';
}

function PartyRow({ party, role }: { party: TransferParty; role: 'from' | 'to' }) {
  const roleLabel = role === 'from' ? 'Từ' : 'Đến';

  return (
    <View style={styles.partyRow}>
      {party.kind === 'wallet' ? (
        <SmartSpendIcon size={48} borderRadius={14} style={styles.partyLogo} />
      ) : (
        <FundIcon size={48} borderRadius={14} style={styles.partyLogo} />
      )}

      <View style={styles.partyInfo}>
        <Text style={styles.roleLabel}>{roleLabel}</Text>
        {party.kind === 'wallet' ? (
          <Text style={styles.brandTitle}>
            <Text style={styles.brandSmart}>Smart</Text>
            <Text style={styles.brandSpend}>Spend</Text>
          </Text>
        ) : (
          <Text style={styles.fundName} numberOfLines={1}>{party.name}</Text>
        )}
      </View>

      <View style={styles.balanceWrap}>
        <Text style={styles.balanceLabel}>Số dư</Text>
        <Text style={styles.balanceValue} numberOfLines={1}>
          {formatCurrency(party.balance)} ₫
        </Text>
      </View>
    </View>
  );
}

export function FundTransferFlow({ from, to, direction }: FundTransferFlowProps) {
  const isDeposit = direction === 'deposit';
  const badgeLabel = isDeposit ? 'Nạp vào quỹ' : 'Rút về ví';
  const badgeColor = isDeposit ? FUND_PALETTE.success : FUND_PALETTE.primaryDeep;
  const badgeBg = isDeposit ? '#DCFCE7' : FUND_PALETTE.primarySofter;

  return (
    <View style={styles.card}>
      <View style={styles.decorCircle} />

      <PartyRow party={from} role="from" />

      <View style={styles.flowCenter}>
        <View style={styles.flowLine} />
        <View style={[styles.flowBadge, { backgroundColor: badgeBg }]}>
          <Ionicons name="arrow-down" size={14} color={badgeColor} />
          <Text style={[styles.flowBadgeText, { color: badgeColor }]}>{badgeLabel}</Text>
        </View>
        <View style={styles.flowLine} />
      </View>

      <PartyRow party={to} role="to" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    overflow: 'hidden',
    shadowColor: FUND_PALETTE.primaryDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  decorCircle: {
    position: 'absolute',
    top: -36,
    right: -28,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(236,72,153,0.08)',
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partyLogo: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  partyInfo: {
    flex: 1,
    minWidth: 0,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: FUND_PALETTE.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  brandSmart: {
    color: FUND_PALETTE.title,
  },
  brandSpend: {
    color: FUND_PALETTE.primary,
  },
  fundName: {
    fontSize: 16,
    fontWeight: '800',
    color: FUND_PALETTE.title,
    marginTop: 2,
  },
  balanceWrap: {
    alignItems: 'flex-end',
    maxWidth: 120,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: FUND_PALETTE.textMuted,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '800',
    color: FUND_PALETTE.primaryDeep,
    marginTop: 2,
  },
  flowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 8,
    gap: 10,
  },
  flowLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: FUND_PALETTE.borderSoft,
  },
  flowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  flowBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
});

export default FundTransferFlow;
