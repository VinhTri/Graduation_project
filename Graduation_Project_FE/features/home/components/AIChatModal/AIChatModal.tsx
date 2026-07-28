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
  Keyboard,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./AIChatModal.styles";
import Colors from "@/shared/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAiChatStream } from "@/features/ai/hooks/useAiChatStream";
import { PredictionChartCard } from "@/features/ai/components/PredictionChartCard";

interface AIChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({ visible, onClose }) => {
  const { messages: hookMessages, isLoading, sendMessage, clearChat } = useAiChatStream();
  const [inputText, setInputText] = useState("");

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const token = await AsyncStorage.getItem("token") || "";
    sendMessage(inputText, token);
    setInputText("");
    Keyboard.dismiss();
  };

  // Map hook messages structure to UI expectations
  const displayMessages = hookMessages.map(m => ({
    id: m.id,
    text: m.content || "...",
    isUser: m.sender === "USER",
    isLoading: m.isLoading,
    structuredData: m.structuredData
  }));

  const chatMessages = displayMessages.length === 0
    ? [{ id: "1", text: "Chào bạn, tôi là trợ lý AI SmartSpend. Tôi có thể giúp gì cho bạn hôm nay?", isUser: false, isLoading: false, structuredData: null }]
    : displayMessages;

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
            {chatMessages.map((msg) => (
              <View key={msg.id} style={{ width: "100%", marginVertical: 4 }}>
                <View style={[styles.messageRow, msg.isUser ? styles.messageRowUser : styles.messageRowAI]}>
                  {!msg.isUser && (
                    <View style={styles.aiAvatar}>
                      <Ionicons name="sparkles" size={18} color={Colors.white} />
                    </View>
                  )}
                  <View style={[styles.messageBubble, msg.isUser ? styles.messageBubbleUser : styles.messageBubbleAI]}>
                    {msg.isLoading ? (
                      <ActivityIndicator size="small" color={msg.isUser ? Colors.white : Colors.black} style={{ padding: 4 }} />
                    ) : (
                      <Text style={msg.isUser ? styles.messageTextUser : styles.messageTextAI}>
                        {msg.text}
                      </Text>
                    )}
                  </View>
                </View>
                {!msg.isUser && msg.structuredData && (msg.structuredData.overview.currentSpent > 0 || msg.structuredData.overview.income > 0) && (
                  <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
                    <PredictionChartCard
                      currentSpent={msg.structuredData.overview.currentSpent}
                      predictedTotal={msg.structuredData.overview.predictedTotal || (msg.structuredData.overview.currentSpent * 1.15)}
                      budgetLimit={msg.structuredData.overview.income}
                      categoryTrends={msg.structuredData.analysis.map((a: string) => ({
                        category: a.length > 25 ? a.substring(0, 22) + "..." : a,
                        trend: a.includes("tăng") || a.includes("vượt") ? "UP" : "DOWN",
                        percentage: 15
                      }))}
                    />
                  </View>
                )}
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
