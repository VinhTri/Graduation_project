import { StyleSheet, Dimensions } from "react-native";
import Colors from "@/shared/constants/Colors";

const { height } = Dimensions.get("window");

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backdropTouchable: {
    flex: 1,
    width: "100%",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.85,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FAFAFA",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },

  // Category Filter Tabs
  categoryBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: Colors.white,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  categoryChipTextActive: {
    color: Colors.white,
  },

  // Quick Suggestion Chips
  suggestionsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },
  suggestionChipText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },

  // Chat Area
  chatArea: {
    flex: 1,
    padding: 16,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowAI: {
    justifyContent: "flex-start",
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginTop: 2,
  },
  messageBubbleContainer: {
    maxWidth: "82%",
  },
  messageBubble: {
    padding: 14,
    borderRadius: 18,
  },
  messageBubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleAI: {
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 4,
  },
  messageTextUser: {
    color: Colors.white,
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextAI: {
    color: "#1F2937",
    fontSize: 14.5,
    lineHeight: 22,
  },
  moduleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 6,
  },
  moduleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  // Metrics & Data Cards
  cardContainer: {
    marginTop: 10,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 6,
  },
  cardItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  cardItemLabel: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  cardItemValue: {
    fontSize: 13,
    fontWeight: "700",
  },

  // Loading Typing Indicator
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 12,
  },
  typingText: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
  },

  // Input Area
  inputArea: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    marginRight: 10,
    color: "#111827",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  // Action Prompt & Interactive Buttons
  actionPromptContainer: {
    marginTop: 10,
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  actionQuestionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3730A3",
    marginBottom: 8,
  },
  actionButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: Colors.primary,
  },
  actionButtonTextPrimary: {
    fontSize: 12.5,
    fontWeight: "600",
    color: Colors.white,
  },
});
