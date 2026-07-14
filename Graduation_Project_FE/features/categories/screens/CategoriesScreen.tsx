import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Alert,
  Modal
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';
import Colors from '../../../shared/constants/Colors';
import { useCategoryContext } from '../../../shared/contexts/CategoryContext';
import { AddCategoryModal } from '../components/AddCategoryModal';
import { styles } from './CategoriesScreen.styles';
import { ConfirmModal } from '../../../shared/components';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { categories, removeService } = useCategoryContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showSystemCategoryWarning, setShowSystemCategoryWarning] = useState(false);
  
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<any>(null);

  // Coachmark State
  const [showCoachmark, setShowCoachmark] = useState(false);

  React.useEffect(() => {
    const checkCoachmark = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem('hasSeenCategoryCoachmark');
        if (hasSeen !== 'true') {
          setShowCoachmark(true);
        }
      } catch (e) {
        // ignore
      }
    };
    checkCoachmark();
  }, []);

  const dismissCoachmark = async () => {
    setShowCoachmark(false);
    try {
      await AsyncStorage.setItem('hasSeenCategoryCoachmark', 'true');
    } catch (e) {
      // ignore
    }
  };

  const handleLongPress = (service: any, groupId: string) => {
    // Jackson serialize boolean isCustom thành 'custom', nên ta check cả 2.
    const isCustomCategory = service.isCustom === true || service.custom === true;
    
    if (isCustomCategory) {
      setSelectedService({ ...service, groupId });
      setShowOptions(true);
    } else {
      setShowSystemCategoryWarning(true);
    }
  };

  const handleEditOption = () => {
    setShowOptions(false);
    setItemToEdit(selectedService);
    setModalVisible(true);
  };

  const handleDeleteOption = () => {
    setShowOptions(false);
    setItemToDelete(selectedService?.id);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await removeService(itemToDelete);
      setItemToDelete(null);
    }
  };

  const filteredCategories = categories.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.items.length > 0 || group.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 12, paddingBottom: 12 }]}>
      <View style={styles.leftSection}>
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/home'); // Trở về trang chủ Home nếu không có lịch sử
            }
          }} 
          style={styles.backButton} 
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Chọn danh mục</Text>
          <Text style={styles.headerSubtitle}>Quản lý phân loại</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => {
          setItemToEdit(null);
          setModalVisible(true);
        }}
      >
        <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
        <Text style={styles.addButtonText}>Tạo mới</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.safeArea}>
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
        {/* --- COACHMARK / TOOLTIP BANNER --- */}
        {showCoachmark && (
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#E0F2FE', // Light blue background
            marginHorizontal: 20,
            marginBottom: 20,
            padding: 16,
            borderRadius: 16,
            alignItems: 'flex-start',
            borderWidth: 1,
            borderColor: '#BAE6FD'
          }}>
            <Text style={{ fontSize: 20, marginRight: 12 }}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0369A1', marginBottom: 4 }}>
                Mẹo sử dụng
              </Text>
              <Text style={{ fontSize: 13, color: '#0C4A6E', lineHeight: 18 }}>
                Nhấn giữ (Long press) vào danh mục bạn tự tạo để mở menu tùy chọn <Text style={{ fontWeight: 'bold' }}>Chỉnh sửa</Text> hoặc <Text style={{ fontWeight: 'bold' }}>Xóa</Text>.
              </Text>
            </View>
            <TouchableOpacity onPress={dismissCoachmark} style={{ padding: 4, marginLeft: 8 }}>
              <Ionicons name="close" size={20} color="#0369A1" />
            </TouchableOpacity>
          </View>
        )}

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
                  <TouchableOpacity 
                    key={service.id} 
                    style={styles.gridItem}
                    onLongPress={() => handleLongPress(service, group.id)}
                    delayLongPress={300}
                    activeOpacity={0.7}
                  >
                    <View style={styles.iconWrapper}>
                      <Ionicons name={service.icon as any} size={28} color={service.color} />
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
        onClose={() => {
          setModalVisible(false);
          setItemToEdit(null);
        }} 
        initialData={itemToEdit}
      />

      <ConfirmModal
        visible={!!itemToDelete}
        title="Xóa danh mục"
        message="Bạn có chắc chắn muốn xóa danh mục này? Lịch sử các giao dịch cũ vẫn sẽ được giữ nguyên."
        iconName="trash-outline"
        iconColor={Colors.error}
        confirmText="Xóa"
        cancelText="Hủy"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

      <ConfirmModal
        visible={showSystemCategoryWarning}
        title="Không thể xóa"
        message="Danh mục mặc định của hệ thống không thể bị xóa hoặc thay đổi. Vui lòng chọn danh mục bạn tự tạo."
        iconName="information-circle-outline"
        iconColor={Colors.primary}
        confirmText="Đã hiểu"
        isDestructive={false}
        hideCancel={true}
        onConfirm={() => setShowSystemCategoryWarning(false)}
        onCancel={() => setShowSystemCategoryWarning(false)}
      />

      {/* Tùy chọn Modal (Action Sheet cho Web & Mobile) */}
      <Modal visible={showOptions} transparent animationType="fade" onRequestClose={() => setShowOptions(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', backgroundColor: '#FFF', borderRadius: 24, padding: 24, alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary + '1A', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="settings-outline" size={32} color={Colors.primary} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 12, textAlign: 'center' }}>Tùy chọn danh mục</Text>
            <Text style={{ fontSize: 15, color: Colors.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
              Bạn muốn làm gì với danh mục "{selectedService?.label}"?
            </Text>
            <View style={{ width: '100%', gap: 12 }}>
              <TouchableOpacity 
                style={{ width: '100%', paddingVertical: 14, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center' }} 
                onPress={handleEditOption}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFF' }}>Chỉnh sửa</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ width: '100%', paddingVertical: 14, borderRadius: 16, backgroundColor: Colors.error, alignItems: 'center' }} 
                onPress={handleDeleteOption}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFF' }}>Xóa danh mục</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ width: '100%', paddingVertical: 14, borderRadius: 16, backgroundColor: Colors.background, alignItems: 'center' }} 
                onPress={() => setShowOptions(false)}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text }}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};
