import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../shared/constants/Colors';
import { useCategoryContext } from '../../../shared/contexts/CategoryContext';
import { IconPicker } from './IconPicker';
import { AddGroupModal } from './AddGroupModal';
import { ColorTheme, getAvailableCategoryColors, CATEGORY_COLORS } from '../constants/categoryTheme';
import { MAX_ITEMS_PER_GROUP, MAX_CATEGORY_NAME_LENGTH, MAX_CATEGORY_GROUPS } from '../constants/categoryLimits';

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
  const [selectedColor, setSelectedColor] = useState<ColorTheme | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    visible: false,
    title: "",
    message: "",
    type: "error"
  });

  const customGroups = useMemo(
    () => categories.filter((g) => !g.isDefault),
    [categories]
  );

  const availableColors = useMemo(() => {
    const used = customGroups.flatMap((g) => g.items.map((item) => item.color));
    return getAvailableCategoryColors(used);
  }, [customGroups]);

  const KEYWORD_MAP: Record<string, { groupName: string; icon: string }> = {
    'ăn': { groupName: 'Chi tiêu', icon: 'restaurant' },
    'uống': { groupName: 'Chi tiêu', icon: 'cafe' },
    'chợ': { groupName: 'Chi tiêu', icon: 'bag-handle' },
    'siêu thị': { groupName: 'Chi tiêu', icon: 'cart' },
    'chơi': { groupName: 'phát sinh', icon: 'game-controller' },
    'phim': { groupName: 'phát sinh', icon: 'film' },
    'du lịch': { groupName: 'phát sinh', icon: 'airplane' },
    'mua sắm': { groupName: 'phát sinh', icon: 'pricetag' },
    'quà': { groupName: 'phát sinh', icon: 'gift' },
    'xe': { groupName: 'phát sinh', icon: 'car' },
    'điện': { groupName: 'cố định', icon: 'bulb' },
    'nước': { groupName: 'cố định', icon: 'water' },
    'nhà': { groupName: 'cố định', icon: 'business' },
    'mạng': { groupName: 'cố định', icon: 'wifi' },
    'tiết kiệm': { groupName: 'Đầu tư', icon: 'wallet' },
    'đầu tư': { groupName: 'Đầu tư', icon: 'trending-up' },
    'chứng khoán': { groupName: 'Đầu tư', icon: 'bar-chart' },
    'vàng': { groupName: 'Đầu tư', icon: 'diamond' },
    'khác': { groupName: 'Khác', icon: 'cube' },
    'phí': { groupName: 'Khác', icon: 'receipt' },
    'phạt': { groupName: 'Khác', icon: 'warning' },
    'linh tinh': { groupName: 'Khác', icon: 'apps' },
  };

  React.useEffect(() => {
    if (!visible) {
      setIsGroupModalVisible(false);
      return;
    }
    setLabel('');
    setSelectedIcon('apps');
    const colors = getAvailableCategoryColors(
      categories
        .filter((g) => !g.isDefault)
        .flatMap((g) => g.items.map((item) => item.color))
    );
    setSelectedColor(colors[0] ?? null);
    if (defaultGroupId) {
      setSelectedGroup(defaultGroupId);
    } else if (customGroups.length > 0) {
      setSelectedGroup(customGroups[0].id);
    } else {
      setSelectedGroup('');
      // Chưa có nhóm → mở tạo nhóm ngay (tránh form đơ / không biết làm gì)
      const t = setTimeout(() => setIsGroupModalVisible(true), 350);
      return () => clearTimeout(t);
    }
  }, [visible, defaultGroupId]);

  React.useEffect(() => {
    if (!label.trim()) return;
    // Đang khóa nhóm từ màn danh mục thì không tự đổi nhóm theo từ khóa
    if (defaultGroupId) return;

    const lowerLabel = label.toLowerCase();
    for (const [keyword, suggestion] of Object.entries(KEYWORD_MAP)) {
      if (lowerLabel.includes(keyword)) {
        const matchedGroup = customGroups.find(c =>
          c.title.toLowerCase().includes(suggestion.groupName.toLowerCase())
        );
        if (matchedGroup) {
          setSelectedGroup(matchedGroup.id);
          setSelectedIcon(suggestion.icon);
          if (availableColors[0]) setSelectedColor(availableColors[0]);
        }
        break;
      }
    }
  }, [label, customGroups, availableColors, defaultGroupId]);

  const executeSave = async () => {
    if (!selectedColor) return;
    await addService(selectedGroup, {
      label: label.trim(),
      icon: selectedIcon,
      color: selectedColor.color,
      bgColor: selectedColor.bgColor,
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
    if (!selectedColor) {
      setAlertConfig({
        visible: true,
        title: "Hết màu danh mục",
        message: "Tất cả 24 màu danh mục đã được sử dụng. Hãy xóa danh mục cũ để lấy lại màu.",
        type: "error",
      });
      return;
    }

    const groupToSave = customGroups.find(c => c.id === selectedGroup);
    if (groupToSave && groupToSave.items.length >= MAX_ITEMS_PER_GROUP) {
      const names = groupToSave.items.map((i) => i.label).join(', ');
      setAlertConfig({
        visible: true,
        title: "Giới hạn danh mục",
        message: `Nhóm "${groupToSave.title}" đã đủ ${MAX_ITEMS_PER_GROUP} danh mục (${names}). Hãy xóa bớt hoặc chọn nhóm khác.`,
        type: "error",
      });
      return;
    }

    const normalizedLabel = trimmedLabel.toLowerCase();
    let duplicateGroupName = "";
    for (const group of customGroups) {
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
      const selectedGroupObj = customGroups.find(c => c.id === selectedGroup);
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
    <>
    <Modal
      visible={visible && !isGroupModalVisible}
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
            <View style={styles.labelRow}>
              <Text style={[styles.label, { marginTop: 0, marginBottom: 0 }]}>Tên danh mục</Text>
              <Text
                style={[
                  styles.charCount,
                  label.length >= MAX_CATEGORY_NAME_LENGTH && styles.charCountLimit,
                ]}
              >
                {label.length}/{MAX_CATEGORY_NAME_LENGTH}
              </Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder={`VD: Quà tặng, Vé máy bay... (tối đa ${MAX_CATEGORY_NAME_LENGTH} ký tự)`}
              placeholderTextColor={Colors.textMuted || '#9CA3AF'}
              value={label}
              onChangeText={(text) => setLabel(text.slice(0, MAX_CATEGORY_NAME_LENGTH))}
              maxLength={MAX_CATEGORY_NAME_LENGTH}
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
            ) : customGroups.length === 0 ? (
              <>
                <Text style={styles.label}>Nhóm</Text>
                <View style={styles.emptyGroupBox}>
                  <Text style={styles.emptyGroupText}>
                    Bạn cần tạo nhóm trước khi thêm danh mục.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyGroupBtn}
                    onPress={() => setIsGroupModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="layers-outline" size={18} color={Colors.white} />
                    <Text style={styles.emptyGroupBtnText}>Tạo nhóm đầu tiên</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>Chọn Nhóm</Text>
                <View style={styles.groupContainer}>
                  {customGroups.map((group) => {
                    const isSelected = selectedGroup === group.id;
                    return (
                      <TouchableOpacity
                        key={group.id}
                        style={[
                          styles.groupChip,
                          {
                            borderColor: group.color,
                            backgroundColor: isSelected ? group.color : `${group.color}18`,
                          },
                        ]}
                        onPress={() => setSelectedGroup(group.id)}
                      >
                        <View style={[styles.groupChipDot, { backgroundColor: group.color }]} />
                        <Text
                          style={[
                            styles.groupChipText,
                            { color: isSelected ? Colors.white : group.color },
                            isSelected && styles.groupChipTextSelected,
                          ]}
                        >
                          {group.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {customGroups.length < MAX_CATEGORY_GROUPS ? (
                    <TouchableOpacity
                      style={[styles.groupChip, styles.groupChipAdd]}
                      onPress={() => setIsGroupModalVisible(true)}
                    >
                      <Ionicons name="add" size={16} color={Colors.primary} />
                      <Text style={styles.groupChipAddText}>
                        Nhóm mới ({customGroups.length}/{MAX_CATEGORY_GROUPS})
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.groupChip, styles.groupChipAdd, { opacity: 0.5 }]}>
                      <Text style={styles.groupChipAddText}>
                        Đủ {MAX_CATEGORY_GROUPS}/{MAX_CATEGORY_GROUPS} nhóm
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            <Text style={styles.label}>Chọn Biểu Tượng</Text>
            <IconPicker
              selectedIcon={selectedIcon}
              onSelect={setSelectedIcon}
              color={selectedColor?.color || Colors.primary}
            />

            <Text style={styles.label}>Chọn Màu Sắc</Text>
            <Text style={styles.colorHint}>
              Mỗi danh mục một màu riêng ({availableColors.length}/{CATEGORY_COLORS.length} còn trống). Màu đã dùng sẽ bị ẩn.
            </Text>
            {availableColors.length === 0 ? (
              <Text style={styles.emptyColors}>Không còn màu danh mục trống</Text>
            ) : (
              <View style={styles.colorGrid}>
                {availableColors.map((item) => {
                  const active = selectedColor?.color === item.color;
                  return (
                    <TouchableOpacity
                      key={item.color}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: item.color },
                        active && styles.colorCircleSelected
                      ]}
                      onPress={() => setSelectedColor(item)}
                    >
                      {active && <Ionicons name="checkmark" size={20} color="#FFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

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
    </Modal>

      <AddGroupModal
        visible={visible && isGroupModalVisible}
        onClose={() => setIsGroupModalVisible(false)}
        onCreated={(groupId) => {
          if (groupId) setSelectedGroup(groupId);
          setIsGroupModalVisible(false);
        }}
      />
    </>
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  charCountLimit: {
    color: Colors.error,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  groupChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  groupChipText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  groupChipTextSelected: {
    color: Colors.white,
    fontWeight: '700',
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
  emptyGroupBox: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  emptyGroupText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  emptyGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  emptyGroupBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  createHint: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
    fontStyle: 'italic',
    marginTop: 4,
  },
  colorHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: -6,
    marginBottom: 12,
    lineHeight: 18,
  },
  emptyColors: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600',
    marginBottom: 20,
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
