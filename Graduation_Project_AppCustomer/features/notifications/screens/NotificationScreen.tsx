import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import PastelHeaderShell from "../../../shared/components/PastelHeaderShell/PastelHeaderShell";
import { PASTEL_PALETTE } from "../../../shared/constants/PastelPalette";
import { useTheme } from "../../../shared/contexts/ThemeLanguageContext";
import {
  notificationService,
  NotificationResponse,
} from "../../../shared/api/services/notification.service";
import { fundService } from "../../../shared/api/services/fundService";
import { invoiceService } from "@/shared/api/services/invoiceService";
import { fundStore } from "../../funds/store/fundStore";
import { ConfirmModal, SuccessModal } from "../../../shared/components";

const timeAgo = (dateInput: string) => {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Vài giây trước";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} ngày trước`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} tháng trước`;

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} năm trước`;
};

export default function NotificationScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  const [selectedNotification, setSelectedNotification] = useState<NotificationResponse | null>(null);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [joinedFundId, setJoinedFundId] = useState<number | null>(null);

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const sections = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recent: NotificationResponse[] = [];
    const older: NotificationResponse[] = [];
    notifications.forEach((item) => {
      const createdAt = new Date(item.createdAt);
      (createdAt >= today ? recent : older).push(item);
    });
    return [
      { title: "Hôm nay", data: recent },
      { title: "Trước đó", data: older },
    ].filter((section) => section.data.length > 0);
  }, [notifications]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res: any = await notificationService.getAll();
      if (res && res.success) {
        setNotifications(res.data || []);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.log("Error loading notifications:", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await notificationService.readAll();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      console.log("Error marking notifications as read:", error);
      Alert.alert("Không thể cập nhật", "Vui lòng thử lại sau.");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleOpenAcceptModal = (item: NotificationResponse) => {
    setSelectedNotification(item);
    setAcceptModalVisible(true);
  };

  const handleOpenRejectModal = (item: NotificationResponse) => {
    setSelectedNotification(item);
    setRejectModalVisible(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedNotification || selectedNotification.relatedId == null) return;
    const item = selectedNotification;
    const fundId = selectedNotification.relatedId;
    setAcceptModalVisible(false);
    setActingId(item.id);
    try {
      await fundService.acceptInvite(fundId);
      await fundStore.refreshFunds().catch(() => {});
      setNotifications((prev) => prev.filter((n) => n.id !== item.id));
      await notificationService.delete(item.id).catch(() => {});
      setJoinedFundId(fundId);
      setSuccessModalVisible(true);
    } catch (err: any) {
      const msg = err?.message || "";
      const code = err?.code || "";
      if (code === "FUND_8001" || msg.includes("Không tìm thấy quỹ") || msg.includes("không tồn tại")) {
        setNotifications((prev) => prev.filter((n) => n.id !== item.id));
        await notificationService.delete(item.id).catch(() => {});
        Alert.alert("Thông báo", "Quỹ này đã bị chủ quỹ xóa hoặc không còn tồn tại.");
      } else {
        Alert.alert("Không thể tham gia", msg || "Vui lòng thử lại");
      }
    } finally {
      setActingId(null);
      setSelectedNotification(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedNotification || selectedNotification.relatedId == null) return;
    const item = selectedNotification;
    const fundId = selectedNotification.relatedId;
    setRejectModalVisible(false);
    setActingId(item.id);
    try {
      await fundService.rejectInvite(fundId);
      setNotifications((prev) => prev.filter((n) => n.id !== item.id));
      await notificationService.delete(item.id).catch(() => {});
    } catch (err: any) {
      const msg = err?.message || "";
      const code = err?.code || "";
      if (code === "FUND_8001" || code === "FUND_8014" || msg.includes("Không tìm thấy quỹ") || msg.includes("không tồn tại")) {
        setNotifications((prev) => prev.filter((n) => n.id !== item.id));
        await notificationService.delete(item.id).catch(() => {});
      } else {
        Alert.alert("Lỗi", msg || "Không thể từ chối lời mời");
      }
    } finally {
      setActingId(null);
      setSelectedNotification(null);
    }
  };

  const handleNotificationPress = async (item: NotificationResponse) => {
    console.log("Notification Pressed:", item);
    
    switch (item.type) {
      case "FUND_INVITE":
        router.push("/funds");
        break;
      case "INVOICE_REMINDER":
      case "INVOICE_DUE_TODAY":
      case "INVOICE_OVERDUE":
      case "INVOICE_PAYMENT_SUCCESS":
        if (item.relatedId) {
          try {
            await invoiceService.getInvoiceById(item.relatedId);
            router.push(`/invoice/${item.relatedId}${item.type === "INVOICE_PAYMENT_SUCCESS" ? "?viewOnly=true" : ""}`);
          } catch (error) {
            setErrorMessage("Không thể lấy thông tin hóa đơn vì hóa đơn này đã bị xóa.");
            setErrorModalVisible(true);
          }
        } else {
          router.push("/invoice");
        }
        break;
      case "FRIEND_REQUEST":
      case "FRIEND_ACCEPTED":
        router.push("/contacts");
        break;
      case "FUND_INVITE_ACCEPTED":
        if (item.relatedId) router.push(`/funds/${item.relatedId}`);
        else router.push("/funds");
        break;
      case "BUDGET_WARNING":
      case "BUDGET_EXCEEDED":
        if (item.relatedId) router.push(`/budget/${item.relatedId}` as any);
        else router.push("/budget");
        break;
      case "NOTEBOOK_REMINDER":
        router.push("/(tabs)/notebook");
        break;
      case "SPLIT_BILL_REQUEST":
      case "SPLIT_BILL_PAID":
      case "SPLIT_BILL_REMINDER":
      case "SPLIT_BILL_COMPLETED":
      case "SPLIT_BILL_CANCELLED":
        if (item.relatedId) router.push(`/split-bill/${item.relatedId}` as any);
        else router.push("/split-bill" as any);
        break;
      case "TRANSFER_RECEIVED":
      case "WITHDRAW_SUCCESS":
      case "TOP_UP_SUCCESS":
        router.push("/wallet/history");
        break;
      case "FUND_DEPOSIT":
      case "FUND_WITHDRAW":
      case "FUND_GOAL_REACHED":
      case "FUND_CLOSED":
        if (item.relatedId && item.type !== "FUND_CLOSED") router.push(`/funds/${item.relatedId}`);
        else router.push("/funds");
        break;

      case "GENERAL":
      default:
        // Dự phòng cho các thông báo từ backend chưa cập nhật type cụ thể
        const title = item.title?.toLowerCase() || "";
        if (title.includes("hóa đơn")) {
          router.push("/invoice");
        } else if (title.includes("kết bạn")) {
          router.push("/contacts");
        } else if (title.includes("ngân sách")) {
          router.push("/budget");
        } else if (title.includes("sổ tay")) {
          router.push("/(tabs)/notebook");
        } else if (title.includes("chia tiền")) {
          if (item.relatedId) router.push(`/split-bill/${item.relatedId}` as any);
          else router.push("/split-bill" as any);
        } else if (title.includes("quỹ")) {
          router.push("/funds");
        } else {
          Alert.alert("Thông tin", "Không thể điều hướng cho thông báo này vì hệ thống chưa xác định được đích đến.");
        }
        break;
    }
  };

  const renderItem = ({ item }: { item: NotificationResponse }) => {
    const isFundInvite = item.type === "FUND_INVITE" && !!item.relatedId;
    const getIconName = () => {
      if (isFundInvite) return "people";
      if (item.type === "SPLIT_BILL_REQUEST" || item.type === "SPLIT_BILL_PAID" || item.type === "SPLIT_BILL_REMINDER") return "wallet-outline";
      if (item.type === "SPLIT_BILL_COMPLETED") return "checkmark-done-outline";
      if (item.type === "SPLIT_BILL_CANCELLED") return "close-circle-outline";
      if (item.type === "NOTEBOOK_REMINDER") return "book-outline";
      if (item.type === "INVOICE_REMINDER" || item.type === "INVOICE_PAYMENT_SUCCESS" || item.type === "INVOICE_DUE_TODAY" || item.type === "INVOICE_OVERDUE") return "receipt-outline";
      if (item.type === "BUDGET_WARNING" || item.type === "BUDGET_EXCEEDED") return "pie-chart-outline";
      if (item.type === "FRIEND_REQUEST" || item.type === "FRIEND_ACCEPTED") return "person-add-outline";
      if (item.type === "TRANSFER_RECEIVED" || item.type === "TOP_UP_SUCCESS") return "arrow-down-circle-outline";
      if (item.type === "WITHDRAW_SUCCESS") return "arrow-up-circle-outline";
      if (item.type === "FUND_DEPOSIT" || item.type === "FUND_WITHDRAW" || item.type === "FUND_GOAL_REACHED" || item.type === "FUND_CLOSED") return "file-tray-full-outline";
      return "notifications";
    };

    const getVisual = () => {
      if (item.type?.includes("BUDGET") || item.type === "INVOICE_OVERDUE") return { color: "#C2415D", bg: "#FDECF2" };
      if (item.type?.includes("FUND")) return { color: "#6D4BA0", bg: "#F2ECFA" };
      if (item.type?.includes("SPLIT_BILL")) return { color: "#317A72", bg: "#E7F5F2" };
      if (item.type?.includes("INVOICE")) return { color: "#A56624", bg: "#FFF3E3" };
      if (item.type === "TRANSFER_RECEIVED" || item.type === "TOP_UP_SUCCESS") return { color: "#16835A", bg: "#E8F7F0" };
      if (item.type === "WITHDRAW_SUCCESS") return { color: "#3866A8", bg: "#EAF1FB" };
      return { color: PASTEL_PALETTE.accentDeep, bg: PASTEL_PALETTE.accentSoft };
    };
    const visual = getVisual();

    return (
        <TouchableOpacity
          style={[
            styles.notificationCard,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
            !item.isRead && styles.unreadCard,
          ]}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: visual.bg }]}>
            <Ionicons
              name={getIconName() as any}
              size={24}
              color={visual.color}
            />
          </View>
          <View style={styles.contentContainer}>
            <View style={styles.cardTopLine}>
              <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>{item.title}</Text>
              {!item.isRead ? <View style={styles.newBadge}><Text style={styles.newBadgeText}>Mới</Text></View> : null}
            </View>
            <Text style={[styles.message, { color: theme.textSecondary }]}>{item.message}</Text>
            <View style={styles.cardMeta}>
              <Ionicons name="time-outline" size={13} color={theme.textMuted} />
              <Text style={[styles.time, { color: theme.textMuted }]}>{timeAgo(item.createdAt)}</Text>
            </View>

            {isFundInvite && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.rejectBtn, actingId === item.id && styles.btnDisabled]}
                  onPress={() => handleOpenRejectModal(item)}
                  disabled={actingId === item.id}
                  activeOpacity={0.8}
                >
                  <Text style={styles.rejectText}>Từ chối</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.acceptBtn, actingId === item.id && styles.btnDisabled]}
                  onPress={() => handleOpenAcceptModal(item)}
                  disabled={actingId === item.id}
                  activeOpacity={0.8}
                >
                  {actingId === item.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.acceptText}>Chấp nhận</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={theme.primaryDark} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Thông báo</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {!loading && unreadCount > 0
                ? `${unreadCount} thông báo chưa đọc`
                : 'Bạn đã đọc tất cả thông báo'}
            </Text>
          </View>
          {!loading && unreadCount > 0 ? (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
              disabled={markingAll}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Đánh dấu tất cả thông báo là đã đọc"
            >
              {markingAll ? (
                <ActivityIndicator size="small" color="#7C3AED" />
              ) : (
                <Ionicons name="checkmark-done" size={17} color="#7C3AED" />
              )}
              <Text style={styles.markAllText}>Đọc tất cả</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </PastelHeaderShell>

      <View style={[styles.content, { backgroundColor: theme.bg }]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              {[0, 1, 2].map((item) => <View key={item} style={[styles.skeletonCard, { backgroundColor: theme.card }]} />)}
            </View>
          ) : loadError ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrap, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="cloud-offline-outline" size={30} color={theme.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Không tải được thông báo</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Kiểm tra kết nối rồi thử lại.</Text>
              <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.primary }]} onPress={loadNotifications}>
                <Text style={styles.retryText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContainer}
              stickySectionHeadersEnabled={false}
              showsVerticalScrollIndicator={false}
              renderSectionHeader={({ section }) => (
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{section.title}</Text>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={[styles.emptyIconWrap, { backgroundColor: theme.primarySoft }]}>
                    <Ionicons name="notifications-outline" size={32} color={theme.primary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Mọi thứ đã được cập nhật</Text>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Thông báo về giao dịch, ngân sách và lời mời sẽ xuất hiện tại đây.</Text>
                </View>
              }
            />
          )}
        </View>

        <ConfirmModal
          visible={acceptModalVisible}
          title="Xác nhận tham gia quỹ"
          message={`Bạn có đồng ý tham gia quỹ nhóm này không?`}
          iconName="people"
          confirmText="Tham gia ngay"
          cancelText="Để sau"
          isDestructive={false}
          onCancel={() => {
            setAcceptModalVisible(false);
            setSelectedNotification(null);
          }}
          onConfirm={handleConfirmAccept}
        />

        <ConfirmModal
          visible={rejectModalVisible}
          title="Từ chối lời mời?"
          message={`Bạn có chắc chắn muốn từ chối lời mời tham gia quỹ này?`}
          iconName="close-circle-outline"
          confirmText="Từ chối"
          cancelText="Quay lại"
          isDestructive
          onCancel={() => {
            setRejectModalVisible(false);
            setSelectedNotification(null);
          }}
          onConfirm={handleConfirmReject}
        />

        <SuccessModal
          visible={successModalVisible}
          title="Tham gia quỹ thành công!"
          message="Chúc mừng bạn đã gia nhập quỹ. Hãy cùng các thành viên tích lũy và quản lý tài chính hiệu quả nhé!"
          variant="pastel"
          onClose={() => {
            setSuccessModalVisible(false);
            if (joinedFundId) {
              router.push(`/funds/${joinedFundId}`);
            }
          }}
        />

        <ConfirmModal
          visible={errorModalVisible}
          title="Lỗi"
          message={errorMessage}
          iconName="alert-circle"
          iconColor={PASTEL_PALETTE.danger}
          confirmText="Đã hiểu"
          isDestructive={false}
          hideCancel={true}
          onConfirm={() => {
            setErrorModalVisible(false);
          }}
          onCancel={() => {
            setErrorModalVisible(false);
          }}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8FC',
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.76)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.35,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
  },
  markAllButton: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  markAllText: {
    color: '#7C3AED',
    fontSize: 11,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 9,
    paddingHorizontal: 4,
    fontSize: 12,
    fontWeight: '800',
  },
  notificationCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 18,
    marginBottom: 9,
    alignItems: "flex-start",
    borderWidth: 1,
  },
  unreadCard: {
    borderColor: '#DCC8F2',
    borderLeftWidth: 3,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  cardTopLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },
  newBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: '#F3E8FF',
  },
  newBadgeText: { color: '#7C3AED', fontSize: 9, fontWeight: '900' },
  message: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  time: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: "#EC4899",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  acceptText: {
    color: '#FFFFFF',
    fontWeight: "700",
    fontSize: 14,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: "#FEE2E2",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  rejectText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 10,
  },
  skeletonCard: {
    height: 92,
    borderRadius: 18,
    opacity: 0.72,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    paddingTop: 90,
  },
  emptyIconWrap: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
  },
  retryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
