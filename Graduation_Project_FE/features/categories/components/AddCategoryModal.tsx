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
import { AddGroupModal } from './AddGroupModal';
import { AVAILABLE_COLORS } from '../constants/categoryTheme';
import { MAX_ITEMS_PER_GROUP } from '../constants/categoryLimits';

interface AlertConfig {
  visible: boolean;
  title: string;
  message: string;
  type: 'error' | 'warning';
  onConfirm?: () => void;
  onCancel?: () => void;
}

type AddCategoryModalProps = {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  defaultGroupId?: string;
};

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ visible, onClose, onBack, defaultGroupId }) => {
  const { categories, addService } = useCategoryContext();

  const [label, setLabel] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("apps");
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    visible: false,
    title: "",
    message: "",
    type: "error"
  });

  const KEYWORD_MAP: Record<string, { groupName: string; icon: string; colorIndex: number }> = {
    'ăn': { groupName: 'Chi tiêu', icon: 'restaurant', colorIndex: 9 },
    'uống': { groupName: 'Chi tiêu', icon: 'cafe', colorIndex: 9 },
    'chợ': { groupName: 'Chi tiêu', icon: 'bag-handle', colorIndex: 9 },
    'siêu thị': { groupName: 'Chi tiêu', icon: 'cart', colorIndex: 9 },
    'chơi': { groupName: 'phát sinh', icon: 'game-controller', colorIndex: 3 },
    'phim': { groupName: 'phát sinh', icon: 'film', colorIndex: 3 },
    'du lịch': { groupName: 'phát sinh', icon: 'airplane', colorIndex: 6 },
    'mua sắm': { groupName: 'phát sinh', icon: 'pricetag', colorIndex: 5 },
    'quà': { groupName: 'phát sinh', icon: 'gift', colorIndex: 5 },
    'xe': { groupName: 'phát sinh', icon: 'car', colorIndex: 3 },
    'điện': { groupName: 'cố định', icon: 'bulb', colorIndex: 0 },
    'nước': { groupName: 'cố định', icon: 'water', colorIndex: 6 },
    'nhà': { groupName: 'cố định', icon: 'business', colorIndex: 0 },
    'mạng': { groupName: 'cố định', icon: 'wifi', colorIndex: 0 },
    'tiết kiệm': { groupName: 'Đầu tư', icon: 'wallet', colorIndex: 2 },
    'đầu tư': { groupName: 'Đầu tư', icon: 'trending-up', colorIndex: 2 },
    'chứng khoán': { groupName: 'Đầu tư', icon: 'bar-chart', colorIndex: 2 },
    'vàng': { groupName: 'Đầu tư', icon: 'diamond', colorIndex: 1 },
    'khác': { groupName: 'Khác', icon: 'cube', colorIndex: 11 },
    'phí': { groupName: 'Khác', icon: 'receipt', colorIndex: 11 },
    'phạt': { groupName: 'Khác', icon: 'warning', colorIndex: 11 },
    'linh tinh': { groupName: 'Khác', icon: 'apps', colorIndex: 11 },
  };

  React.useEffect(() => {
    if (visible) {
      setLabel("");
      setSelectedIcon("apps");
      setSelectedColorIndex(0);
      if (defaultGroupId) {
        setSelectedGroup(defaultGroupId);
      } else if (categories.length > 0) {
        setSelectedGroup(categories[0].id);
      }
    }
  }, [visible, defaultGroupId, categories]);

  React.useEffect(() => {
    if (!label.trim()) return;

    const lowerLabel = label.toLowerCase();
    for (const [keyword, suggestion] of Object.entries(KEYWORD_MAP)) {
      if (lowerLabel.includes(keyword)) {
        const matchedGroup = categories.find(c => c.title.toLowerCase().includes(suggestion.groupName.toLowerCase()));
        if (matchedGroup) {
          setSelectedGroup(matchedGroup.id);
          setSelectedIcon(suggestion.icon);
          setSelectedColorIndex(suggestion.colorIndex);
        }
        break;
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

    const groupToSave = categories.find(c => c.id === selectedGroup);
    if (groupToSave && groupToSave.items.length >= MAX_ITEMS_PER_GROUP) {
      setAlertConfig({
        visible: true,
        title: "Giới hạn danh mục",
        message: `Mỗi nhóm chỉ được tối đa ${MAX_ITEMS_PER_GROUP} danh mục!`,
        type: "error",
      });
      return;
    }

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
      setAlertConfig({
        visible: true,
        title: "Trùng lặp tên",
        message: `Tên danh mục "${trimmedLabel}" đã tồn tại trong nhóm "${duplicateGroupName}". Vui lòng đặt tên khác hoặc xóa danh mục cũ trước.`,
        type: "error",
      });
      return;
    }

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
        const msg = `Bạn đang lưu khoản "${trimmedLabel}" vào nhóm "${selectedGroupObj.title}". Bạn có chắc chắn không?`;
        setAlertConfig({
          visible: true,
          title: "Nhắc nhở logic",
          message: msg,
          type: "warning",
          onConfirm: executeSave,
          onCancel: () => {}
        });
        return;
      }
    }

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
            {onBack ? (
              <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={Colors.text} />
              </TouchableOpacity>
            ) : <View style={{ width: 32 }} />}
            <Text style={[styles.headerTitle, { flex: 1, textAlign: 'center' }]}>
              Thêm Danh Mục Mới
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Tên danh mục</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên (VD: Quà tặng, Vé máy bay...)"
              placeholderTextColor={Colors.textMuted || '#9CA3AF'}
              value={label}
              onChangeText={setLabel}
              maxLength={30}
            />

            {defaultGroupId ? (
              <>
                <Text style={styles.label}>Nhóm</Text>
                <View style={styles.lockedGroupRow}>
                  <Ionicons
                    name={(categories.find(c => c.id === defaultGroupId)?.icon as any) || 'layers'}
                    size={18}
                    color={categories.find(c => c.id === defaultGroupId)?.color || Colors.primary}
                  />
                  <Text style={styles.lockedGroupText}>
                    {categories.find(c => c.id === defaultGroupId)?.title || 'Nhóm đã chọn'}
                  </Text>
                </View>
              </>
            ) : (
              <>
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
                  <TouchableOpacity
                    style={[styles.groupChip, styles.groupChipAdd]}
                    onPress={() => setIsGroupModalVisible(true)}
                  >
                    <Ionicons name="add" size={16} color={Colors.primary} />
                    <Text style={styles.groupChipAddText}>Nhóm mới</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <Text style={styles.label}>Chọn Biểu Tượng</Text>
            <IconPicker
              selectedIcon={selectedIcon}
              onSelect={setSelectedIcon}
              color={AVAILABLE_COLORS[selectedColorIndex].color}
            />

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

            <Text style={styles.createHint}>
              Sau khi tạo, danh mục không thể chỉnh sửa. Muốn đổi tên/icon thì xóa và tạo lại.
            </Text>

            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Lưu & Thêm</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal transparent visible={alertConfig.visible} animationType="fade">
          <View style={styles.alertOverlay}>
            <View style={styles.alertBox}>
              <View style={[styles.alertIconBg, { backgroundColor: alertConfig.type === 'error' ? '#FEE2E2' : '#FEF3C7' }]}>
                <Ionicons
                  name={alertConfig.type === 'error' ? "close-circle" : "warning"}
                  size={36}
                  color={alertConfig.type === 'error' ? "#EF4444" : "#F59E0B"}
                />
              </View>
              <Text style={styles.alertTitle}>{alertConfig.title}</Text>
              <Text style={styles.alertMessage}>{alertConfig.message}</Text>

              <View style={styles.alertActions}>
                {alertConfig.type === 'warning' && (
                  <TouchableOpacity
                    style={[styles.alertBtn, styles.alertCancelBtn]}
                    onPress={() => {
                      setAlertConfig(prev => ({...prev, visible: false}));
                      if (alertConfig.onCancel) alertConfig.onCancel();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.alertCancelText}>Sửa lại</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.alertBtn, alertConfig.type === 'error' ? styles.alertErrorBtn : styles.alertConfirmBtn]}
                  onPress={() => {
                    setAlertConfig(prev => ({...prev, visible: false}));
                    if (alertConfig.onConfirm) alertConfig.onConfirm();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.alertConfirmText, alertConfig.type === 'error' && { color: '#EF4444' }]}>
                    {alertConfig.type === 'error' ? 'Đã hiểu' : 'Vẫn lưu'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>

      <AddGroupModal
        visible={isGroupModalVisible}
        onClose={() => setIsGroupModalVisible(false)}
        onCreated={(groupId) => {
          if (groupId) setSelectedGroup(groupId);
        }}
      />
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
  backBtn: {
    padding: 4,
    width: 32,
    alignItems: 'center',
  },
  closeBtn: {
    padding: 4,
    width: 32,
    alignItems: 'center',
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
    color: Colors.text,
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
  groupChipAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  groupChipAddText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  lockedGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  lockedGroupText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  createHint: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
    fontStyle: 'italic',
    marginTop: 4,
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
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
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
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertBox: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  alertIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  alertBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCancelBtn: {
    backgroundColor: Colors.surface,
  },
  alertCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  alertConfirmBtn: {
    backgroundColor: Colors.primary,
  },
  alertErrorBtn: {
    backgroundColor: '#FEE2E2',
  },
  alertConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
