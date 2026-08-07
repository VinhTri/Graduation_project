import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerSection: {
    marginBottom: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#4A0E4E',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  calendarCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B21A8',
  },
  weekdaysRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F6FF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EDE9FE',
  },
  weekdayCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  weekendText: {
    color: '#BE185D',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    minHeight: 66,
    paddingTop: 6,
    paddingBottom: 4,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#F3F4F6',
  },
  cellNoRightBorder: {
    borderRightWidth: 0,
  },
  cellEmpty: {
    backgroundColor: 'transparent',
  },
  cellToday: {
    backgroundColor: '#FDF2F8', // soft pink background
  },
  cellRecorded: {
    backgroundColor: '#FDF4FF', // soft purple/pink tint
  },
  cellFuture: {
    opacity: 0.35,
    backgroundColor: '#F9FAFB',
  },
  cellSelected: {
    borderWidth: 1.5,
    borderColor: '#BE185D',
  },
  dayNumWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  dayNumToday: {
    color: '#BE185D',
    fontWeight: '800',
  },
  dayNumFuture: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  statusTextWrap: {
    marginTop: 4,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  statusNotRecorded: {
    fontSize: 9.5,
    lineHeight: 11.5,
    textAlign: 'center',
    color: '#4B5563',
    fontWeight: '400',
  },
  statusRecorded: {
    fontSize: 9.5,
    lineHeight: 11.5,
    textAlign: 'center',
    color: '#BE185D',
    fontWeight: '700',
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#BE185D',
    marginTop: 2,
  },
});
