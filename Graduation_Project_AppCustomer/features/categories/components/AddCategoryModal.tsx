import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../shared/constants/Colors';
import { PASTEL_PALETTE } from '../../../shared/constants/PastelPalette';
import { useCategoryContext } from '../../../shared/contexts/CategoryContext';
import { IconPicker } from './IconPicker';
import { AddGroupModal } from './AddGroupModal';
import { Toast } from '../../../shared/components/Toast/Toast';
import { ColorTheme, getAvailableCategoryColors, CATEGORY_COLORS } from '../constants/categoryTheme';
import { MAX_ITEMS_PER_GROUP, MAX_CATEGORY_NAME_LENGTH, MAX_CATEGORY_GROUPS } from '../constants/categoryLimits';

import { ServiceItem } from '../data/mockData';

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
  onCreated?: (category: ServiceItem, groupName: string) => void;
  defaultGroupId?: string;
};

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  visible,
  onClose,
  onBack,
  onCreated,
  defaultGroupId,
}) => {
  const { categories, addService } = useCategoryContext();

  const [label, setLabel] = useState("");
  const [nameError, setNameError] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("apps");
  const [selectedColor, setSelectedColor] = useState<ColorTheme | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [isSelfHidden, setIsSelfHidden] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type?: 'error' | 'success' | 'info' }>({
    visible: false,
    message: '',
    type: 'error',
  });
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
    // Quét toàn bộ các nhóm (kể cả nhóm mặc định), lấy màu của các danh mục do user tự tạo (isCustom = true)
    const used = categories.flatMap((g) => 
      g.items.filter((item: any) => item.isCustom || item.custom).map((item) => item.color)
    );
    return getAvailableCategoryColors(used);
  }, [categories]);

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
      setIsSelfHidden(false);
      setNameError('');
      setToast({ visible: false, message: '', type: 'error' });
      return;
    }
    setLabel('');
    setNameError('');
    setSelectedIcon('apps');
    const colors = getAvailableCategoryColors(
      categories.flatMap((g) => 
        g.items.filter((item: any) => item.isCustom || item.custom).map((item) => item.color)
      )
    );
    setSelectedColor(colors[0] ?? null);
    if (defaultGroupId) {
      setSelectedGroup(defaultGroupId);
    } else if (customGroups.length > 0) {
      setSelectedGroup(customGroups[0].id);
    } else {
      setSelectedGroup('');
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
          break;
        }
      }
    }
  }, [label, customGroups, availableColors, defaultGroupId]);

  const handleOpenAddGroup = () => {
    setIsSelfHidden(true);
    setTimeout(() => {
      setIsGroupModalVisible(true);
    }, 300);
  };

  const handleCloseAddGroup = (newGroupId?: string) => {
    setIsGroupModalVisible(false);
    setTimeout(() => {
      setIsSelfHidden(false);
      if (newGroupId) {
        setSelectedGroup(newGroupId);
      }
    }, 300);
  };

  const executeSave = async () => {
    if (!selectedColor) return;
    try {
      const createdItem = await addService(selectedGroup, {
        label: label.trim(),
        icon: selectedIcon,
        color: selectedColor.color,
        bgColor: selectedColor.bgColor,
      });

      const groupObj = customGroups.find(c => c.id === selectedGroup);
      const groupName = groupObj?.title || '';

      setLabel("");
      setNameError("");

      if (onCreated && createdItem) {
        onCreated(
          {
            id: String(createdItem.id),
            label: createdItem.label || label.trim(),
            icon: createdItem.icon || selectedIcon,
            color: createdItem.color || selectedColor.color,
            bgColor: createdItem.bgColor || selectedColor.bgColor,
            isCustom: true,
          },
          groupName
        );
      } else {
        onClose();
      }
    } catch (error: any) {
      setToast({
        visible: true,
        message: error?.message || 'Không thể tạo danh mục',
        type: 'error',
      });
    }
  };

  const previewItemColor = selectedColor?.color || PASTEL_PALETTE.accentDeep;
  const previewItemBg = selectedColor?.bgColor || PASTEL_PALETTE.accentSoft;
  const currentGroupName = customGroups.find(c => c.id === selectedGroup)?.title || (defaultGroupId ? categories.find(c => c.id === defaultGroupId)?.title : '');

  const handleSave = () => {
    if (customGroups.length === 0 && !defaultGroupId) {
      setToast({
        visible: true,
        message: 'Bạn cần tạo nhóm danh mục trước!',
        type: 'info',
      });
      handleOpenAddGroup();
      return;
    }

    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      setNameError('Vui lòng nhập tên danh mục');
      return;
    }
    if (!selectedGroup) {
      setToast({
        visible: true,
        message: 'Vui lòng chọn một nhóm danh mục',
        type: 'error',
      });
      return;
    }
    if (!selectedColor) {
      setToast({
        visible: true,
        message: 'Vui lòng chọn một màu sắc',
        type: 'error',
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

    executeSave();
  };

  return (
    <>
      <Modal
        visible={visible && !isSelfHidden && !isGroupModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.overlay}
        >
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              {onBack ? (
                <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
                  <Ionicons name="arrow-back" size={24} color={PASTEL_PALETTE.title} />
                </TouchableOpacity>
              ) : <View style={{ width: 32 }} />}
              <Text style={styles.headerTitle}>
                Thêm Danh Mục Mới
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={PASTEL_PALETTE.title} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Live Preview Card */}
              <View style={styles.previewCard}>
                <View style={styles.previewContent}>
                  <View style={[styles.previewIconBox, { backgroundColor: previewItemBg }]}>
                    <Ionicons
                      name={selectedIcon as keyof typeof Ionicons.glyphMap}
                      size={28}
                      color={previewItemColor}
                    />
                  </View>
                  <View style={styles.previewTextCol}>
                    <Text style={styles.previewLabel} numberOfLines={1}>
                      {label.trim() || 'Tên danh mục mới'}
                    </Text>
                    <View style={styles.previewGroupBadge}>
                      <Ionicons
                        name="folder-outline"
                        size={12}
                        color={currentGroupName ? PASTEL_PALETTE.accentDeep : Colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.previewGroupText,
                          currentGroupName ? styles.previewGroupTextActive : null,
                        ]}
                      >
                        {currentGroupName ? `Nhóm: ${currentGroupName}` : 'Chưa chọn nhóm'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.previewHint}>Xem trước cách hiển thị danh mục trong giao dịch</Text>
              </View>

              {/* Nhóm danh mục */}
              {defaultGroupId ? (
                <>
                  <Text style={styles.label}>Nhóm danh mục</Text>
                  <View style={styles.lockedGroupRow}>
                    <Ionicons
                      name={(categories.find(c => c.id === defaultGroupId)?.icon as any) || 'layers'}
                      size={18}
                      color={categories.find(c => c.id === defaultGroupId)?.color || PASTEL_PALETTE.accentDeep}
                    />
                    <Text style={styles.lockedGroupText}>
                      {categories.find(c => c.id === defaultGroupId)?.title || 'Nhóm đã chọn'}
                    </Text>
                  </View>
                </>
              ) : customGroups.length === 0 ? (
                <>
                  <Text style={styles.label}>Nhóm danh mục</Text>
                  <View style={styles.emptyGroupBox}>
                    <View style={styles.emptyGroupIconBg}>
                      <Ionicons name="layers-outline" size={28} color={PASTEL_PALETTE.accentDeep} />
                    </View>
                    <Text style={styles.emptyGroupTitle}>Bạn chưa có nhóm danh mục</Text>
                    <Text style={styles.emptyGroupText}>
                      Mỗi danh mục cần thuộc về một nhóm (VD: Ăn uống, Mua sắm...). Hãy tạo nhóm đầu tiên để bắt đầu!
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyGroupBtn}
                      onPress={handleOpenAddGroup}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="add-circle" size={18} color={Colors.white} />
                      <Text style={styles.emptyGroupBtnText}>Tạo nhóm đầu tiên</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { marginTop: 0, marginBottom: 0 }]}>Chọn Nhóm</Text>
                    <Text style={styles.groupCountText}>
                      {customGroups.length}/{MAX_CATEGORY_GROUPS} nhóm
                    </Text>
                  </View>
                  <View style={styles.groupContainer}>
                    {customGroups.map((group) => {
                      const isSelected = selectedGroup === group.id;
                      return (
                        <TouchableOpacity
                          key={group.id}
                          style={[
                            styles.groupChip,
                            {
                              borderColor: isSelected ? group.color : `${group.color}40`,
                              backgroundColor: isSelected ? group.color : `${group.color}15`,
                            },
                          ]}
                          onPress={() => setSelectedGroup(group.id)}
                          activeOpacity={0.75}
                        >
                          <View
                            style={[
                              styles.groupChipDot,
                              { backgroundColor: isSelected ? Colors.white : group.color },
                            ]}
                          />
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
                        onPress={handleOpenAddGroup}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="add" size={16} color={PASTEL_PALETTE.accentDeep} />
                        <Text style={styles.groupChipAddText}>
                          + Nhóm mới
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </>
              )}

              {/* Tên danh mục */}
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
                style={[
                  styles.input,
                  !!nameError && styles.inputError,
                ]}
                placeholder={`VD: Quà tặng, Vé máy bay... (tối đa ${MAX_CATEGORY_NAME_LENGTH} ký tự)`}
                placeholderTextColor="#94A3B8"
                value={label}
                onChangeText={(text) => {
                  setLabel(text.slice(0, MAX_CATEGORY_NAME_LENGTH));
                  if (nameError) setNameError('');
                }}
                maxLength={MAX_CATEGORY_NAME_LENGTH}
              />
              {!!nameError && (
                <View style={styles.inlineErrorRow}>
                  <Ionicons name="alert-circle" size={15} color="#EF4444" />
                  <Text style={styles.inlineErrorText}>{nameError}</Text>
                </View>
              )}

              {/* Chọn Biểu Tượng */}
              <Text style={styles.label}>Chọn Biểu Tượng</Text>
              <IconPicker
                selectedIcon={selectedIcon}
                onSelect={setSelectedIcon}
                color={selectedColor?.color || PASTEL_PALETTE.accentDeep}
              />

              {/* Chọn Màu Sắc */}
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
                          active && styles.colorCircleSelected,
                        ]}
                        onPress={() => setSelectedColor(item)}
                        activeOpacity={0.8}
                      >
                        {active && <Ionicons name="checkmark" size={22} color="#FFF" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Text style={styles.createHint}>
                Sau khi tạo, danh mục không thể chỉnh sửa. Muốn đổi tên/icon thì xóa và tạo lại.
              </Text>

              <View style={{ height: 30 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.85}
              >
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

          <Toast
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(prev => ({ ...prev, visible: false }))}
          />
        </KeyboardAvoidingView>
      </Modal>

      <AddGroupModal
        visible={visible && isGroupModalVisible}
        onClose={() => handleCloseAddGroup()}
        onCreated={(groupId) => handleCloseAddGroup(groupId)}
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '88%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
  },
  backBtn: {
    padding: 6,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 6,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  previewCard: {
    backgroundColor: '#FFF7FB',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FCE7F3',
    padding: 16,
    marginBottom: 20,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  previewIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTextCol: {
    flex: 1,
    gap: 5,
  },
  previewLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
  },
  previewGroupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  previewGroupText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  previewGroupTextActive: {
    color: PASTEL_PALETTE.accentDeep,
  },
  previewHint: {
    fontSize: 11.5,
    color: '#9CA3AF',
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
    marginTop: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 6,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  charCountLimit: {
    color: Colors.error,
  },
  groupCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 18,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inlineErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -12,
    marginBottom: 16,
  },
  inlineErrorText: {
    fontSize: 12.5,
    color: '#EF4444',
    fontWeight: '600',
  },
  lockedGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  lockedGroupText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  emptyGroupBox: {
    backgroundColor: '#FFF7FB',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FCE7F3',
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  emptyGroupIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FCE7F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyGroupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PASTEL_PALETTE.title,
    marginBottom: 4,
  },
  emptyGroupText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  emptyGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PASTEL_PALETTE.accentDeep, // Pink #EC4899
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
    shadowColor: PASTEL_PALETTE.accentDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyGroupBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  groupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  groupChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  groupChipText: {
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
    borderColor: PASTEL_PALETTE.accentDeep,
    borderStyle: 'dashed',
    backgroundColor: '#FFF7FB',
  },
  groupChipAddText: {
    color: PASTEL_PALETTE.accentDeep,
    fontSize: 13.5,
    fontWeight: '700',
  },
  colorHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: -4,
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
    gap: 14,
    marginBottom: 18,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  createHint: {
    fontSize: 12.5,
    color: Colors.textMuted,
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    paddingBottom: Platform.OS === 'ios' ? 32 : 18,
  },
  saveBtn: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: PASTEL_PALETTE.accentDeep, // Pink #EC4899
    shadowColor: PASTEL_PALETTE.accentDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
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
    backgroundColor: PASTEL_PALETTE.accentDeep,
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
