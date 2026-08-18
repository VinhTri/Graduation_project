import { StyleSheet } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.bg,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
    marginLeft: -8,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: PASTEL_PALETTE.title,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: PASTEL_PALETTE.subtitle,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  addBtn: {
    marginTop: 8,
    alignSelf: 'stretch',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PASTEL_PALETTE.accentDeep,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addBtnText: {
    color: PASTEL_PALETTE.white,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    padding: 14,
    marginBottom: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logo: {
    backgroundColor: PASTEL_PALETTE.bgSoft,
  },
  logoFallback: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: PASTEL_PALETTE.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankName: {
    fontSize: 15,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  accountNumber: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: PASTEL_PALETTE.subtitle,
  },
  accountName: {
    marginTop: 2,
    fontSize: 12,
    color: PASTEL_PALETTE.textMuted,
  },
  unlinkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  unlinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  emptyBox: {
    marginBottom: 16,
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: PASTEL_PALETTE.textMuted,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#EF4444',
    fontWeight: '600',
  },
})
