import { StyleSheet } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.bg,
  },
  headerContent: {
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    marginRight: 6,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: PASTEL_PALETTE.title,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: PASTEL_PALETTE.subtitle,
  },
  addGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PASTEL_PALETTE.accentDeep,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 18,
  },
  addGroupText: {
    color: PASTEL_PALETTE.white,
    fontWeight: '700',
    fontSize: 13,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyWrap: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
    marginBottom: 14,
  },
  stepCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: PASTEL_PALETTE.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
  },
  stepDesc: {
    marginTop: 4,
    fontSize: 13,
    color: PASTEL_PALETTE.textMuted,
    lineHeight: 18,
  },
  emptyCta: {
    marginTop: 8,
    backgroundColor: PASTEL_PALETTE.accentDeep,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyCtaText: {
    color: PASTEL_PALETTE.white,
    fontWeight: '700',
  },
  groupCard: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    overflow: 'hidden',
  },
  groupHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  groupActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  groupDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noItemText: {
    padding: 14,
    color: PASTEL_PALETTE.textMuted,
    fontSize: 13,
  },
})
