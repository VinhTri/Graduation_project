import { axiosClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AI_CONVERSATION_KEY = 'smartspend_ai_conversation_id';

export interface AiChatAction {
  id: string;
  label: string;
  type: 'SEND_MESSAGE' | 'NAVIGATE' | string;
  route?: string;
  payload?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  moduleType?: 'RAG' | 'ANALYTICS' | 'RECOMMENDATION' | 'CATEGORY' | 'FINANCE' | 'BUDGET' | 'SUPPORT' | 'GENERAL';
  cards?: {
    type: 'METRICS' | 'BUDGET_SPLIT' | 'GOAL_PLAN' | 'CATEGORY_LIST' | 'CATEGORY_PREVIEW' | 'FINANCE_SUMMARY' | 'SPENDING_RANK' | 'BUDGET_STATUS';
    title: string;
    items: { label: string; value: string; color?: string }[];
  }[];
  actions?: AiChatAction[];
}

export interface ChatMessageHistoryDto {
  role: 'user' | 'assistant' | 'model' | string;
  content: string;
}

class AIChatService {
  async startNewConversation(): Promise<void> {
    await AsyncStorage.removeItem(AI_CONVERSATION_KEY);
  }
  async submitFeedback(messageId: string, helpful: boolean): Promise<void> {
    await axiosClient.post(ENDPOINTS.AI.FEEDBACK, { messageId, rating: helpful ? 'HELPFUL' : 'NOT_HELPFUL' });
  }
  async processMessage(userPrompt: string, history?: ChatMessageHistoryDto[]): Promise<ChatMessage> {
    const message = userPrompt.trim();
    const conversationId = await AsyncStorage.getItem(AI_CONVERSATION_KEY);
    const response: any = await axiosClient.post(ENDPOINTS.AI.CHAT, {
      conversationId: conversationId || undefined,
      message,
      history: conversationId ? [] : (history || []).slice(-20),
    });

    const item = response?.data?.data ?? response?.data ?? response;
    if (!item?.text) {
      throw new Error('AI response missing text');
    }
    if (item.conversationId) await AsyncStorage.setItem(AI_CONVERSATION_KEY, item.conversationId);

    return {
      id: item.id || Date.now().toString(),
      text: item.text,
      isUser: false,
      timestamp:
        item.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      moduleType: item.moduleType || 'GENERAL',
      cards: item.cards || undefined,
      actions: item.actions || undefined,
    };
  }
}

export const aiChatService = new AIChatService();
