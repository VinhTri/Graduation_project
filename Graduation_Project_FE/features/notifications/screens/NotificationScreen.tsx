import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Colors from "../../../shared/constants/Colors";
import { notificationService, NotificationResponse } from "../../../shared/api/services/notification.service";

import { Swipeable } from "react-native-gesture-handler";

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
      // Khi vừa vào màn hình, gọi API mark all as read
      await notificationService.readAll();
    } catch (error) {
      console.log("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.filter(n => n.id !== id));
      await notificationService.delete(id);
    } catch (error) {
      console.log("Error deleting notification:", error);
      // Rollback nếu cần (hiện tại đơn giản hóa)
      loadNotifications();
    }
  };

  const renderRightActions = (id: number) => {
    return (
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => handleDelete(id)}
      >
        <Ionicons name="trash-outline" size={24} color={Colors.white} />
        <Text style={styles.deleteText}>Xóa</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: NotificationResponse }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <View style={[styles.notificationCard, !item.isRead && styles.unreadCard]}>
        <View style={styles.iconContainer}>
          <Ionicons name="notifications" size={24} color={Colors.primary} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <View style={{ backgroundColor: Colors.primary, height: insets.top, position: 'absolute', top: 0, left: 0, right: 0 }} />
      
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông báo</Text>
        </View>
        <View style={styles.content}>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Bạn chưa có thông báo nào.</Text>
            </View>
          }
        />
      )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16, 
    paddingBottom: 40, 
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24, 
    overflow: "hidden",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
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
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: "#F0F9FF", // Màu xanh dương thật nhạt cho thông báo chưa đọc
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + "1A",
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
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginLeft: 8,
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
  deleteButton: {
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginBottom: 12,
    borderRadius: 12,
    marginLeft: 8,
  },
  deleteText: {
    color: Colors.white,
    fontWeight: "600",
    marginTop: 4,
  }
});
