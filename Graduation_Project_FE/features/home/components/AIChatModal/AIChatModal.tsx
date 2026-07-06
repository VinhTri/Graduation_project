import React, { useState, useEffect, useRef } from "react";
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
import { getGeminiChatSession } from "@/shared/api/services/aiService";
import { walletService } from "@/shared/api/services/walletService";
import { userService } from "@/shared/api/services/userService";
import { reportService } from "@/shared/api/services/reportService";
import { useRouter } from "expo-router";

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
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Chào bạn, tôi là trợ lý AI SmartSpend. Tôi có thể giúp gì cho bạn hôm nay?", isUser: false }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [userInfo, setUserInfo] = useState<any>(null);
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [chatSession, setChatSession] = useState<any>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      // Fetch user & wallet info to initialize chat session
      const initializeChat = async () => {
        try {
          const userRes = await userService.getProfile();
          const walletRes = await walletService.getMyWallet();
          
          setUserInfo(userRes?.data || {});
          setWalletInfo(walletRes || {});
          
          const session = getGeminiChatSession(
            JSON.stringify(userRes?.data || {}), 
            JSON.stringify(walletRes || {})
          );
          setChatSession(session);
        } catch (error) {
          console.log("Error initializing AI Chat:", error);
          // Initialize even if failed to fetch context
          const session = getGeminiChatSession("User not found", "Wallet not found");
          setChatSession(session);
        }
      };
      initializeChat();
    }
  }, [visible]);

  const handleSend = async () => {
    if (!inputText.trim() || !chatSession) return;

    const userText = inputText.trim();
    const newUserMsg: Message = { id: Date.now().toString(), text: userText, isUser: true };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputText("");
    Keyboard.dismiss();
    setIsLoading(true);

    try {
      const result = await chatSession.sendMessage(userText);
      const response = await result.response;
      
      // Check if model called a function
      const functionCalls = response.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          if (call.name === "navigate_screen") {
            const { screen, amount } = call.args;
            const screenNames: Record<string, string> = {
              'topup': 'nạp tiền',
              'withdraw': 'rút tiền',
              'wallet': 'ví',
              'funds': 'quỹ',
              'categories': 'danh mục'
            };
            const screenName = screenNames[screen as string] || screen;
            let aiText = `Đang chuyển hướng bạn đến màn hình ${screenName}...`;
            
            const aiMsg: Message = { id: Date.now().toString(), text: aiText, isUser: false };
            setMessages(prev => [...prev, aiMsg]);
            
            // Navigate
            onClose(); // Close chat modal first
            setTimeout(() => {
              const routeMap: Record<string, string> = {
                'topup': '/wallet/topup',
                'withdraw': '/wallet/withdraw',
                'wallet': '/wallet',
                'funds': '/funds',
                'categories': '/categories'
              };
              const route = routeMap[screen as string] || '/wallet';
              const url = amount ? `${route}?amount=${amount}` : route;
              router.push(url as any);
            }, 500);
            
            // Send function response back to model if needed
            await chatSession.sendMessage([{
              functionResponse: {
                name: "navigate_screen",
                response: { success: true }
              }
            }]);
          } else if (call.name === "get_spending_report") {
            const { timeframe } = call.args;
            const reportData = await reportService.getDistributionReport('EXPENSE', timeframe, new Date().toISOString());
            
            // Send the data back to Gemini so it can generate an answer
            const followUpResult = await chatSession.sendMessage([{
              functionResponse: {
                name: "get_spending_report",
                response: { data: reportData }
              }
            }]);
            
            const text = followUpResult.response.text();
            const aiMsg: Message = { id: Date.now().toString(), text, isUser: false };
            setMessages(prev => [...prev, aiMsg]);
          }
        }
      } else {
        const text = response.text();
        const aiMsg: Message = { id: Date.now().toString(), text, isUser: false };
        setMessages(prev => [...prev, aiMsg]);
      }
      
    } catch (error: any) {
      console.log("AI Chat error:", error);
      const errorMsg: Message = { id: Date.now().toString(), text: `Xin lỗi, đã có lỗi xảy ra khi kết nối với AI. Chi tiết: ${error.message || JSON.stringify(error)}`, isUser: false };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
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
            ref={scrollViewRef}
            style={styles.chatArea} 
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
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
            {isLoading && (
              <View style={[styles.messageRow, styles.messageRowAI]}>
                 <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={18} color={Colors.white} />
                  </View>
                 <View style={[styles.messageBubble, styles.messageBubbleAI, { padding: 10 }]}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                 </View>
              </View>
            )}
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
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]} 
              onPress={handleSend}
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
