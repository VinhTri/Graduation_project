import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAiChatStream, Message, Citation } from '../hooks/useAiChatStream';
import { PredictionChartCard } from '../components/PredictionChartCard';

export const AiAssistantScreen: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const { messages, isLoading, sendMessage, clearChat } = useAiChatStream();
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const token = await AsyncStorage.getItem('token') || '';
    sendMessage(inputText, token);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSuggestionPress = async (promptText: string) => {
    const token = await AsyncStorage.getItem('token') || '';
    sendMessage(promptText, token);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessageBubble = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'USER';

    return (
      <View style={[styles.bubbleContainer, isUser ? styles.userAlign : styles.aiAlign]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          {item.isLoading ? (
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color="#0a84ff" />
              <Text style={styles.loadingText}>AI đang phân tích dữ liệu...</Text>
            </View>
          ) : (
            <Text style={styles.messageText}>{item.content}</Text>
          )}
        </View>

        {/* Structured Financial Cards */}
        {!isUser && item.structuredData && (item.structuredData.overview.currentSpent > 0 || item.structuredData.overview.income > 0) && (
          <PredictionChartCard
            currentSpent={item.structuredData.overview.currentSpent}
            predictedTotal={item.structuredData.overview.predictedTotal || (item.structuredData.overview.currentSpent * 1.25)}
            budgetLimit={item.structuredData.overview.income}
            categoryTrends={item.structuredData.analysis.map(a => ({
              category: a.length > 20 ? a.substring(0, 17) + '...' : a,
              trend: a.includes('tăng') || a.includes('vượt') ? 'UP' : 'DOWN',
              percentage: 15
            }))}
          />
        )}

        {/* Citation Sources */}
        {!isUser && item.citations && item.citations.length > 0 && (
          <View style={styles.citationContainer}>
            <Text style={styles.citationTitle}>Nguồn tài liệu tham khảo:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.citationScroll}>
              {item.citations.map((cit, idx) => (
                <TouchableOpacity key={idx} style={styles.citationBadge}>
                  <Text style={styles.citationBadgeText}>📖 {cit.sourceName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Trợ lý tài chính</Text>
            <Text style={styles.headerSubtitle}>Trợ lý AI thông minh của bạn</Text>
          </View>
          <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Xóa chat</Text>
          </TouchableOpacity>
        </View>

        {/* Chat Message List */}
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.welcomeEmoji}>🤖</Text>
            <Text style={styles.welcomeTitle}>Chào mừng bạn đến với AI Assistant!</Text>
            <Text style={styles.welcomeSubtitle}>
              Tôi có thể tư vấn tài chính, phân tích chi tiêu và giải đáp thắc mắc về ứng dụng.
            </Text>

            {/* Quick Action Suggestion Chips */}
            <View style={styles.suggestionGrid}>
              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress('Phân tích chi tiêu tháng này giúp tôi')}
              >
                <Text style={styles.suggestionText}>📊 Phân tích chi tiêu</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress('Cuối tháng tôi có nguy cơ vượt ngân sách không?')}
              >
                <Text style={styles.suggestionText}>📈 Dự báo vượt ngân sách</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress('Làm sao tiết kiệm chi tiêu ăn uống?')}
              >
                <Text style={styles.suggestionText}>💡 Gợi ý tiết kiệm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress('Làm sao tạo ví nhóm trên ứng dụng?')}
              >
                <Text style={styles.suggestionText}>❓ Hỏi cách tạo ví nhóm</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessageBubble}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Hỏi AI trợ lý của bạn..."
            placeholderTextColor="#8e8e93"
            value={inputText}
            onChangeText={setInputText}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>Gửi</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: '#38383a',
    backgroundColor: '#1c1c1e',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#30d158',
    fontSize: 12,
    marginTop: 2,
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#2c2c2e',
  },
  clearButtonText: {
    color: '#ff453a',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  welcomeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: '#8e8e93',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  suggestionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  suggestionChip: {
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: '#38383a',
  },
  suggestionText: {
    color: '#0a84ff',
    fontSize: 13,
    fontWeight: '500',
  },
  messageList: {
    padding: 16,
  },
  bubbleContainer: {
    marginVertical: 8,
    maxWidth: '85%',
  },
  userAlign: {
    alignSelf: 'flex-end',
  },
  aiAlign: {
    alignSelf: 'flex-start',
    width: '100%',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#0a84ff',
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    backgroundColor: '#1c1c1e',
    borderBottomLeftRadius: 2,
    borderWidth: 0.5,
    borderColor: '#38383a',
  },
  messageText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  loadingText: {
    color: '#8e8e93',
    marginLeft: 8,
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderColor: '#38383a',
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#2c2c2e',
    color: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#0a84ff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sendButtonDisabled: {
    backgroundColor: '#2c2c2e',
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  citationContainer: {
    marginTop: 8,
    paddingLeft: 4,
  },
  citationTitle: {
    color: '#8e8e93',
    fontSize: 11,
    marginBottom: 4,
  },
  citationScroll: {
    flexDirection: 'row',
  },
  citationBadge: {
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    borderWidth: 0.5,
    borderColor: '#38383a',
  },
  citationBadgeText: {
    color: '#30d158',
    fontSize: 11,
  }
});
