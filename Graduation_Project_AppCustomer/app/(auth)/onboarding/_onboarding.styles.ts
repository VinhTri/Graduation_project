import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.5,
  },
  circleTopLeft: {
    width: 350,
    height: 350,
    backgroundColor: '#E5F7F3',
    top: -100,
    left: -100,
  },
  circleBottomRight: {
    width: 450,
    height: 450,
    backgroundColor: '#EEF0FF',
    bottom: -200,
    right: -150,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title1: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4B5563', // A bit softer dark color
    textAlign: 'center',
    lineHeight: 40,
  },
  title2: {
    fontSize: 30,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 44,
  },
  highlight: {
    color: '#109185',
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5F7F3',
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
  },
  badgeText: {
    color: '#109185',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 2,
  },
  title3: {
    fontSize: 34,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 16,
  },
  subtitle3: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 50,
    left: 32,
    right: 32,
  },
  button: {
    backgroundColor: '#109185',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#109185',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  paginationContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#109185',
    borderRadius: 2,
  },
});
