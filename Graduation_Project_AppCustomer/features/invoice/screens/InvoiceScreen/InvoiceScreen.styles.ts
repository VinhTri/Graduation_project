import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';

export const PALETTE = {
  headerStart: '#FCE7F3',
  headerMid: '#EDE9FE',
  headerEnd: '#E0E7FF',
};

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5FA' },
  headerWrap: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  header: {
    paddingTop: Constants.statusBarHeight + 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerDecorCircleLarge: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.28)', top: -24, right: -20,
  },
  headerDecorCircleSmall: {
    position: 'absolute', width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.24)', bottom: 12, left: 18,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'space-between' },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginRight: 8, marginLeft: -8 },
  titleContainer: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#4C1D95', letterSpacing: -0.3 },
  headerSubtitle: { marginTop: 3, fontSize: 12.5, color: '#6D28D9', fontWeight: '600', opacity: 0.82 },
  createButton: {
    flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14,
    backgroundColor: '#EC4899', shadowColor: '#BE185D', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  createButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  listContainer: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 36 },
  summaryWidget: {
    position: 'relative', overflow: 'hidden', padding: 20, borderRadius: 26,
    backgroundColor: '#4C1D95', shadowColor: '#4C1D95', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 6,
  },
  summaryOrbLarge: {
    position: 'absolute', width: 150, height: 150, right: -62, top: -74,
    borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  summaryOrbSmall: {
    position: 'absolute', width: 70, height: 70, right: 52, bottom: -42,
    borderRadius: 35, backgroundColor: 'rgba(236,72,153,0.18)',
  },
  summaryTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  summaryIconWrap: {
    width: 46, height: 46, borderRadius: 15, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  summaryTitle: { fontSize: 12, color: '#DDD6FE', fontWeight: '700', letterSpacing: 0.5 },
  summaryAmount: {
    marginTop: 6, color: '#FFFFFF', fontSize: 30, fontWeight: '900',
    letterSpacing: -0.8, fontVariant: ['tabular-nums'],
  },
  summaryCurrency: { color: '#C4B5FD', fontSize: 19, fontWeight: '800' },
  summaryDivider: { height: 1, marginVertical: 17, backgroundColor: 'rgba(255,255,255,0.16)' },
  summaryStats: { flexDirection: 'row' },
  summaryStatItem: { flex: 1 },
  summaryStatDivider: { width: 1, marginHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.16)' },
  summaryStatLabel: { color: '#C4B5FD', fontSize: 11, fontWeight: '600' },
  summaryStatValue: { marginTop: 5, color: '#FFFFFF', fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  summaryStatDanger: { color: '#FDE68A' },

  trackerNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 9,
    marginTop: 16, marginBottom: 24, paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#DDD6FE', borderRadius: 14, backgroundColor: '#F5F3FF',
  },
  trackerNoticeText: { flex: 1, color: '#5B21B6', fontSize: 13, fontWeight: '600', lineHeight: 19 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11, paddingHorizontal: 2 },
  listHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  sectionHeading: { color: '#29232E', fontSize: 17, fontWeight: '900', letterSpacing: -0.2 },
  sectionLink: { color: '#7C3AED', fontSize: 13, fontWeight: '700' },
  invoiceCount: { color: '#877D8D', fontSize: 12, fontWeight: '600' },

  servicesGridContainer: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 10,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEEAF2',
    borderRadius: 20, marginBottom: 26,
  },
  serviceGridItem: { alignItems: 'center', width: '24%', paddingVertical: 8, borderRadius: 14 },
  serviceGridIconWrap: { width: 46, height: 46, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 7 },
  serviceGridText: { fontSize: 11.5, textAlign: 'center', fontWeight: '700', color: '#453C49' },

  tabsContainer: { flexDirection: 'row', padding: 4, marginTop: 12, marginBottom: 14, borderRadius: 14, backgroundColor: '#ECE8EF' },
  tabItem: { flex: 1, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  tabItemActive: {
    backgroundColor: '#FFFFFF', shadowColor: '#4C1D95', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 5, elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: '700', color: '#7C7282' },
  tabTextActive: { color: '#4C1D95', fontWeight: '800' },

  invoiceCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 15, marginBottom: 12,
    borderWidth: 1, borderColor: '#EEEAF2', shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  serviceIconContainer: { width: 46, height: 46, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  invoiceBody: { flex: 1 },
  invoiceHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  invoiceName: { flex: 1, marginRight: 8, fontSize: 15, fontWeight: '800', color: '#29232E' },
  invoiceAmount: { marginTop: 3, fontSize: 20, fontWeight: '900', color: '#4C1D95', fontVariant: ['tabular-nums'] },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9 },
  statusText: { fontSize: 10, fontWeight: '800' },
  invoiceFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1EDF3',
  },
  dueDateContainer: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  dueDateText: { marginLeft: 6, fontSize: 12, color: '#706779' },
  reminderBadge: { backgroundColor: '#F5F3FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9 },
  reminderText: { fontSize: 11, color: '#6D28D9', fontWeight: '700' },
  payNowButton: {
    marginTop: 12, paddingVertical: 11, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  payNowText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  swipeDeleteActionWrap: { width: 86, marginLeft: 8, marginBottom: 12 },
  swipeDeleteButton: { flex: 1, borderRadius: 20, overflow: 'hidden', elevation: 2 },
  swipeDeleteGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10, borderRadius: 20, minHeight: '100%' },
  swipeDeleteIconCircle: {
    width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  swipeDeleteText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },

  emptyStateContainer: {
    alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 28,
    paddingVertical: 34, paddingHorizontal: 30, borderRadius: 22, backgroundColor: '#FFFFFF',
  },
  emptyIconContainer: {
    width: 72, height: 72, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, borderRadius: 24, backgroundColor: '#F5F3FF',
  },
  emptyTitle: { marginBottom: 7, fontSize: 17, fontWeight: '900', color: '#29232E', textAlign: 'center' },
  emptySubtitle: { maxWidth: 280, fontSize: 13, color: '#776E7D', textAlign: 'center', lineHeight: 20 },
  loadingContent: { flex: 1, padding: 16 },
  skeletonSummary: { height: 184, borderRadius: 26, backgroundColor: '#E9E4ED' },
  skeletonRow: { height: 86, marginTop: 18, borderRadius: 20, backgroundColor: '#EFEAF2' },
  skeletonCard: { height: 150, marginTop: 12, borderRadius: 20, backgroundColor: '#F0ECF2' },
});
