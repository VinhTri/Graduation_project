import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { styles } from "./AllServicesScreen.styles";
import Colors from "../../../shared/constants/Colors";
import { ALL_SERVICES_DATA } from "../data/allServices";
import { useLanguage, useTheme } from "../../../shared/contexts/ThemeLanguageContext";

export const AllServicesScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isEn = language === 'en';

  const handleServicePress = (service: any) => {
    switch (service.id) {
      case "1": // Chuyển tiền
        router.push("/transfer");
        break;
      case "3": // Tiền Điện
        router.push("/invoice/service/electricity" as any);
        break;
      case "8": // Tiền Nước
        router.push("/invoice/service/water" as any);
        break;
      case "10": // Danh bạ
        router.push("/contacts");
        break;
      default:
        console.log("Pressed service:", service.label);
        break;
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 12, paddingBottom: 12, backgroundColor: theme.isDark ? theme.bgSoft : undefined }]}>
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>{isEn ? "All Services" : "Tất cả dịch vụ"}</Text>
          <Text style={styles.headerSubtitle}>{isEn ? "Smart Categories" : "Danh mục thông minh"}</Text>
        </View>
      </View>
      <View style={{ width: 24 }} />
    </View>
  );

  const filteredCategories = ALL_SERVICES_DATA.map(group => ({
    ...group,
    data: group.data.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.data.length > 0 || group.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      {renderHeader()}
      
      <View style={styles.topActionsContainer}>
        <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Ionicons name="search-outline" size={20} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder={isEn ? "Search services..." : "Tìm kiếm dịch vụ..."}
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      <ScrollView 
        style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredCategories.length > 0 ? (
          filteredCategories.map((group) => (
            <View key={group.id} style={[styles.groupCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.groupHeader, { backgroundColor: theme.bgSoft }]}>
                <Text style={[styles.groupTitle, { color: theme.textPrimary }]}>
                  {group.title}
                </Text>
              </View>
              
              <View style={styles.gridContainer}>
                {group.data.map((service) => (
                  <TouchableOpacity 
                    key={service.id} 
                    style={styles.gridItem}
                    activeOpacity={0.7}
                    onPress={() => handleServicePress(service)}
                  >
                    <View style={[styles.iconWrapper, { backgroundColor: theme.isDark ? theme.bgSoft : service.bgColor }]}>
                      <Ionicons name={service.icon as any} size={24} color={service.color} />
                    </View>
                    <Text style={[styles.itemLabel, { color: theme.textPrimary }]} numberOfLines={2}>
                      {service.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="search-outline" size={48} color={theme.textMuted} />
            <Text style={{ marginTop: 16, color: theme.textSecondary, fontSize: 16 }}>
              {isEn ? "No services found" : "Không tìm thấy dịch vụ nào"}
            </Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default AllServicesScreen;
