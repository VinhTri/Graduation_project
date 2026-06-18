import React, { useState } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  TextInput, SafeAreaView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../../shared/constants/Colors';
import { useCategoryContext } from '../../../shared/contexts/CategoryContext';
import { AddCategoryModal } from '../components/AddCategoryModal';
import { styles } from './CategoriesScreen.styles';

export default function CategoriesScreen() {
  const router = useRouter();
  const { categories, removeService } = useCategoryContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);

  const handleDelete = (serviceId: string) => {
    removeService(serviceId);
  };

  const filteredCategories = categories.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.items.length > 0 || group.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={Colors.white} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Chọn danh mục</Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
        <Text style={styles.addButtonText}>Tạo mới</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderHeader()}
      
      <View style={styles.topActionsContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm"
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
              <View style={[styles.groupHeader, { backgroundColor: group.bgColor }]}>
                <Ionicons name={group.icon as any} size={20} color={group.color} />
                <Text style={[styles.groupTitle, { color: group.color }]}>
                  {group.title}
                </Text>
              </View>
              
              <View style={styles.gridContainer}>
                {group.items.map((service) => (
                  <TouchableOpacity key={service.id} style={styles.gridItem}>
                    <View style={styles.iconWrapper}>
                      <Ionicons name={service.icon as any} size={28} color={service.color} />
                      {service.id && String(service.id).startsWith("custom_") ? (
                        <TouchableOpacity 
                          style={styles.deleteBadge}
                          onPress={() => handleDelete(service.id)}
                        >
                          <Ionicons name="close-circle" size={20} color={Colors.error} />
                        </TouchableOpacity>
                      ) : null}
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
              Không tìm thấy danh mục nào
            </Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <AddCategoryModal 
        visible={isModalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </SafeAreaView>
  );
};
