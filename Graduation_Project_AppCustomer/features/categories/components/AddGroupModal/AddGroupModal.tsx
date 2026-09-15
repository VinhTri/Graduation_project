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
import { MAX_CATEGORY_GROUPS, MAX_GROUP_NAME_LENGTH } from '../../constants/categoryLimits'
import {
  getAvailableGroupColors,
  GROUP_COLORS,
  type ColorTheme,
} from '../../constants/categoryTheme'
import { getAvailableGroupIcons, GROUP_ICONS } from '../../constants/icons'
import { IconPicker } from '../IconPicker/IconPicker'
import { styles } from './AddGroupModal.styles'

type Props = {
  visible: boolean
  categories: CategoryGroup[]
  onClose: () => void
  onSubmit: (payload: {
    title: string
    icon: string
    color: string
    bgColor: string
  }) => Promise<number>
  onCreated?: (groupId: number) => void
}

export function AddGroupModal({
  visible,
  categories,
  onClose,
  onSubmit,
  onCreated,
}: Props) {
  const [title, setTitle] = useState('')
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<ColorTheme | null>(null)
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState('')
  const [iconError, setIconError] = useState('')
  const [colorError, setColorError] = useState('')
  const [formError, setFormError] = useState('')

  const availableColors = useMemo(() => {
    const used = categories.map((g) => g.color)
    return getAvailableGroupColors(used)
  }, [categories])

  const availableIcons = useMemo(() => {
    const used = categories.map((g) => g.icon)
    return getAvailableGroupIcons(used)
  }, [categories])

  useEffect(() => {
    if (!visible) return
    setTitle('')
    setNameError('')
    setIconError('')
    setColorError('')
    setFormError('')
    setSelectedIcon(availableIcons[0] ?? null)
    setSelectedColor(availableColors[0] ?? null)
  }, [visible, availableColors, availableIcons])

  const handleSave = async () => {
    const trimmedTitle = title.trim()
    let hasError = false

    setFormError('')

    if (!trimmedTitle) {
      setNameError('Vui lòng nhập tên nhóm')
      hasError = true
    } else if (categories.some((g) => g.title.toLowerCase() === trimmedTitle.toLowerCase())) {
      setNameError(`Nhóm "${trimmedTitle}" đã tồn tại`)
      hasError = true
    } else {
      setNameError('')
    }

    if (!selectedIcon) {
      setIconError('Vui lòng chọn biểu tượng')
      hasError = true
    } else {
      setIconError('')
    }

    if (!selectedColor) {
      setColorError('Vui lòng chọn màu sắc')
      hasError = true
    } else {
      setColorError('')
    }

    if (categories.length >= MAX_CATEGORY_GROUPS) {
      setFormError(`Bạn đã tạo tối đa ${MAX_CATEGORY_GROUPS} nhóm`)
      hasError = true
    }

    if (hasError) return

    try {
      setSaving(true)
      const groupId = await onSubmit({
        title: trimmedTitle,
        icon: selectedIcon!,
        color: selectedColor!.color,
        bgColor: selectedColor!.bgColor,
      })
      onCreated?.(groupId)
      onClose()
    } catch (e: any) {
      setFormError(e?.message || 'Không thể tạo nhóm danh mục')
    } finally {
      setSaving(false)
    }
  }

  const previewColor = selectedColor?.color || PASTEL_PALETTE.accentDeep
  const previewBg = selectedColor?.bgColor || PASTEL_PALETTE.accentSoft
  const previewIcon = selectedIcon || 'home'

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={{ width: 32 }} />
            <Text style={styles.headerTitle}>Tạo nhóm danh mục</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={PASTEL_PALETTE.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
          >
            <View style={styles.previewBox}>
              <View style={[styles.previewHeader, { backgroundColor: previewBg }]}>
                <Ionicons
                  name={previewIcon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={previewColor}
                />
                <Text style={[styles.previewTitle, { color: previewColor }]}>
                  {title.trim() || 'Tên nhóm'}
                </Text>
              </View>
            </View>

            <View style={styles.labelRow}>
              <Text style={styles.label}>Tên nhóm</Text>
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
              style={[styles.input, !!nameError && styles.inputError]}
              placeholder={`VD: Du lịch, Gia đình...`}
              placeholderTextColor={PASTEL_PALETTE.textMuted}
              value={title}
              onChangeText={(text) => {
                setTitle(text.slice(0, MAX_GROUP_NAME_LENGTH))
                if (nameError) setNameError('')
              }}
              maxLength={MAX_GROUP_NAME_LENGTH}
            />
            {!!nameError && <Text style={styles.fieldError}>{nameError}</Text>}

            <Text style={styles.label}>Chọn biểu tượng</Text>
            <Text style={styles.colorHint}>
              {availableIcons.length}/{GROUP_ICONS.length} icon còn trống · mỗi nhóm một icon, không
              trùng
            </Text>
            <IconPicker
              icons={availableIcons}
              selectedIcon={selectedIcon || ''}
              onSelect={(icon) => {
                setSelectedIcon(icon)
                if (iconError) setIconError('')
              }}
              color={previewColor}
              emptyText="Không còn icon nhóm trống."
            />
            {!!iconError && <Text style={styles.fieldError}>{iconError}</Text>}

            <Text style={styles.label}>Chọn màu sắc</Text>
            <Text style={styles.colorHint}>
              Tối đa {MAX_CATEGORY_GROUPS} nhóm ({categories.length}/{MAX_CATEGORY_GROUPS}).{' '}
              {availableColors.length}/{GROUP_COLORS.length} màu còn trống · mỗi nhóm một màu, không
              trùng
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
                    onPress={() => {
                      setSelectedColor(item)
                      if (colorError) setColorError('')
                    }}
                  >
                    {active ? <Ionicons name="checkmark" size={20} color="#FFF" /> : null}
                  </TouchableOpacity>
                )
              })}
            </View>
            {!!colorError && <Text style={styles.fieldError}>{colorError}</Text>}

            {!!formError && <Text style={styles.formError}>{formError}</Text>}

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Đang tạo...' : 'Tạo nhóm'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
