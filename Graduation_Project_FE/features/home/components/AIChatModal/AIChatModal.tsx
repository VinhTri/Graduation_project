import React, { useState } from "react";
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Keyboard
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./AIChatModal.styles";
import Colors from "@/shared/constants/Colors";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface AIChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({ visible, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Chào bạn, tôi là trợ lý AI SmartSpend. Tôi có thể giúp gì cho bạn hôm nay?", isUser: false }
  ]);
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (!inputText.trim()) return;

    // Add user message
    const newUserMsg: Message = { id: Date.now().toString(), text: inputText, isUser: true };
    setMessages(prev => [...prev, newUserMsg]);
    setInputText("");
    Keyboard.dismiss();

    // Mock AI response
    setTimeout(() => {
      const aiResponse: Message = { 
        id: (Date.now() + 1).toString(), 
        text: "Tính năng này đang được phát triển. AI sẽ sớm hỗ trợ bạn!", 
        isUser: false 
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
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
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Trợ lý AI SmartSpend</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Chat Area */}
          <ScrollView 
            style={styles.chatArea} 
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => (
              <View key={msg.id} style={[styles.messageRow, msg.isUser ? styles.messageRowUser : styles.messageRowAI]}>
                {!msg.isUser && (
                  <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={18} color={Colors.white} />
                  </View>
                )}
                <View style={[styles.messageBubble, msg.isUser ? styles.messageBubbleUser : styles.messageBubbleAI]}>
                  <Text style={msg.isUser ? styles.messageTextUser : styles.messageTextAI}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Input Area */}
          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              placeholder="Nhập tin nhắn..."
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
