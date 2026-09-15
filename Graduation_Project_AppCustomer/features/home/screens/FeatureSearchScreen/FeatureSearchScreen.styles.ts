import { StyleSheet } from 'react-native'

export const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  searchBox: { flex: 1, height: 50, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1 },
  input: { flex: 1, height: '100%', paddingVertical: 0, fontSize: 15, fontWeight: '600' },
  clearBtn: { width: 28, height: 36, alignItems: 'flex-end', justifyContent: 'center' },
  closeBtn: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  heading: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  count: { fontSize: 12, fontWeight: '800' },
  list: { paddingHorizontal: 16, gap: 8 },
  featureRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 17, borderWidth: 1 },
  featureIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featureCopy: { flex: 1, minWidth: 0 },
  featureTitle: { fontSize: 14, fontWeight: '800', marginBottom: 3 },
  featureHint: { fontSize: 12, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingHorizontal: 30, paddingTop: 80 },
  emptyIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '900', marginBottom: 6 },
  emptyText: { maxWidth: 260, textAlign: 'center', fontSize: 13, lineHeight: 19 },
})
