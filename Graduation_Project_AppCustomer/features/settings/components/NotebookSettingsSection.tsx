import { useEffect, useState } from 'react'
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useToast } from '@/shared/components/Toast'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { userService } from '@/shared/api/services/userService'
import { styles } from '../SettingsScreen.styles'

const ANIM_CONFIG = {
  duration: 320,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
}

const ICON = PASTEL_PALETTE.accentDeep
const DEFAULT_TIME = '21:00'

function parseHm(value?: string | null) {
  const next = new Date()
  const match = value?.match(/^(\d{2}):(\d{2})/)
  if (match) {
    next.setHours(Number(match[1]), Number(match[2]), 0, 0)
  } else {
    next.setHours(21, 0, 0, 0)
  }
  return next
}

function formatHm(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function formatDisplay(value?: string | null) {
  return parseHm(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export function NotebookSettingsSection() {
  const { showToast } = useToast()
  const [expanded, setExpanded] = useState(false)
  const [measuredHeight, setMeasuredHeight] = useState(0)
  const [enabled, setEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState(DEFAULT_TIME)
  const [saving, setSaving] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [draftTime, setDraftTime] = useState(() => parseHm(DEFAULT_TIME))
  const progress = useSharedValue(0)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const profile = await userService.getMyProfile()
        if (!mounted) return
        setEnabled(Boolean(profile.notebookReminderEnabled))
        setReminderTime(profile.notebookReminderTime || DEFAULT_TIME)
      } catch {
        // keep defaults
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const toggle = () => {
    const next = !expanded
    setExpanded(next)
    progress.value = withTiming(next ? 1 : 0, ANIM_CONFIG)
  }

  const panelStyle = useAnimatedStyle(() => {
    const h = measuredHeight > 0 ? measuredHeight : 0
    return {
      height: progress.value * h,
      opacity: interpolate(progress.value, [0, 0.35, 1], [0, 0.55, 1]),
      transform: [{ translateY: interpolate(progress.value, [0, 1], [-6, 0]) }],
    }
  })

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
  }))

  const persist = async (nextEnabled: boolean, nextTime: string) => {
    setSaving(true)
    try {
      const saved = await userService.updateNotebookReminder({
        enabled: nextEnabled,
        reminderTime: nextTime,
      })
      setEnabled(Boolean(saved.enabled))
      if (saved.reminderTime) setReminderTime(saved.reminderTime)
      const timeLabel = formatDisplay(saved.reminderTime || nextTime)
      showToast({
        variant: 'success',
        message: nextEnabled
          ? saved.appliesToday
            ? `Sẽ nhắc hôm nay lúc ${timeLabel}`
            : `Lần nhắc đầu vào ngày mai lúc ${timeLabel}`
          : 'Đã tắt nhắc nhở ghi chép sổ tay',
      })
    } catch (error: any) {
      showToast({
        variant: 'warning',
        message: error?.message || 'Không lưu được cài đặt nhắc nhở',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (value: boolean) => {
    const nextTime = reminderTime || DEFAULT_TIME
    setEnabled(value)
    if (value && !reminderTime) setReminderTime(DEFAULT_TIME)
    void persist(value, nextTime)
  }

  const openPicker = () => {
    setDraftTime(parseHm(reminderTime))
    setShowPicker(true)
  }

  const applyPickedTime = (date: Date) => {
    const nextTime = formatHm(date)
    setReminderTime(nextTime)
    setShowPicker(false)
    void persist(true, nextTime)
  }

  const onAndroidTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed' || !date) {
      setShowPicker(false)
      return
    }
    applyPickedTime(date)
  }

  const body = (
    <View style={styles.securitySubList}>
      <View style={[styles.securitySubItem, !enabled && { borderBottomWidth: 0 }]}>
        <View style={styles.securitySubIcon}>
          <Ionicons name="alarm-outline" size={16} color={ICON} />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>Nhắc nhở ghi chép</Text>
          <Text style={styles.itemSubtitle}>
            {enabled ? `Mỗi ngày lúc ${formatDisplay(reminderTime)}` : 'Tắt — không gửi thông báo'}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          disabled={saving}
          trackColor={{ false: '#E5E7EB', true: PASTEL_PALETTE.accent }}
          thumbColor="#FFFFFF"
        />
      </View>

      {enabled ? (
        <TouchableOpacity style={styles.notebookTimeRow} activeOpacity={0.75} onPress={openPicker}>
          <View style={styles.appSettingSwitchIcon}>
            <Ionicons name="time-outline" size={16} color={ICON} />
          </View>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>Thời gian trong ngày</Text>
            <Text style={styles.itemSubtitle}>Đến giờ này sẽ thông báo mỗi ngày</Text>
          </View>
          <Text style={styles.notebookTimeValue}>{formatDisplay(reminderTime)}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )

  return (
    <>
      <Pressable
        style={[
          styles.itemContainer,
          { borderBottomWidth: expanded ? StyleSheet.hairlineWidth : 0 },
        ]}
        onPress={toggle}
        android_ripple={{ color: PASTEL_PALETTE.accentSoft }}
      >
        <View style={styles.itemIconContainer}>
          <Feather name="pie-chart" size={19} color={ICON} />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>Sổ tay chi tiêu</Text>
          <Text style={styles.itemSubtitle}>Ghi chép và nhắc nhở hàng ngày</Text>
        </View>
        <Animated.View style={chevronStyle}>
          <Feather name="chevron-down" size={18} color={PASTEL_PALETTE.lavender} />
        </Animated.View>
      </Pressable>

      <View
        style={styles.securityMeasure}
        pointerEvents="none"
        onLayout={(e) => {
          const next = Math.ceil(e.nativeEvent.layout.height)
          if (next > 0 && next !== measuredHeight) setMeasuredHeight(next)
        }}
      >
        {body}
      </View>

      <Animated.View style={[styles.securityCollapse, panelStyle]} pointerEvents={expanded ? 'auto' : 'none'}>
        {body}
      </Animated.View>

      {showPicker && Platform.OS === 'android' ? (
        <DateTimePicker
          value={draftTime}
          mode="time"
          display="default"
          is24Hour
          onChange={onAndroidTimeChange}
        />
      ) : null}

      <Modal visible={showPicker && Platform.OS === 'ios'} transparent animationType="fade">
        <Pressable style={pickerStyles.backdrop} onPress={() => setShowPicker(false)}>
          <Pressable style={pickerStyles.sheet} onPress={() => undefined}>
            <Text style={pickerStyles.sheetTitle}>Chọn giờ nhắc nhở</Text>
            <DateTimePicker
              value={draftTime}
              mode="time"
              display="spinner"
              themeVariant="light"
              onChange={(_event, date) => {
                if (date) setDraftTime(date)
              }}
            />
            <TouchableOpacity
              style={pickerStyles.confirmBtn}
              activeOpacity={0.8}
              onPress={() => applyPickedTime(draftTime)}
            >
              <Text style={pickerStyles.confirmText}>Xong</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const pickerStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: PASTEL_PALETTE.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PASTEL_PALETTE.title,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmBtn: {
    marginTop: 8,
    backgroundColor: PASTEL_PALETTE.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: PASTEL_PALETTE.white,
    fontSize: 15,
    fontWeight: '800',
  },
})
