import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  SafeAreaView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./AllServicesScreen.styles";
import Colors from "../../../shared/constants/Colors";
import { ALL_SERVICES_DATA } from "../data/allServices";

export const AllServicesScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  const handleServicePress = (service: any) => {
    // Navigate to specific service later
    console.log("Pressed service:", service.label);
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 12, paddingBottom: 12 }]}>
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Tất cả dịch vụ</Text>
          <Text style={styles.headerSubtitle}>Danh mục thông minh</Text>
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
    <View style={styles.safeArea}>
      {renderHeader()}
      
      <View style={styles.topActionsContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm dịch vụ..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredCategories.length > 0 ? (
          filteredCategories.map((group) => (
            <View key={group.id} style={styles.groupCard}>
              <View style={[styles.groupHeader, { backgroundColor: Colors.surface }]}>
                <Text style={[styles.groupTitle, { color: Colors.text }]}>
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
                    <View style={[styles.iconWrapper, { backgroundColor: service.bgColor }]}>
                      <Ionicons name={service.icon as any} size={24} color={service.color} />
                    </View>
                    <Text style={styles.itemLabel} numberOfLines={2}>
                      {service.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="search-outline" size={48} color="#D1D5DB" />
            <Text style={{ marginTop: 16, color: "#6B7280", fontSize: 16 }}>
              Không tìm thấy dịch vụ nào
            </Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default AllServicesScreen;
