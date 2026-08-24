import { StyleSheet } from 'react-native'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_PALETTE.bg,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
    marginLeft: -8,
  },
  titleBlock: {
    flex: 1,
    paddingRight: 88,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: PASTEL_PALETTE.title,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: PASTEL_PALETTE.subtitle,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  errorText: {
    marginTop: 24,
    textAlign: 'center',
    color: '#EF4444',
    fontWeight: '600',
  },
})
