import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  topSection: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    minHeight: 280, // Giữ chiều cao cố định để không bị giật khi trượt
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeContainer: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  mainHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,1)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 16,
  },
  inactiveDot: {
    backgroundColor: '#D1D5DB',
  },
});
