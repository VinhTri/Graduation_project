import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./HomeHeader.styles";
import Colors from "@/shared/constants/Colors";
import { useRouter } from "expo-router";
import { notificationService } from "@/shared/api/services/notification.service";
import { useFocusEffect } from "@react-navigation/native";

export const HomeHeader = () => {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      loadUnreadCount();
    }, [])
  );

  const loadUnreadCount = async () => {
    try {
      const res: any = await notificationService.getUnreadCount();
      console.log("🚀 ~ loadUnreadCount ~ res:", res);
      if (res && res.success !== undefined) {
         setUnreadCount(Number(res.data));
      }
    } catch (error) {
      console.log("Error loading unread count", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search and Notification Row */}
      <View style={styles.topRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Tìm kiếm giao dịch, quỹ..."
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
          />
        </View>
        <TouchableOpacity 
          style={styles.notificationBtn} 
          activeOpacity={0.7}
          onPress={() => router.push("/notifications")}
        >
          <Ionicons name="notifications-outline" size={22} color={Colors.white} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={{ color: 'white', fontSize: 8, fontWeight: 'bold' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={styles.actionItem} activeOpacity={0.7} onPress={() => router.push("/wallet/action?initialTab=topup")}>
          <View style={[styles.iconWrapper, { backgroundColor: "#E0F2FE" }]}>
             <Ionicons name="swap-vertical" size={24} color="#0284C7" />
          </View>
          <Text style={styles.actionLabel}>Nạp/Rút</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} activeOpacity={0.7}>
          <View style={[styles.iconWrapper, { backgroundColor: "#DBEAFE" }]}>
             <Ionicons name="paper-plane-outline" size={24} color="#2563EB" />
          </View>
          <Text style={styles.actionLabel}>Chuyển tiền</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} activeOpacity={0.7}>
          <View style={[styles.iconWrapper, { backgroundColor: "#F3E8FF" }]}>
             <Ionicons name="qr-code-outline" size={24} color="#9333EA" />
          </View>
          <Text style={styles.actionLabel}>Quét mã QR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} activeOpacity={0.7}>
          <View style={[styles.iconWrapper, { backgroundColor: "#FCE7F3" }]}>
             <Ionicons name="grid-outline" size={24} color="#E11D48" />
          </View>
          <Text style={styles.actionLabel}>Ví tiện ích</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeHeader;
