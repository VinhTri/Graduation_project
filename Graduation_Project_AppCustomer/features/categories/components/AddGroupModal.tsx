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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../shared/constants/Colors';
import { useCategoryContext } from '../../../shared/contexts/CategoryContext';
import { IconPicker } from './IconPicker';
import { Toast } from '../../../shared/components/Toast/Toast';
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
  const [nameError, setNameError] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('layers');
  const [selectedColor, setSelectedColor] = useState<ColorTheme | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type?: 'error' | 'success' | 'info' }>({
    visible: false,
    message: '',
    type: 'error',
  });
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'warning' | 'error';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'error',
  });

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
      setNameError('');
      setToast({ visible: false, message: '', type: 'error' });
      setSelectedIcon('layers');
      setSelectedColor(availableColors[0] ?? null);
    }
  }, [visible, availableColors]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setNameError('Vui lòng nhập tên nhóm danh mục');
      return;
    }

    if (customGroups.length >= MAX_CATEGORY_GROUPS) {
      setAlertConfig({
        visible: true,
        title: 'Giới hạn nhóm',
        message: `Bạn chỉ có thể tạo tối đa ${MAX_CATEGORY_GROUPS} nhóm danh mục.`,
        type: 'error',
      });
      return;
    }

    if (!selectedColor) {
      setToast({
        visible: true,
        message: 'Vui lòng chọn một màu sắc cho nhóm',
        type: 'error',
      });
      return;
    }

    const normalized = trimmedTitle.toLowerCase();
    const duplicate = customGroups.some((g) => g.title.toLowerCase() === normalized);
    if (duplicate) {
      setAlertConfig({
        visible: true,
        title: 'Trùng tên nhóm',
        message: `Nhóm "${trimmedTitle}" đã tồn tại. Vui lòng đặt tên khác.`,
        type: 'error',
      });
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
      setAlertConfig({
        visible: true,
        title: 'Lỗi',
        message: error?.message || 'Không thể tạo nhóm danh mục.',
        type: 'error',
      });
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
              style={[
                styles.input,
                !!nameError && styles.inputError,
              ]}
              placeholder={`VD: Du lịch, Gia đình... (tối đa ${MAX_GROUP_NAME_LENGTH} ký tự)`}
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={(text) => {
                setTitle(text.slice(0, MAX_GROUP_NAME_LENGTH));
                if (nameError) setNameError('');
              }}
              maxLength={MAX_GROUP_NAME_LENGTH}
            />
            {!!nameError && (
              <View style={styles.inlineErrorRow}>
                <Ionicons name="alert-circle" size={15} color="#EF4444" />
                <Text style={styles.inlineErrorText}>{nameError}</Text>
              </View>
            )}

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

        <Modal transparent visible={alertConfig.visible} animationType="fade">
          <View style={styles.alertOverlay}>
            <View style={styles.alertBox}>
              <View
                style={[
                  styles.alertIconBg,
                  { backgroundColor: alertConfig.type === 'error' ? '#FEE2E2' : '#FEF3C7' },
                ]}
              >
                <Ionicons
                  name={alertConfig.type === 'error' ? 'close-circle' : 'warning'}
                  size={36}
                  color={alertConfig.type === 'error' ? '#EF4444' : '#F59E0B'}
                />
              </View>
              <Text style={styles.alertTitle}>{alertConfig.title}</Text>
              <Text style={styles.alertMessage}>{alertConfig.message}</Text>

              <View style={styles.alertActions}>
                <TouchableOpacity
                  style={[
                    styles.alertBtn,
                    alertConfig.type === 'error' ? styles.alertErrorBtn : styles.alertConfirmBtn,
                  ]}
                  onPress={() => {
                    setAlertConfig((prev) => ({ ...prev, visible: false }));
                    if (alertConfig.onConfirm) alertConfig.onConfirm();
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.alertConfirmText,
                      alertConfig.type === 'error' && { color: '#EF4444' },
                    ]}
                  >
                    Đã hiểu
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
          onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
        />
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
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inlineErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -14,
    marginBottom: 16,
  },
  inlineErrorText: {
    fontSize: 12.5,
    color: '#EF4444',
    fontWeight: '600',
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
    backgroundColor: '#EC4899', // Pink PASTEL_PALETTE.accentDeep
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
  alertConfirmBtn: {
    backgroundColor: '#EC4899',
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
