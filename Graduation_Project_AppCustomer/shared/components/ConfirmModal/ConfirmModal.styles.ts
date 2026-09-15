import { StyleSheet } from 'react-native'
import Colors from '../../constants/Colors'
import { PASTEL_PALETTE } from '../../constants/PastelPalette'

export const OVERLAY_PADDING_H = 24

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: OVERLAY_PADDING_H,
  },
  overlayIcon: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: OVERLAY_PADDING_H,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  cardImage: {
    backgroundColor: PASTEL_PALETTE.white,
    borderRadius: 24,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  imageBody: {
    padding: 24,
    alignItems: 'center',
  },
  imageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
    marginBottom: 8,
    textAlign: 'center',
  },
  imageMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: PASTEL_PALETTE.textMuted,
    textAlign: 'center',
    marginBottom: 22,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  imageCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: PASTEL_PALETTE.gray100,
    alignItems: 'center',
  },
  imageCancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: PASTEL_PALETTE.textMuted,
  },
  imageConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: PASTEL_PALETTE.accentDeep,
    alignItems: 'center',
  },
  imageConfirmButtonDanger: {
    backgroundColor: '#DC2626',
  },
  imageConfirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: PASTEL_PALETTE.white,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
})
