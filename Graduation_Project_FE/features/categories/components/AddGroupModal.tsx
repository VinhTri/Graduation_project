import React, { useState, useEffect } from 'react';
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
import { AVAILABLE_COLORS } from '../constants/categoryTheme';
import { MAX_CATEGORY_GROUPS } from '../constants/categoryLimits';

type AddGroupModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated?: (groupId: string) => void;
};

export const AddGroupModal: React.FC<AddGroupModalProps> = ({ visible, onClose, onCreated }) => {
  const { categories, addGroup } = useCategoryContext();
  const [title, setTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('layers');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setSelectedIcon('layers');
      setSelectedColorIndex(0);
    }
  }, [visible]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên nhóm danh mục.');
      return;
    }

    if (categories.length >= MAX_CATEGORY_GROUPS) {
      Alert.alert(
        'Giới hạn nhóm',
        `Bạn chỉ có thể tạo tối đa ${MAX_CATEGORY_GROUPS} nhóm danh mục.`
      );
      return;
    }

    const normalized = trimmedTitle.toLowerCase();
    const duplicate = categories.some((g) => g.title.toLowerCase() === normalized);
    if (duplicate) {
      Alert.alert('Trùng tên nhóm', `Nhóm "${trimmedTitle}" đã tồn tại. Vui lòng đặt tên khác.`);
      return;
    }

    const theme = AVAILABLE_COLORS[selectedColorIndex];
    setSaving(true);
    try {
      const newGroupId = await addGroup({
        title: trimmedTitle,
        icon: selectedIcon,
        color: theme.color,
        bgColor: theme.bgColor,
      });
      onCreated?.(newGroupId);
      onClose();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể tạo nhóm danh mục.');
    } finally {
      setSaving(false);
    }
  };

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
            <Text style={styles.label}>Tên nhóm</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Du lịch, Gia đình, Công việc..."
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={40}
            />

            <Text style={styles.label}>Chọn biểu tượng</Text>
            <IconPicker
              selectedIcon={selectedIcon}
              onSelect={setSelectedIcon}
              color={AVAILABLE_COLORS[selectedColorIndex].color}
            />

            <Text style={styles.label}>Chọn màu sắc</Text>
            <View style={styles.colorGrid}>
              {AVAILABLE_COLORS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: item.color },
                    selectedColorIndex === index && styles.colorCircleSelected,
                  ]}
                  onPress={() => setSelectedColorIndex(index)}
                >
                  {selectedColorIndex === index && (
                    <Ionicons name="checkmark" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.previewBox}>
              <View
                style={[
                  styles.previewHeader,
                  { backgroundColor: AVAILABLE_COLORS[selectedColorIndex].bgColor },
                ]}
              >
                <Ionicons
                  name={selectedIcon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={AVAILABLE_COLORS[selectedColorIndex].color}
                />
                <Text style={[styles.previewTitle, { color: AVAILABLE_COLORS[selectedColorIndex].color }]}>
                  {title.trim() || 'Tên nhóm'}
                </Text>
              </View>
              <Text style={styles.previewHint}>Xem trước thẻ nhóm cha</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
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
