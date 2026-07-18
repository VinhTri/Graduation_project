import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../shared/constants/Colors';
import { useCategoryContext } from '../../../shared/contexts/CategoryContext';
import { IconPicker } from './IconPicker';
import { ColorTheme, getAvailableGroupColors, GROUP_COLORS } from '../constants/categoryTheme';
import { MAX_CATEGORY_GROUPS, MAX_GROUP_NAME_LENGTH } from '../constants/categoryLimits';

type AddGroupModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated?: (groupId: string) => void;
};

export const AddGroupModal: React.FC<AddGroupModalProps> = ({ visible, onClose, onCreated }) => {
  const { categories, addGroup } = useCategoryContext();
  const [title, setTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('layers');
  const [selectedColor, setSelectedColor] = useState<ColorTheme | null>(null);
  const [saving, setSaving] = useState(false);

  const customGroups = useMemo(
    () => categories.filter((g) => !g.isDefault),
    [categories]
  );

  const availableColors = useMemo(() => {
    const used = customGroups.map((g) => g.color);
    return getAvailableGroupColors(used);
  }, [customGroups]);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setSelectedIcon('layers');
      setSelectedColor(availableColors[0] ?? null);
    }
  }, [visible, availableColors]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên nhóm danh mục.');
      return;
    }

    if (customGroups.length >= MAX_CATEGORY_GROUPS) {
      Alert.alert(
        'Giới hạn nhóm',
        `Bạn chỉ có thể tạo tối đa ${MAX_CATEGORY_GROUPS} nhóm danh mục.`
      );
      return;
    }

    if (!selectedColor) {
      Alert.alert('Hết màu', 'Tất cả màu nhóm đã được sử dụng. Hãy xóa nhóm cũ để lấy lại màu.');
      return;
    }

    const normalized = trimmedTitle.toLowerCase();
    const duplicate = customGroups.some((g) => g.title.toLowerCase() === normalized);
    if (duplicate) {
      Alert.alert('Trùng tên nhóm', `Nhóm "${trimmedTitle}" đã tồn tại. Vui lòng đặt tên khác.`);
      return;
    }

    setSaving(true);
    try {
      const newGroupId = await addGroup({
        title: trimmedTitle,
        icon: selectedIcon,
        color: selectedColor.color,
        bgColor: selectedColor.bgColor,
      });
      onCreated?.(newGroupId);
      onClose();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể tạo nhóm danh mục.');
    } finally {
      setSaving(false);
    }
  };

  const previewColor = selectedColor?.color || Colors.primary;
  const previewBg = selectedColor?.bgColor || Colors.primaryLight;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={{ width: 32 }} />
            <Text style={styles.headerTitle}>Tạo nhóm danh mục</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { marginTop: 0, marginBottom: 0 }]}>Tên nhóm</Text>
              <Text
                style={[
                  styles.charCount,
                  title.length >= MAX_GROUP_NAME_LENGTH && styles.charCountLimit,
                ]}
              >
                {title.length}/{MAX_GROUP_NAME_LENGTH}
              </Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder={`VD: Du lịch, Gia đình... (tối đa ${MAX_GROUP_NAME_LENGTH} ký tự)`}
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={(text) => setTitle(text.slice(0, MAX_GROUP_NAME_LENGTH))}
              maxLength={MAX_GROUP_NAME_LENGTH}
            />

            <Text style={styles.label}>Chọn biểu tượng</Text>
            <IconPicker
              selectedIcon={selectedIcon}
              onSelect={setSelectedIcon}
              color={previewColor}
            />

            <Text style={styles.label}>Chọn màu sắc</Text>
            <Text style={styles.colorHint}>
              Tối đa {MAX_CATEGORY_GROUPS} nhóm ({customGroups.length}/{MAX_CATEGORY_GROUPS}). Mỗi nhóm một màu riêng
              ({availableColors.length}/{GROUP_COLORS.length} màu còn trống).
            </Text>
            {availableColors.length === 0 ? (
              <Text style={styles.emptyColors}>Không còn màu nhóm trống</Text>
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
                    >
                      {active && <Ionicons name="checkmark" size={20} color="#FFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.previewBox}>
              <View style={[styles.previewHeader, { backgroundColor: previewBg }]}>
                <Ionicons
                  name={selectedIcon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={previewColor}
                />
                <Text style={[styles.previewTitle, { color: previewColor }]}>
                  {title.trim() || 'Tên nhóm'}
                </Text>
              </View>
              <Text style={styles.previewHint}>Xem trước thẻ nhóm cha</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, (saving || !selectedColor) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving || !selectedColor}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Tạo nhóm'}</Text>
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
    height: '82%',
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  previewBox: {
    marginBottom: 24,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  previewHint: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.textMuted,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
