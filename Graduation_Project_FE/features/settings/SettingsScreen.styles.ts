import { StyleSheet } from "react-native";
import Colors from "../../shared/constants/Colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "700",
  },
  headerBackIcon: {
    position: "absolute",
    left: 0,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F43F5E",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: "600",
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "800",
    textTransform: "uppercase",
    marginRight: 6,
  },
  userPhone: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginBottom: 6,
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  editIconContainer: {
    padding: 8,
  },
  
  // Quick Actions Overlay
  quickActionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: -40,
    gap: 12,
    marginBottom: 20,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  quickActionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBoxGreen: {
    backgroundColor: "#E5F7F3",
  },
  iconBoxGray: {
    backgroundColor: "#F3F4F6",
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },

  // Settings Sections
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
  },
  sectionLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
    marginBottom: 2,
  },
  sectionBody: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
  },

  // Settings Items
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
  },
  itemSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemValueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginRight: 4,
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  eyeIcon: {
    marginRight: 12,
  },

  // Logout Button
  logoutContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingVertical: 16,
  },
  logoutText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});
