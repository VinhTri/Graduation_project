import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', // Nền tổng thể sáng
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.6,
  },
  circleTopLeft: {
    width: 250,
    height: 250,
    backgroundColor: '#E5F7F3', // Xanh mint nhạt
    top: -50,
    left: -50,
  },
  circleMiddleRight: {
    width: 300,
    height: 300,
    backgroundColor: '#EEF0FF', // Tím nhạt
    top: 150,
    right: -100,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },

  bottomSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    flex: 1,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#109185',
    textAlign: 'center',
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  formContainer: {
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    height: 52,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  eyeIcon: {
    padding: 8,
    marginRight: -8, // Căn chỉnh lại icon mắt cho đẹp
  },
  registerButton: {
    backgroundColor: '#109185',
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#109185',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
