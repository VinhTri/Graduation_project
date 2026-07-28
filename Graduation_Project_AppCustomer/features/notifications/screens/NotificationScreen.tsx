import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../../../shared/constants/Colors";

const PALETTE = {
  headerStart: '#FFD6EC',
  headerMid: '#E9D5FF',
  headerEnd: '#BFDBFE',
};
import {
  notificationService,
  NotificationResponse,
} from "../../../shared/api/services/notification.service";
import { fundService } from "../../../shared/api/services/fundService";
import { fundStore } from "../../funds/store/fundStore";

import { Swipeable, RectButton } from "react-native-gesture-handler";

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
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res: any = await notificationService.getAll();
      if (res && res.success) {
        setNotifications(res.data || []);
      } else {
        setNotifications([]);
      }
      await notificationService.readAll();
    } catch (error) {
      console.log("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await notificationService.delete(id);
    } catch (error) {
      console.log("Error deleting notification:", error);
      loadNotifications();
    }
  };

  const handleAcceptFundInvite = async (item: NotificationResponse) => {
    if (!item.relatedId) return;
    setActingId(item.id);
    try {
      await fundService.acceptInvite(item.relatedId);
      await fundStore.refreshFunds().catch(() => {});
      setNotifications((prev) => prev.filter((n) => n.id !== item.id));
      await notificationService.delete(item.id).catch(() => {});
      Alert.alert("Thành công", "Bạn đã tham gia quỹ.");
      router.push(`/funds/${item.relatedId}`);
    } catch (err: any) {
      Alert.alert("Không thể tham gia", err?.message || "Vui lòng thử lại");
    } finally {
      setActingId(null);
    }
  };

  const handleRejectFundInvite = async (item: NotificationResponse) => {
    if (!item.relatedId) return;
    setActingId(item.id);
    try {
      await fundService.rejectInvite(item.relatedId);
      setNotifications((prev) => prev.filter((n) => n.id !== item.id));
      await notificationService.delete(item.id).catch(() => {});
    } catch (err: any) {
      Alert.alert("Lỗi", err?.message || "Không thể từ chối lời mời");
    } finally {
      setActingId(null);
    }
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
    id: number
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.88, 1],
      extrapolate: 'clamp',
    });
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.swipeDeleteActionWrap,
          { transform: [{ scale }, { translateX }] },
        ]}
      >
        <RectButton
          style={styles.swipeDeleteButton}
          onPress={() => handleDelete(id)}
        >
          <LinearGradient
            colors={['#FCA5A5', '#EF4444', '#DC2626']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.swipeDeleteGradient}
          >
            <View style={styles.swipeDeleteIconCircle}>
              <Ionicons name="trash" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.swipeDeleteText}>Xóa</Text>
          </LinearGradient>
        </RectButton>
      </Animated.View>
    );
  };

  const renderItem = ({ item }: { item: NotificationResponse }) => {
    const isFundInvite = item.type === "FUND_INVITE" && !!item.relatedId;
    const busy = actingId === item.id;

    return (
      <Swipeable 
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
        overshootRight={false}
        friction={2}
        rightThreshold={36}
      >
        <View style={[styles.notificationCard, !item.isRead && styles.unreadCard]}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={isFundInvite ? "people" : "notifications"}
              size={24}
              color="#EC4899"
            />
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>

            {isFundInvite && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.rejectBtn, busy && styles.btnDisabled]}
                  disabled={busy}
                  onPress={() => handleRejectFundInvite(item)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.rejectText}>Từ chối</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.acceptBtn, busy && styles.btnDisabled]}
                  disabled={busy}
                  onPress={() => handleAcceptFundInvite(item)}
                  activeOpacity={0.85}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.acceptText}>Chấp nhận</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={[PALETTE.headerStart, PALETTE.headerMid, PALETTE.headerEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.headerDecorCircleLarge} />
          <View style={styles.headerDecorCircleSmall} />

          <View style={styles.headerTopRow}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                <Ionicons name="chevron-back-outline" size={22} color="#7C3AED" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Thông báo</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#EC4899" />
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="notifications-off-outline"
                    size={48}
                    color={Colors.textMuted}
                  />
                  <Text style={styles.emptyText}>Bạn chưa có thông báo nào.</Text>
                </View>
              }
            />
          )}
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerWrap: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    marginBottom: 4,
  },
  header: {
    paddingBottom: 18,
    paddingHorizontal: 24,
  },
  headerDecorCircleLarge: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    top: -24,
    right: -20,
  },
  headerDecorCircleSmall: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    bottom: 18,
    left: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: '#5B21B6',
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: "#F0F9FF",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EC48991A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: Colors.textMuted,
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
    color: Colors.white,
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
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EC4899",
    marginLeft: 8,
    marginTop: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textMuted,
  },
  swipeDeleteActionWrap: {
    width: 90,
    marginLeft: 8,
    marginBottom: 12,
  },
  swipeDeleteButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#DC2626',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  swipeDeleteGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 14,
    borderRadius: 16,
    minHeight: '100%',
  },
  swipeDeleteIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  swipeDeleteText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
