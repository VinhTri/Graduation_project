import { StyleSheet } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

/** Layout full màn hình cho luồng đăng ký (không có slider). */
export const registerScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.white,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  formFlex: {
    flexGrow: 1,
  },

  stepperCard: {
    backgroundColor: PASTEL_PALETTE.bgSoft,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  stepperTrack: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepperColumn: {
    flex: 1,
    alignItems: 'center',
  },
  stepperNodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: PASTEL_PALETTE.gray200,
    backgroundColor: PASTEL_PALETTE.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: PASTEL_PALETTE.accentDeep,
    backgroundColor: PASTEL_PALETTE.accentDeep,
    shadowColor: PASTEL_PALETTE.accentDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  stepCircleDone: {
    borderColor: PASTEL_PALETTE.accent,
    backgroundColor: PASTEL_PALETTE.accent,
  },
  stepConnector: {
    flex: 1,
    height: 3,
    backgroundColor: PASTEL_PALETTE.gray200,
    borderRadius: 2,
  },
  stepConnectorDone: {
    backgroundColor: PASTEL_PALETTE.accent,
  },
  stepConnectorHidden: {
    backgroundColor: 'transparent',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PASTEL_PALETTE.gray400,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: PASTEL_PALETTE.accentDeep,
    fontWeight: '800',
  },
  stepLabelDone: {
    color: PASTEL_PALETTE.title,
    fontWeight: '700',
  },
  stepBadge: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '600',
    color: PASTEL_PALETTE.gray400,
    letterSpacing: 0.3,
  },
  stepBadgeActive: {
    color: PASTEL_PALETTE.accentDeep,
  },
})
