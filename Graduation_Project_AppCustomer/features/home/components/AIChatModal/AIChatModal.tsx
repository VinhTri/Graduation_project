import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Keyboard,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { styles } from "./AIChatModal.styles";
import Colors from "@/shared/constants/Colors";
import { aiChatService, ChatMessage, QUICK_SUGGESTIONS, QuickSuggestion } from "@/shared/services/aiChatService";

interface AIChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: "1", 
      text: "Xin chào! Tôi là Trợ lý AI SmartSpend.\n\nTôi có thể hỗ trợ bạn:\n1. Hướng dẫn ứng dụng (Ngân sách, Nạp/Rút tiền, Danh mục, Tạo ví, Quên PIN...)\n2. Phân tích chi tiết thu chi cá nhân\n3. Tư vấn lập ngân sách & lộ trình tiết kiệm mục tiêu\n\nBạn cần hỗ trợ điều gì hôm nay?", 
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      moduleType: 'RAG'
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [visible, messages]);

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputText;
    if (!promptToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { 
      id: Date.now().toString(), 
      text: promptToSend, 
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInputText("");
    Keyboard.dismiss();
    setIsLoading(true);

    const historyDto = messages
      .filter(m => m.text && !m.text.includes("Xin chào! Tôi là Trợ lý AI SmartSpend"))
      .map(m => ({
        role: m.isUser ? ('user' as const) : ('assistant' as const),
        content: m.text
      }));

    try {
      const response = await aiChatService.processMessage(promptToSend, historyDto);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error("AI Response error:", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        text: "Có lỗi xảy ra khi kết nối với Trợ lý AI. Vui lòng thử lại sau!",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: { label: string; route?: string; prompt?: string }) => {
    if (action.route) {
      onClose(); // Close modal
      setTimeout(() => {
        router.push(action.route as any); // Navigate to target screen
      }, 300);
    } else if (action.prompt) {
      handleSend(action.prompt);
    }
  };

  const getModuleBadge = (moduleType?: ChatMessage['moduleType']) => {
    switch (moduleType) {
      case 'RAG':
        return { text: '📖 Hướng dẫn & Sử dụng', bg: '#EEF2FF', color: '#4F46E5' };
      case 'ANALYTICS':
        return { text: '📊 Phân tích chi tiêu', bg: '#FEF3C7', color: '#D97706' };
      case 'RECOMMENDATION':
        return { text: '💡 Tư vấn tài chính', bg: '#D1FAE5', color: '#059669' };
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          activeOpacity={1} 
          onPress={onClose} 
        />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.headerIconBadge}>
                <Ionicons name="sparkles" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Trợ lý AI SmartSpend</Text>
                <Text style={styles.headerSubtitle}>Trợ lý tài chính & Tri thức 24/7</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Quick Suggestion Chips */}
          <View style={styles.suggestionsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {QUICK_SUGGESTIONS.map((item: QuickSuggestion) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionChip}
                  onPress={() => handleSend(item.prompt)}
                  disabled={isLoading}
                >
                  <Text style={styles.suggestionChipText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Chat Messages Area */}
          <ScrollView 
            ref={scrollViewRef}
            style={styles.chatArea} 
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => {
              const badge = getModuleBadge(msg.moduleType);
              return (
                <View 
                  key={msg.id} 
                  style={[
                    styles.messageRow, 
                    msg.isUser ? styles.messageRowUser : styles.messageRowAI
                  ]}
                >
                  {!msg.isUser && (
                    <View style={styles.aiAvatar}>
                      <Ionicons name="sparkles" size={16} color={Colors.white} />
                    </View>
                  )}

                  <View style={styles.messageBubbleContainer}>
                    {!msg.isUser && badge && (
                      <View style={[styles.moduleBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.moduleBadgeText, { color: badge.color }]}>
                          {badge.text}
                        </Text>
                      </View>
                    )}

                    <View style={[
                      styles.messageBubble, 
                      msg.isUser ? styles.messageBubbleUser : styles.messageBubbleAI
                    ]}>
                      <Text style={msg.isUser ? styles.messageTextUser : styles.messageTextAI}>
                        {msg.text}
                      </Text>
                    </View>

                    {/* Financial Data Cards */}
                    {!msg.isUser && msg.cards && msg.cards.map((card, idx) => (
                      <View key={idx} style={styles.cardContainer}>
                        <Text style={styles.cardTitle}>{card.title}</Text>
                        {card.items.map((item, itemIdx) => (
                          <View key={itemIdx} style={styles.cardItemRow}>
                            <Text style={styles.cardItemLabel}>{item.label}</Text>
                            <Text style={[
                              styles.cardItemValue, 
                              { color: item.color || Colors.primary }
                            ]}>
                              {item.value}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}

            {/* Loading Typing Indicator */}
            {isLoading && (
              <View style={styles.messageRow}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={16} color={Colors.white} />
                </View>
                <View style={[styles.messageBubble, styles.messageBubbleAI, styles.typingIndicator]}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.typingText}>AI đang phân tích và chuẩn bị câu trả lời...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              placeholder="Nhập câu hỏi (VD: nạp rút, ngân sách, danh mục...)"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled
              ]} 
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons name="send" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
