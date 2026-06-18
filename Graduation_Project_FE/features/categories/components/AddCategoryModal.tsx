import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../shared/constants/Colors';
import { useCategoryContext } from '../../../shared/contexts/CategoryContext';
import { IconPicker } from './IconPicker';

const AVAILABLE_COLORS = [
  { color: '#EF4444', bgColor: '#FEE2E2' },
  { color: '#F59E0B', bgColor: '#FEF3C7' },
  { color: '#10B981', bgColor: '#D1FAE5' },
  { color: '#3B82F6', bgColor: '#DBEAFE' },
  { color: '#8B5CF6', bgColor: '#EDE9FE' },
  { color: '#EC4899', bgColor: '#FCE7F3' },
  { color: '#0EA5E9', bgColor: '#E0F2FE' },
  { color: '#14B8A6', bgColor: '#CCFBF1' },
  { color: '#E11D48', bgColor: '#FFE4E6' },
  { color: '#F97316', bgColor: '#FFEDD5' },
  { color: '#06B6D4', bgColor: '#CFFAFE' },
  { color: '#64748B', bgColor: '#F1F5F9' },
];

type AddCategoryModalProps = {
  visible: boolean;
  onClose: () => void;
};

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ visible, onClose }) => {
  const { categories, addService } = useCategoryContext();

  const [label, setLabel] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("apps-outline");
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  // Mapping keywords to group names and suggested icons/colors
  const KEYWORD_MAP: Record<string, { groupName: string; icon: string; colorIndex: number }> = {
    'ăn': { groupName: 'Chi tiêu', icon: 'fast-food-outline', colorIndex: 9 }, // Orange
    'uống': { groupName: 'Chi tiêu', icon: 'cafe-outline', colorIndex: 9 },
    'chợ': { groupName: 'Chi tiêu', icon: 'basket-outline', colorIndex: 9 },
    'siêu thị': { groupName: 'Chi tiêu', icon: 'cart-outline', colorIndex: 9 },
    
    'chơi': { groupName: 'phát sinh', icon: 'game-controller-outline', colorIndex: 3 }, // Blue
    'phim': { groupName: 'phát sinh', icon: 'film-outline', colorIndex: 3 },
    'du lịch': { groupName: 'phát sinh', icon: 'airplane-outline', colorIndex: 6 },
    'mua sắm': { groupName: 'phát sinh', icon: 'shirt-outline', colorIndex: 5 },
    'quà': { groupName: 'phát sinh', icon: 'gift-outline', colorIndex: 5 },
    'xe': { groupName: 'phát sinh', icon: 'car-outline', colorIndex: 3 },
    
    'điện': { groupName: 'cố định', icon: 'bulb-outline', colorIndex: 0 }, // Red
    'nước': { groupName: 'cố định', icon: 'water-outline', colorIndex: 6 },
    'nhà': { groupName: 'cố định', icon: 'home-outline', colorIndex: 0 },
    'mạng': { groupName: 'cố định', icon: 'wifi-outline', colorIndex: 0 },
    
    'tiết kiệm': { groupName: 'Đầu tư', icon: 'wallet-outline', colorIndex: 2 }, // Green
    'đầu tư': { groupName: 'Đầu tư', icon: 'trending-up-outline', colorIndex: 2 },
    'chứng khoán': { groupName: 'Đầu tư', icon: 'bar-chart-outline', colorIndex: 2 },
    'vàng': { groupName: 'Đầu tư', icon: 'stop-circle-outline', colorIndex: 1 }, // Yellow
  };

  // Tự động chọn nhóm đầu tiên khi mở modal
  React.useEffect(() => {
    if (visible && categories.length > 0 && !selectedGroup) {
      setSelectedGroup(categories[0].id);
    }
  }, [visible, categories]);

  // Auto-suggest based on label
  React.useEffect(() => {
    if (!label.trim()) return;
    
    const lowerLabel = label.toLowerCase();
    for (const [keyword, suggestion] of Object.entries(KEYWORD_MAP)) {
      if (lowerLabel.includes(keyword)) {
        // Find matching group by name
        const matchedGroup = categories.find(c => c.title.toLowerCase().includes(suggestion.groupName.toLowerCase()));
        if (matchedGroup) {
          setSelectedGroup(matchedGroup.id);
          setSelectedIcon(suggestion.icon);
          setSelectedColorIndex(suggestion.colorIndex);
        }
        break; // Stop at first match
      }
    }
  }, [label]);

  const executeSave = async () => {
    const colorTheme = AVAILABLE_COLORS[selectedColorIndex];
    await addService(selectedGroup, {
      label: label.trim(),
      icon: selectedIcon,
      color: colorTheme.color,
      bgColor: colorTheme.bgColor,
    });

    setLabel("");
    onClose();
  };

  const handleSave = () => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      alert("Vui lòng nhập tên danh mục!");
      return;
    }
    if (!selectedGroup) {
      alert("Vui lòng chọn nhóm!");
      return;
    }

    // 1. CHUẨN LOGIC: Kiểm tra trùng lặp tên danh mục trên TOÀN BỘ hệ thống
    const normalizedLabel = trimmedLabel.toLowerCase();
    let duplicateGroupName = "";
    for (const group of categories) {
      const found = group.items.find(item => item.label.toLowerCase() === normalizedLabel);
      if (found) {
        duplicateGroupName = group.title;
        break;
      }
    }

    if (duplicateGroupName) {
      const errorMsg = `Tên danh mục "${trimmedLabel}" đã tồn tại trong nhóm "${duplicateGroupName}". Vui lòng đặt tên khác (VD: Du lịch gia đình)!`;
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        Alert.alert("Bị trùng tên", errorMsg);
      }
      return; // Chặn không cho lưu
    }

    // 2. Kiểm tra logic cảnh báo: Nếu từ khóa thuộc nhóm A nhưng người dùng chọn nhóm B
    const lowerLabel = trimmedLabel.toLowerCase();
    let suggestedGroupName = "";
    
    for (const [keyword, suggestion] of Object.entries(KEYWORD_MAP)) {
      if (lowerLabel.includes(keyword)) {
        suggestedGroupName = suggestion.groupName.toLowerCase();
        break;
      }
    }

    if (suggestedGroupName) {
      const selectedGroupObj = categories.find(c => c.id === selectedGroup);
      if (selectedGroupObj && !selectedGroupObj.title.toLowerCase().includes(suggestedGroupName)) {
        const msg = `Bạn đang lưu khoản "${label}" vào nhóm "${selectedGroupObj.title}". Bạn có chắc chắn không?`;
        if (Platform.OS === 'web') {
          const confirmed = window.confirm(msg);
          if (confirmed) {
            executeSave();
          }
        } else {
          Alert.alert(
            "Nhắc nhở logic",
            msg,
            [
              { text: "Sửa lại", style: "cancel" },
              { text: "Vẫn lưu", onPress: executeSave }
            ]
          );
        }
        return; // Dừng lại chờ user confirm
      }
    }

    // Nếu không có cảnh báo gì thì lưu luôn
    executeSave();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Thêm Danh Mục Mới</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Input Name */}
            <Text style={styles.label}>Tên danh mục</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên (VD: Quà tặng, Vé máy bay...)"
              value={label}
              onChangeText={setLabel}
              maxLength={30}
            />

            {/* Select Group */}
            <Text style={styles.label}>Chọn Nhóm</Text>
            <View style={styles.groupContainer}>
              {categories.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.groupChip,
                    selectedGroup === group.id && { backgroundColor: group.color, borderColor: group.color }
                  ]}
                  onPress={() => setSelectedGroup(group.id)}
                >
                  <Text style={[
                    styles.groupChipText,
                    selectedGroup === group.id && styles.groupChipTextSelected
                  ]}>
                    {group.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Icon Picker */}
            <Text style={styles.label}>Chọn Biểu Tượng</Text>
            <IconPicker
              selectedIcon={selectedIcon}
              onSelect={setSelectedIcon}
              color={AVAILABLE_COLORS[selectedColorIndex].color}
            />

            {/* Color Picker */}
            <Text style={styles.label}>Chọn Màu Sắc</Text>
            <View style={styles.colorGrid}>
              {AVAILABLE_COLORS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: item.color },
                    selectedColorIndex === index && styles.colorCircleSelected
                  ]}
                  onPress={() => setSelectedColorIndex(index)}
                >
                  {selectedColorIndex === index && (
                    <Ionicons name="checkmark" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Footer actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Lưu & Thêm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  groupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  groupChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupChipText: {
    color: Colors.text,
    fontSize: 14,
  },
  groupChipTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 16,
    marginBottom: 20,
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: Colors.text,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20, // Tăng khoảng trống cho iOS home indicator
  },
  saveBtn: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
});
