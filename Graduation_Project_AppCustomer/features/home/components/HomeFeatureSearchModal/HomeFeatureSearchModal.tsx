import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard,
  Animated,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLanguage, useTheme } from "@/shared/contexts/ThemeLanguageContext";
import { styles } from "./HomeFeatureSearchModal.styles";

type Props = {
  visible: boolean;
  onClose: () => void;
};

interface FeatureItem {
  id: string;
  title: string;
  subtitle: string;
  iconFamily: "Ionicons" | "MaterialCommunityIcons";
  icon: string;
  color: string;
  bgColor: string;
  route: string;
  category: string;
}

export const HomeFeatureSearchModal = ({ visible, onClose }: Props) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isEn = language === "en";
  const [searchQuery, setSearchQuery] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const features: FeatureItem[] = [
    // Ví & Tài chính
    {
      id: "wallet",
      title: isEn ? "Wallet" : "Ví tiền",
      subtitle: isEn ? "View balance & manage wallet" : "Xem số dư & quản lý ví",
      iconFamily: "Ionicons",
      icon: "wallet-outline",
      color: "#EC4899",
      bgColor: theme.isDark ? "#3A2033" : "#FDF2F8",
      route: "/(tabs)/wallet",
      category: isEn ? "Finance" : "Tài chính",
    },
    {
      id: "transfer",
      title: isEn ? "Transfer" : "Chuyển tiền",
      subtitle: isEn ? "Send money to friends" : "Gửi tiền cho bạn bè",
      iconFamily: "Ionicons",
      icon: "paper-plane-outline",
      color: "#8B5CF6",
      bgColor: theme.isDark ? "#2D2248" : "#F5F3FF",
      route: "/transfer",
      category: isEn ? "Finance" : "Tài chính",
    },
    {
      id: "top-up",
      title: isEn ? "Top Up" : "Nạp tiền",
      subtitle: isEn ? "Add funds to your wallet" : "Thêm tiền vào ví",
      iconFamily: "Ionicons",
      icon: "add-circle-outline",
      color: "#10B981",
      bgColor: theme.isDark ? "#1A2E28" : "#ECFDF5",
      route: "/wallet/top-up",
      category: isEn ? "Finance" : "Tài chính",
    },
    {
      id: "withdraw",
      title: isEn ? "Withdraw" : "Rút tiền",
      subtitle: isEn ? "Cash out from wallet" : "Rút tiền từ ví",
      iconFamily: "Ionicons",
      icon: "arrow-down-outline",
      color: "#F59E0B",
      bgColor: theme.isDark ? "#2E2A1A" : "#FFFBEB",
      route: "/wallet/withdraw",
      category: isEn ? "Finance" : "Tài chính",
    },
    {
      id: "history",
      title: isEn ? "Transaction History" : "Lịch sử giao dịch",
      subtitle: isEn ? "View past transactions" : "Xem giao dịch đã qua",
      iconFamily: "Ionicons",
      icon: "time-outline",
      color: "#6366F1",
      bgColor: theme.isDark ? "#1E2248" : "#EEF2FF",
      route: "/wallet/history",
      category: isEn ? "Finance" : "Tài chính",
    },
    {
      id: "finance-center",
      title: isEn ? "Finance Center" : "Trung tâm tài chính",
      subtitle: isEn ? "Financial overview & analytics" : "Tổng quan & phân tích tài chính",
      iconFamily: "Ionicons",
      icon: "stats-chart-outline",
      color: "#0EA5E9",
      bgColor: theme.isDark ? "#1A2530" : "#F0F9FF",
      route: "/finance-center",
      category: isEn ? "Finance" : "Tài chính",
    },
    // Quản lý
    {
      id: "budget",
      title: isEn ? "Budget" : "Ngân sách",
      subtitle: isEn ? "Set spending limits" : "Thiết lập giới hạn chi tiêu",
      iconFamily: "Ionicons",
      icon: "pie-chart-outline",
      color: "#EC4899",
      bgColor: theme.isDark ? "#3A2033" : "#FDF2F8",
      route: "/budget",
      category: isEn ? "Management" : "Quản lý",
    },
    {
      id: "funds",
      title: isEn ? "Funds" : "Quỹ",
      subtitle: isEn ? "Manage saving funds" : "Quản lý các quỹ tiết kiệm",
      iconFamily: "Ionicons",
      icon: "diamond-outline",
      color: "#7C3AED",
      bgColor: theme.isDark ? "#2D2248" : "#F5F3FF",
      route: "/(tabs)/funds",
      category: isEn ? "Management" : "Quản lý",
    },
    {
      id: "notebook",
      title: isEn ? "Notebook" : "Sổ tay",
      subtitle: isEn ? "Personal financial notes" : "Ghi chú tài chính cá nhân",
      iconFamily: "Ionicons",
      icon: "book-outline",
      color: "#14B8A6",
      bgColor: theme.isDark ? "#1A2E2E" : "#F0FDFA",
      route: "/(tabs)/notebook",
      category: isEn ? "Management" : "Quản lý",
    },
    {
      id: "categories",
      title: isEn ? "Categories" : "Danh mục",
      subtitle: isEn ? "Manage transaction categories" : "Quản lý danh mục giao dịch",
      iconFamily: "Ionicons",
      icon: "layers-outline",
      color: "#6366F1",
      bgColor: theme.isDark ? "#1E2248" : "#EEF2FF",
      route: "/categories",
      category: isEn ? "Management" : "Quản lý",
    },
    // Tiện ích
    {
      id: "invoice",
      title: isEn ? "Invoices" : "Hóa đơn",
      subtitle: isEn ? "Manage bills & invoices" : "Quản lý hóa đơn",
      iconFamily: "Ionicons",
      icon: "receipt-outline",
      color: "#10B981",
      bgColor: theme.isDark ? "#1A2E28" : "#ECFDF5",
      route: "/invoice",
      category: isEn ? "Utilities" : "Tiện ích",
    },
    {
      id: "contacts",
      title: isEn ? "Contacts" : "Danh bạ",
      subtitle: isEn ? "Manage your contacts" : "Quản lý danh bạ",
      iconFamily: "Ionicons",
      icon: "people-circle-outline",
      color: "#EC4899",
      bgColor: theme.isDark ? "#3A2033" : "#FDF2F8",
      route: "/contacts",
      category: isEn ? "Utilities" : "Tiện ích",
    },
    {
      id: "split-bill",
      title: isEn ? "Split Bill" : "Chia tiền",
      subtitle: isEn ? "Split expenses with friends" : "Chia sẻ chi phí với bạn bè",
      iconFamily: "MaterialCommunityIcons",
      icon: "account-cash-outline",
      color: "#7C3AED",
      bgColor: theme.isDark ? "#2D2248" : "#F5F3FF",
      route: "/split-bill",
      category: isEn ? "Utilities" : "Tiện ích",
    },
    {
      id: "notifications",
      title: isEn ? "Notifications" : "Thông báo",
      subtitle: isEn ? "View all notifications" : "Xem tất cả thông báo",
      iconFamily: "Ionicons",
      icon: "notifications-outline",
      color: "#F59E0B",
      bgColor: theme.isDark ? "#2E2A1A" : "#FFFBEB",
      route: "/notifications",
      category: isEn ? "Utilities" : "Tiện ích",
    },
    {
      id: "settings",
      title: isEn ? "Settings" : "Cài đặt",
      subtitle: isEn ? "App preferences & account" : "Tùy chỉnh ứng dụng & tài khoản",
      iconFamily: "Ionicons",
      icon: "settings-outline",
      color: "#64748B",
      bgColor: theme.isDark ? "#252830" : "#F8FAFC",
      route: "/settings",
      category: isEn ? "Utilities" : "Tiện ích",
    },
  ];

  const quickAccess = features.slice(0, 6);

  useEffect(() => {
    if (visible) {
      setSearchQuery("");
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleNavigate = (route: string) => {
    handleClose();
    setTimeout(() => {
      router.push(route as any);
    }, 200);
  };

  const filteredFeatures = searchQuery
    ? features.filter(
        (f) =>
          f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Group filtered results by category
  const groupedResults = filteredFeatures.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FeatureItem[]>);

  const renderIcon = (item: FeatureItem, size: number = 22) => {
    if (item.iconFamily === "MaterialCommunityIcons") {
      return (
        <MaterialCommunityIcons
          name={item.icon as any}
          size={size}
          color={item.color}
        />
      );
    }
    return <Ionicons name={item.icon as any} size={size} color={item.color} />;
  };

  const renderQuickAccessItem = (item: FeatureItem) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.quickAccessItem,
        { backgroundColor: item.bgColor },
      ]}
      activeOpacity={0.7}
      onPress={() => handleNavigate(item.route)}
    >
      <View style={[styles.quickAccessIcon, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)' }]}>
        {renderIcon(item, 20)}
      </View>
      <Text
        style={[styles.quickAccessText, { color: theme.textPrimary }]}
        numberOfLines={1}
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const renderFeatureRow = (item: FeatureItem) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.featureRow,
        { backgroundColor: theme.isDark ? theme.bgSoft : '#FFFFFF' },
      ]}
      activeOpacity={0.65}
      onPress={() => handleNavigate(item.route)}
    >
      <View style={[styles.featureRowIcon, { backgroundColor: item.bgColor }]}>
        {renderIcon(item, 22)}
      </View>
      <View style={styles.featureRowContent}>
        <Text style={[styles.featureRowTitle, { color: theme.textPrimary }]}>
          {item.title}
        </Text>
        <Text
          style={[styles.featureRowSubtitle, { color: theme.textSecondary }]}
          numberOfLines={1}
        >
          {item.subtitle}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={theme.textMuted}
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 8,
              backgroundColor: theme.isDark ? theme.bgSoft : '#FFFFFF',
              borderBottomColor: theme.divider,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleClose}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: theme.isDark ? theme.bg : "#F5F3FF",
                borderColor: theme.isDark ? theme.primary + "40" : "#E9D5FF",
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={theme.isDark ? theme.primary : "#A78BFA"}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder={
                isEn
                  ? "Search features, transactions..."
                  : "Tìm kiếm chức năng, giao dịch..."
              }
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.clearButtonInner,
                    { backgroundColor: theme.textMuted + "30" },
                  ]}
                >
                  <Ionicons name="close" size={14} color={theme.textSecondary} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Body */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          >
            {!searchQuery ? (
              <>
                {/* Quick Access Grid */}
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="flash"
                    size={16}
                    color={theme.isDark ? theme.primary : "#EC4899"}
                  />
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.textPrimary },
                    ]}
                  >
                    {isEn ? "Quick Access" : "Truy cập nhanh"}
                  </Text>
                </View>
                <View style={styles.quickAccessGrid}>
                  {quickAccess.map(renderQuickAccessItem)}
                </View>

                {/* All Features */}
                <View style={[styles.sectionHeader, { marginTop: 28 }]}>
                  <Ionicons
                    name="apps"
                    size={16}
                    color={theme.isDark ? theme.primary : "#7C3AED"}
                  />
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.textPrimary },
                    ]}
                  >
                    {isEn ? "All Features" : "Tất cả chức năng"}
                  </Text>
                </View>
                <View style={[styles.featureList, { backgroundColor: theme.isDark ? theme.bgSoft : '#FFFFFF', borderColor: theme.divider }]}>
                  {features.map((item, index) => (
                    <React.Fragment key={item.id}>
                      {renderFeatureRow(item)}
                      {index < features.length - 1 && (
                        <View
                          style={[
                            styles.divider,
                            { backgroundColor: theme.divider },
                          ]}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              </>
            ) : (
              <>
                {/* Search Results */}
                {Object.keys(groupedResults).length > 0 ? (
                  Object.entries(groupedResults).map(([category, items]) => (
                    <View key={category}>
                      <View style={[styles.sectionHeader, { marginTop: 4 }]}>
                        <Ionicons
                          name="bookmark"
                          size={14}
                          color={theme.isDark ? theme.primary : "#A78BFA"}
                        />
                        <Text
                          style={[
                            styles.sectionTitle,
                            { color: theme.textSecondary, fontSize: 13 },
                          ]}
                        >
                          {category}
                        </Text>
                      </View>
                      <View style={[styles.featureList, { backgroundColor: theme.isDark ? theme.bgSoft : '#FFFFFF', borderColor: theme.divider }]}>
                        {items.map((item, index) => (
                          <React.Fragment key={item.id}>
                            {renderFeatureRow(item)}
                            {index < items.length - 1 && (
                              <View
                                style={[
                                  styles.divider,
                                  { backgroundColor: theme.divider },
                                ]}
                              />
                            )}
                          </React.Fragment>
                        ))}
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <View
                      style={[
                        styles.emptyIcon,
                        {
                          backgroundColor: theme.isDark
                            ? theme.bgSoft
                            : "#F5F3FF",
                        },
                      ]}
                    >
                      <Ionicons
                        name="search"
                        size={32}
                        color={theme.textMuted}
                      />
                    </View>
                    <Text
                      style={[
                        styles.emptyTitle,
                        { color: theme.textPrimary },
                      ]}
                    >
                      {isEn ? "No results found" : "Không tìm thấy kết quả"}
                    </Text>
                    <Text
                      style={[
                        styles.emptySubtitle,
                        { color: theme.textMuted },
                      ]}
                    >
                      {isEn
                        ? "Try searching with different keywords"
                        : "Thử tìm kiếm với từ khóa khác"}
                    </Text>
                  </View>
                )}
              </>
            )}
          </Animated.View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default HomeFeatureSearchModal;
