import { axiosClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

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
  moduleType?: 'RAG' | 'ANALYTICS' | 'RECOMMENDATION' | 'CATEGORY' | 'FINANCE' | 'GENERAL';
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
  async processMessage(userPrompt: string, history?: ChatMessageHistoryDto[]): Promise<ChatMessage> {
    const message = userPrompt.trim();
    const response: any = await axiosClient.post(ENDPOINTS.AI.CHAT, {
      message,
      history: history || [],
    });

    const item = response?.data?.data ?? response?.data ?? response;
    if (!item?.text) {
      throw new Error('AI response missing text');
    }

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
