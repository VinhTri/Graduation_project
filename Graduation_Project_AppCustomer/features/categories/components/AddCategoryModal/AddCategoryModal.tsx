import { useEffect, useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import type { CategoryGroup } from '@/shared/types/category'
import {
  MAX_CATEGORY_GROUPS,
  MAX_CATEGORY_NAME_LENGTH,
  MAX_ITEMS_PER_GROUP,
} from '../../constants/categoryLimits'
import {
  CATEGORY_COLORS,
  getAvailableCategoryColors,
  type ColorTheme,
} from '../../constants/categoryTheme'
import {
  CATEGORY_ICONS,
  getAvailableCategoryIcons,
} from '../../constants/icons'
import { AddGroupModal } from '../AddGroupModal/AddGroupModal'
import { IconPicker } from '../IconPicker/IconPicker'
import { styles } from './AddCategoryModal.styles'

type Props = {
  visible: boolean
  categories: CategoryGroup[]
  defaultGroupId?: number
  initialLabel?: string
  onClose: () => void
  onBack?: () => void
  onCreateGroup: (payload: {
    title: string
    icon: string
    color: string
    bgColor: string
  }) => Promise<number>
  onSubmit: (payload: {
    groupId: number
    label: string
    icon: string
    color: string
    bgColor: string
  }) => Promise<void>
}

export function AddCategoryModal({
  visible,
  categories,
  defaultGroupId,
  initialLabel,
  onClose,
  onBack,
  onCreateGroup,
  onSubmit,
}: Props) {
  const [label, setLabel] = useState('')
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<ColorTheme | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [groupModalVisible, setGroupModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState('')
  const [groupError, setGroupError] = useState('')

  const availableColors = useMemo(() => {
    const used = categories.flatMap((g) => g.items.filter((i) => i.custom).map((i) => i.color))
    return getAvailableCategoryColors(used)
  }, [categories])

  const availableIcons = useMemo(() => {
    const used = categories.flatMap((g) => g.items.filter((i) => i.custom).map((i) => i.icon))
    return getAvailableCategoryIcons(used)
  }, [categories])

  useEffect(() => {
    if (!visible) {
      setGroupModalVisible(false)
      setNameError('')
      setGroupError('')
      return
    }
    setLabel(initialLabel?.trim() || '')
    setNameError('')
    setGroupError('')
    setSelectedIcon(availableIcons[0] ?? null)
    setSelectedColor(availableColors[0] ?? null)
    if (defaultGroupId) {
      setSelectedGroupId(defaultGroupId)
    } else if (categories.length > 0) {
      setSelectedGroupId(categories[0].id)
    } else {
      setSelectedGroupId(null)
    }
  }, [visible, defaultGroupId, categories, availableColors, availableIcons, initialLabel])

  const selectedGroup = categories.find((g) => g.id === selectedGroupId)
  const isGroupLocked = defaultGroupId != null
  const groupsAtMax = categories.length >= MAX_CATEGORY_GROUPS

  const handleSave = async () => {
    const trimmed = label.trim()
    let hasError = false

    if (!trimmed) {
      setNameError('Vui lòng nhập tên danh mục')
      hasError = true
    } else if (
      categories.some((g) =>
        g.items.some((i) => i.label.toLowerCase() === trimmed.toLowerCase()),
      )
    ) {
      setNameError(`Danh mục "${trimmed}" đã tồn tại`)
      hasError = true
    } else {
      setNameError('')
    }

    if (!selectedGroupId || !selectedGroup) {
      setGroupError('Vui lòng tạo nhóm trước')
      hasError = true
    } else if (selectedGroup.items.length >= MAX_ITEMS_PER_GROUP) {
      setGroupError('Danh mục đã đạt số lượng tối đa')
      hasError = true
    } else {
      setGroupError('')
    }

    if (hasError || !selectedColor || !selectedIcon) return

    try {
      setSaving(true)
      await onSubmit({
        groupId: selectedGroupId!,
        label: trimmed,
        icon: selectedIcon,
        color: selectedColor.color,
        bgColor: selectedColor.bgColor,
      })
      onClose()
    } catch (e: any) {
      setGroupError(e?.message || 'Không thể tạo danh mục')
    } finally {
      setSaving(false)
    }
  }

  const previewColor = selectedColor?.color || PASTEL_PALETTE.accentDeep
  const previewBg = selectedColor?.bgColor || PASTEL_PALETTE.accentSoft
  const previewIcon = selectedIcon || 'pricetag'

  return (
    <>
      <Modal
        visible={visible && !groupModalVisible}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={onBack || onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}
        >
          <Pressable style={styles.backdrop} onPress={onBack || onClose} />
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              {onBack ? (
                <TouchableOpacity onPress={onBack} style={styles.closeBtn}>
                  <Ionicons name="chevron-back" size={24} color={PASTEL_PALETTE.textDark} />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 32 }} />
              )}
              <Text style={styles.headerTitle}>Tạo danh mục</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={PASTEL_PALETTE.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
            >
              <View style={[styles.previewBox, { backgroundColor: previewBg }]}>
                <Ionicons
                  name={previewIcon as keyof typeof Ionicons.glyphMap}
                  size={22}
                  color={previewColor}
                />
                <Text style={[styles.previewTitle, { color: previewColor }]}>
                  {label.trim() || 'Tên danh mục'}
                </Text>
              </View>

              <Text style={styles.hint}>
                Danh mục không thể sửa sau khi tạo. Muốn đổi thì xóa và tạo lại.
              </Text>

              <View style={styles.labelRow}>
                <Text style={styles.label}>Tên danh mục</Text>
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
                style={[styles.input, !!nameError && styles.inputError]}
                placeholder="VD: Ăn uống, Xăng xe..."
                placeholderTextColor={PASTEL_PALETTE.textMuted}
                value={label}
                onChangeText={(text) => {
                  setLabel(text.slice(0, MAX_CATEGORY_NAME_LENGTH))
                  if (nameError) setNameError('')
                }}
                maxLength={MAX_CATEGORY_NAME_LENGTH}
              />
              {!!nameError && <Text style={styles.fieldError}>{nameError}</Text>}

              {isGroupLocked ? (
                <Text style={styles.label}>Danh mục thuộc nhóm</Text>
              ) : (
                <View style={[styles.labelRow, { marginTop: 14 }]}>
                  <Text style={[styles.label, { marginTop: 0, marginBottom: 0 }]}>Chọn nhóm</Text>
                  <Text
                    style={[
                      styles.charCount,
                      groupsAtMax && { color: '#DC2626' },
                    ]}
                  >
                    {categories.length}/{MAX_CATEGORY_GROUPS}
                  </Text>
                </View>
              )}
              {isGroupLocked && selectedGroup ? (
                <View
                  style={[
                    styles.lockedGroupCard,
                    {
                      backgroundColor: selectedGroup.bgColor,
                      borderColor: selectedGroup.color,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.lockedGroupIcon,
                      { backgroundColor: `${selectedGroup.color}22` },
                    ]}
                  >
                    <Ionicons
                      name={selectedGroup.icon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={selectedGroup.color}
                    />
                  </View>
                  <View style={styles.lockedGroupTextWrap}>
                    <Text style={[styles.lockedGroupTitle, { color: selectedGroup.color }]}>
                      {selectedGroup.title}
                    </Text>
                    <Text style={styles.lockedGroupCount}>
                      {selectedGroup.items.length}/{MAX_ITEMS_PER_GROUP} danh mục
                    </Text>
                  </View>
                </View>
              ) : categories.length === 0 ? (
                <TouchableOpacity
                  style={[styles.createGroupBtn, !!groupError && styles.createGroupBtnError]}
                  onPress={() => {
                    setGroupError('')
                    setGroupModalVisible(true)
                  }}
                >
                  <Ionicons name="add-circle-outline" size={18} color={PASTEL_PALETTE.accentDeep} />
                  <Text style={styles.createGroupText}>Tạo nhóm trước</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.groupChips}>
                  {categories.map((group) => {
                    const active = selectedGroupId === group.id
                    const count = group.items?.length ?? 0
                    const isFull = count >= MAX_ITEMS_PER_GROUP
                    return (
                      <TouchableOpacity
                        key={group.id}
                        style={[
                          styles.groupChip,
                          active && {
                            backgroundColor: group.bgColor,
                            borderColor: group.color,
                          },
                          isFull && !active && { opacity: 0.85 },
                        ]}
                        onPress={() => {
                          setSelectedGroupId(group.id)
                          if (groupError) setGroupError('')
                        }}
                      >
                        <Ionicons
                          name={group.icon as keyof typeof Ionicons.glyphMap}
                          size={14}
                          color={group.color}
                        />
                        <Text style={[styles.groupChipText, { color: group.color }]}>
                          {group.title}
                        </Text>
                        <Text
                          style={[
                            styles.groupChipCount,
                            { color: isFull ? '#DC2626' : group.color },
                          ]}
                        >
                          {count}/{MAX_ITEMS_PER_GROUP}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                  <TouchableOpacity
                    style={[styles.groupChip, groupsAtMax && styles.groupChipDisabled]}
                    onPress={() => {
                      if (groupsAtMax) return
                      setGroupModalVisible(true)
                    }}
                    activeOpacity={groupsAtMax ? 1 : 0.7}
                    disabled={groupsAtMax}
                  >
                    <Ionicons
                      name="add"
                      size={14}
                      color={groupsAtMax ? PASTEL_PALETTE.textMuted : PASTEL_PALETTE.accentDeep}
                    />
                    <Text
                      style={[
                        styles.groupChipText,
                        {
                          color: groupsAtMax
                            ? PASTEL_PALETTE.textMuted
                            : PASTEL_PALETTE.accentDeep,
                        },
                      ]}
                    >
                      Nhóm mới
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              {!!groupError && <Text style={styles.fieldError}>{groupError}</Text>}
              {!groupError && groupsAtMax && !isGroupLocked ? (
                <Text style={styles.fieldError}>Nhóm đã đạt số lượng tối đa</Text>
              ) : null}
              {!groupError &&
              selectedGroup &&
              selectedGroup.items.length >= MAX_ITEMS_PER_GROUP ? (
                <Text style={styles.fieldError}>Danh mục đã đạt số lượng tối đa</Text>
              ) : null}

              <Text style={styles.label}>Chọn biểu tượng</Text>
              <Text style={styles.colorHint}>
                {availableIcons.length}/{CATEGORY_ICONS.length} icon còn trống · mỗi danh mục một
                icon riêng
              </Text>
              <IconPicker
                icons={availableIcons}
                selectedIcon={selectedIcon || ''}
                onSelect={setSelectedIcon}
                color={previewColor}
                emptyText="Không còn icon danh mục trống. Hãy xóa danh mục cũ để lấy lại."
              />

              <Text style={styles.label}>Chọn màu sắc</Text>
              <Text style={styles.colorHint}>
                {availableColors.length}/{CATEGORY_COLORS.length} màu còn trống
              </Text>
              <View style={styles.colorGrid}>
                {availableColors.map((item) => {
                  const active = selectedColor?.color === item.color
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
                      {active ? <Ionicons name="checkmark" size={18} color="#FFF" /> : null}
                    </TouchableOpacity>
                  )
                })}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Đang tạo...' : 'Tạo danh mục'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <AddGroupModal
        visible={visible && groupModalVisible}
        categories={categories}
        onClose={() => setGroupModalVisible(false)}
        onSubmit={onCreateGroup}
        onCreated={(groupId) => {
          setSelectedGroupId(groupId)
          setGroupError('')
          setGroupModalVisible(false)
        }}
      />
    </>
  )
}
