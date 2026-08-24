import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  TextInput,
  Platform,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  Image,
  useWindowDimensions,
  KeyboardEvent,
  StyleSheet,
} from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { styles } from './AIChatModal.styles'
import Colors from '@/shared/constants/Colors'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import {
  aiChatService,
  AiChatAction,
  ChatMessage,
} from '@/shared/services/aiChatService'

const ROBOT_AVATAR = require('../../../../assets/images/ai-robot/1-thumb.png')

const OPEN_SPRING = { damping: 24, stiffness: 260, mass: 0.9 }
const CLOSE_MS = 280
const BACKDROP_MS = 220

interface AIChatModalProps {
  visible: boolean
  onClose: () => void
}

function AiRobotAvatar({ size = 36 }: { size?: number }) {
  return (
    <View style={[styles.aiAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image
        source={ROBOT_AVATAR}
        style={{ width: size - 4, height: size - 4 }}
        resizeMode="contain"
      />
    </View>
  )
}

export const AIChatModal: React.FC<AIChatModalProps> = ({ visible, onClose }) => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()

  const [renderModal, setRenderModal] = useState(visible)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là Trợ lý AI SmartSpend. Bạn cần hỗ trợ gì?',
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      moduleType: 'RAG',
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({})
  const scrollViewRef = useRef<ScrollView>(null)
  const inputRef = useRef<TextInput>(null)

  const closedSheetHeight = useMemo(() => {
    const topGap = Math.max(insets.top, 12) + 8
    return Math.min(windowHeight * 0.88, windowHeight - topGap)
  }, [insets.top, windowHeight])

  const backdropOpacity = useSharedValue(0)
  const sheetTranslateY = useSharedValue(windowHeight)
  const sheetHeight = useSharedValue(closedSheetHeight)
  const keyboardOffset = useSharedValue(0)

  const computeLiftedHeight = useCallback(
    (keyboardHeight: number) => {
      const topGap = Math.max(insets.top, 12) + 8
      return Math.max(windowHeight - keyboardHeight - topGap, windowHeight * 0.38)
    },
    [insets.top, windowHeight],
  )

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    })
  }, [])

  const resetKeyboard = useCallback(() => {
    keyboardOffset.value = 0
    sheetHeight.value = closedSheetHeight
    setKeyboardOpen(false)
  }, [closedSheetHeight, keyboardOffset, sheetHeight])

  const openModal = useCallback(() => {
    backdropOpacity.value = withTiming(1, {
      duration: BACKDROP_MS,
      easing: Easing.out(Easing.cubic),
    })
    sheetTranslateY.value = withSpring(0, OPEN_SPRING)
    sheetHeight.value = closedSheetHeight
    keyboardOffset.value = 0
  }, [backdropOpacity, closedSheetHeight, keyboardOffset, sheetHeight, sheetTranslateY])

  const closeModal = useCallback(() => {
    Keyboard.dismiss()
    resetKeyboard()
    backdropOpacity.value = withTiming(0, {
      duration: BACKDROP_MS,
      easing: Easing.in(Easing.cubic),
    })
    sheetTranslateY.value = withTiming(
      windowHeight,
      { duration: CLOSE_MS, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(setRenderModal)(false)
        }
      },
    )
  }, [backdropOpacity, resetKeyboard, sheetTranslateY, windowHeight])

  useEffect(() => {
    sheetHeight.value = closedSheetHeight
    if (!renderModal) {
      sheetTranslateY.value = windowHeight
    }
  }, [closedSheetHeight, renderModal, sheetHeight, sheetTranslateY, windowHeight])

  useEffect(() => {
    if (visible) {
      setRenderModal(true)
      return
    }
    if (renderModal) {
      closeModal()
    }
  }, [visible, renderModal, closeModal])

  useEffect(() => {
    if (renderModal && visible) {
      const frame = requestAnimationFrame(() => openModal())
      return () => cancelAnimationFrame(frame)
    }
  }, [renderModal, visible, openModal])

  useEffect(() => {
    if (!renderModal) return

    const animateKeyboard = (height: number, duration: number) => {
      const ms = duration > 0 ? duration : Platform.OS === 'ios' ? 250 : 200
      const easing = Easing.out(Easing.cubic)

      if (height <= 0) {
        keyboardOffset.value = withTiming(0, { duration: ms, easing })
        sheetHeight.value = withTiming(closedSheetHeight, { duration: ms, easing })
        runOnJS(setKeyboardOpen)(false)
      } else {
        keyboardOffset.value = withTiming(height, { duration: ms, easing })
        sheetHeight.value = withTiming(computeLiftedHeight(height), { duration: ms, easing })
        runOnJS(setKeyboardOpen)(true)
      }
      runOnJS(scrollToEnd)()
    }

    const onShow = (event: KeyboardEvent) => {
      animateKeyboard(event.endCoordinates.height, event.duration ?? 0)
    }
    const onHide = (event: KeyboardEvent) => {
      animateKeyboard(0, event.duration ?? 0)
    }

    const subscriptions =
      Platform.OS === 'ios'
        ? [
            Keyboard.addListener('keyboardWillShow', onShow),
            Keyboard.addListener('keyboardWillHide', onHide),
          ]
        : [
            Keyboard.addListener('keyboardDidShow', onShow),
            Keyboard.addListener('keyboardDidHide', onHide),
          ]

    return () => {
      subscriptions.forEach((sub) => sub.remove())
    }
  }, [renderModal, closedSheetHeight, computeLiftedHeight, keyboardOffset, scrollToEnd, sheetHeight])

  useEffect(() => {
    if (renderModal && visible) {
      setTimeout(() => scrollToEnd(), 160)
    }
  }, [renderModal, visible, messages, scrollToEnd])

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    height: sheetHeight.value,
    marginBottom: keyboardOffset.value,
    transform: [{ translateY: sheetTranslateY.value }],
  }))

  const handleClose = () => {
    onClose()
  }

  const handleNewConversation = async () => {
    await aiChatService.startNewConversation()
    setMessages([{ id: '1', text: 'Xin chào! Tôi là Trợ lý AI SmartSpend. Bạn cần hỗ trợ gì?', isUser: false, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), moduleType: 'RAG' }])
    setFeedback({})
    setInputText('')
  }

  const sendPrompt = async (promptToSend: string) => {
    if (!promptToSend.trim() || isLoading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: promptToSend,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setIsLoading(true)

    const historyDto = messages
      .filter((m) => m.text && !m.text.includes('Xin chào! Tôi là Trợ lý AI SmartSpend'))
      .map((m) => ({
        role: m.isUser ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }))

    try {
      const response = await aiChatService.processMessage(promptToSend, historyDto)
      setMessages((prev) => [...prev, response])
    } catch (error) {
      console.error('AI Response error:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: 'Có lỗi xảy ra khi kết nối với Trợ lý AI. Vui lòng thử lại sau!',
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsLoading(false)
      scrollToEnd()
    }
  }

  const handleSend = async () => {
    await sendPrompt(inputText)
  }

  const handleAction = async (action: AiChatAction) => {
    if (action.type === 'SEND_MESSAGE' && action.payload) {
      await sendPrompt(action.payload)
      return
    }

    if (action.type === 'NAVIGATE' && action.route) {
      handleClose()
      const query = action.payload ? `?${action.payload}` : ''
      router.push(`${action.route}${query}` as any)
    }
  }

  const handleFeedback = async (messageId: string, helpful: boolean) => {
    const value = helpful ? 'up' : 'down'
    setFeedback((current) => ({ ...current, [messageId]: value }))
    try {
      await aiChatService.submitFeedback(messageId, helpful)
    } catch {
      setFeedback((current) => { const next = { ...current }; delete next[messageId]; return next })
    }
  }

  const getModuleBadge = (moduleType?: ChatMessage['moduleType']) => {
    switch (moduleType) {
      case 'RAG':
        return { text: 'Hướng dẫn', bg: '#EEF2FF', color: '#4F46E5' }
      case 'ANALYTICS':
        return { text: 'Phân tích', bg: '#FEF3C7', color: '#D97706' }
      case 'RECOMMENDATION':
        return { text: 'Tư vấn', bg: '#D1FAE5', color: '#059669' }
      case 'CATEGORY':
        return { text: 'Danh mục', bg: '#FCE7F3', color: '#DB2777' }
      case 'FINANCE':
        return { text: 'Tài chính', bg: '#DBEAFE', color: '#2563EB' }
      case 'BUDGET':
        return { text: 'Ngân sách', bg: '#F3E8FF', color: '#7C3AED' }
      case 'SUPPORT':
        return { text: 'Hỗ trợ', bg: '#E0F2FE', color: '#0369A1' }
      case 'GENERAL':
        return null
      default:
        return null
    }
  }

  if (!renderModal) {
    return null
  }

  const inputBottomPadding = keyboardOpen ? 6 : Math.max(insets.bottom, 12)

  return (
    <Modal
      visible={renderModal}
      animationType="none"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, localStyles.backdrop, backdropAnimatedStyle]}
        />
        <Pressable
          style={styles.backdropTouchable}
          onPress={handleClose}
          accessibilityRole="button"
        />

        <Animated.View style={[styles.sheet, sheetAnimatedStyle]}>
          <LinearGradient
            colors={[PASTEL_PALETTE.lavenderSoft, '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.headerTopRow}>
              <View style={styles.headerBrand}>
                <View style={styles.headerAvatar}>
                  <Image source={ROBOT_AVATAR} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headerTitle}>Trợ lý AI SmartSpend</Text>
                  <Text style={styles.headerSubtitle}>Hỏi về thu chi, ngân sách, danh mục…</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleNewConversation} style={styles.closeButton} hitSlop={8} accessibilityLabel="Cuộc trò chuyện mới">
                <Ionicons name="add" size={20} color="#475569" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton} hitSlop={8}>
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            ref={scrollViewRef}
            style={styles.chatArea}
            contentContainerStyle={styles.chatAreaContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            onContentSizeChange={scrollToEnd}
          >
            {messages.map((msg) => {
              const badge = getModuleBadge(msg.moduleType)
              return (
                <View
                  key={msg.id}
                  style={[styles.messageRow, msg.isUser ? styles.messageRowUser : styles.messageRowAI]}
                >
                  {!msg.isUser && <AiRobotAvatar size={34} />}

                  <View
                    style={[
                      styles.messageBubbleContainer,
                      msg.isUser && styles.messageBubbleContainerUser,
                    ]}
                  >
                    {!msg.isUser && badge && (
                      <View style={[styles.moduleBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.moduleBadgeText, { color: badge.color }]}>
                          {badge.text}
                        </Text>
                      </View>
                    )}

                    <View
                      style={[
                        styles.messageBubble,
                        msg.isUser ? styles.messageBubbleUser : styles.messageBubbleAI,
                      ]}
                    >
                      <Text style={msg.isUser ? styles.messageTextUser : styles.messageTextAI}>
                        {msg.text}
                      </Text>
                    </View>

                    {!msg.isUser &&
                      msg.cards?.map((card, idx) => (
                        <View key={idx} style={styles.cardContainer}>
                          <Text style={styles.cardTitle}>{card.title}</Text>
                          {card.items.map((item, itemIdx) => (
                            <View key={itemIdx} style={styles.cardItemRow}>
                              <Text style={styles.cardItemLabel} numberOfLines={2}>
                                {item.label}
                              </Text>
                              <Text
                                style={[styles.cardItemValue, { color: item.color || Colors.primary }]}
                                numberOfLines={1}
                              >
                                {item.value}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ))}

                    {!msg.isUser && msg.actions && msg.actions.length > 0 && (
                      <View style={styles.actionRow}>
                        {msg.actions.map((action) => (
                          <TouchableOpacity
                            key={action.id}
                            style={[
                              styles.actionButton,
                              action.id.startsWith('confirm_') && styles.actionButtonPrimary,
                            ]}
                            onPress={() => handleAction(action)}
                            disabled={isLoading}
                          >
                            <Text
                              style={[
                                styles.actionButtonText,
                                action.id.startsWith('confirm_') && styles.actionButtonTextPrimary,
                              ]}
                            >
                              {action.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {!msg.isUser && msg.id !== '1' && (
                      <View style={localStyles.feedbackRow}>
                        <Text style={localStyles.feedbackLabel}>Câu trả lời hữu ích?</Text>
                        <TouchableOpacity onPress={() => handleFeedback(msg.id, true)} style={[localStyles.feedbackButton, feedback[msg.id] === 'up' && localStyles.feedbackButtonActive]} accessibilityLabel="Hữu ích">
                          <Ionicons name={feedback[msg.id] === 'up' ? 'thumbs-up' : 'thumbs-up-outline'} size={14} color={feedback[msg.id] === 'up' ? Colors.primary : '#64748B'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleFeedback(msg.id, false)} style={[localStyles.feedbackButton, feedback[msg.id] === 'down' && localStyles.feedbackButtonActive]} accessibilityLabel="Không hữu ích">
                          <Ionicons name={feedback[msg.id] === 'down' ? 'thumbs-down' : 'thumbs-down-outline'} size={14} color={feedback[msg.id] === 'down' ? Colors.primary : '#64748B'} />
                        </TouchableOpacity>
                      </View>
                    )}

                    <Text style={[styles.messageTime, msg.isUser && styles.messageTimeUser]}>
                      {msg.timestamp}
                    </Text>
                  </View>
                </View>
              )
            })}

            {isLoading && (
              <View style={[styles.messageRow, styles.messageRowAI]}>
                <AiRobotAvatar size={34} />
                <View style={styles.messageBubbleContainer}>
                  <View style={[styles.messageBubble, styles.messageBubbleAI, styles.typingIndicator]}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.typingText}>Đang suy nghĩ…</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={[styles.inputWrapper, { paddingBottom: inputBottomPadding }]}>
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Nhập câu hỏi của bạn…"
                placeholderTextColor="#94A3B8"
                value={inputText}
                onChangeText={setInputText}
                onFocus={scrollToEnd}
                multiline
                maxLength={1000}
                returnKeyType="default"
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons name="arrow-up" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const localStyles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
  },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 },
  feedbackLabel: { fontSize: 10, color: '#94A3B8', marginRight: 2 },
  feedbackButton: { width: 27, height: 27, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  feedbackButtonActive: { borderColor: '#F0A8C8', backgroundColor: '#FFF1F7' },
})

export default AIChatModal
