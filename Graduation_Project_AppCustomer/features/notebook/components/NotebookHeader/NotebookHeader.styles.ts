import { StyleSheet } from 'react-native';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';

export const styles = StyleSheet.create({
  headerContent: {
    paddingBottom: 28,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: PASTEL_PALETTE.subtitle,
    marginTop: 2,
  },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PASTEL_PALETTE.textMuted,
    letterSpacing: 0.6,
  },
  eyeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: PASTEL_PALETTE.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
    marginBottom: 12,
  },
  addBalanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PASTEL_PALETTE.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F9A8D4',
  },
  addBalanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: PASTEL_PALETTE.accentDeep,
  },
  balanceActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  spendBalanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  spendBalanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});
