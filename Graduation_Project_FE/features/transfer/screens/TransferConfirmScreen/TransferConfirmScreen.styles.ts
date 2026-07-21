import { StyleSheet } from 'react-native';
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerWrap: {
    paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: -20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: PASTEL_PALETTE.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: PASTEL_PALETTE.textMuted,
    fontWeight: '500',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '900',
    color: PASTEL_PALETTE.title,
    letterSpacing: -1,
  },
  currency: {
    fontSize: 20,
    color: PASTEL_PALETTE.subtitle,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: PASTEL_PALETTE.border,
    marginBottom: 20,
    borderStyle: 'dashed',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: PASTEL_PALETTE.textMuted,
    fontWeight: '500',
    width: 100,
  },
  detailValue: {
    fontSize: 15,
    color: PASTEL_PALETTE.title,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    padding: 24,
    backgroundColor: '#F8F9FA',
  },
  confirmButton: {
    backgroundColor: PASTEL_PALETTE.accentDeep,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PASTEL_PALETTE.accentDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  }
});
