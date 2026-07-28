import { useState, useCallback } from 'react';
import { getApiBaseUrl } from '@/shared/api/axiosClient';

export interface Citation {
  sourceName: string;
  sourceUrl?: string;
  snippet: string;
  similarityScore: number;
}

export interface StructuredData {
  overview: {
    status: 'SAFE' | 'WARNING' | 'DANGER';
    currentSpent: number;
    income: number;
    daysRemaining: number;
    predictedTotal?: number;
  };
  analysis: string[];
  warnings: string[];
  suggestions: string[];
  nextActions: string[];
}

export interface Message {
  id: string;
  sender: 'USER' | 'AI';
  content: string;
  structuredData?: StructuredData;
  citations?: Citation[];
  isLoading?: boolean;
}

export const useAiChatStream = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  const loadConversationMessages = useCallback(async (conversationId: number, token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/ai/history/${conversationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const resData = await response.json();
      if (resData.success && resData.data) {
        const loaded: Message[] = resData.data.map((m: any) => ({
          id: m.messageId ? m.messageId.toString() : Math.random().toString(),
          sender: m.sender,
          content: m.content,
          structuredData: m.structuredData,
          citations: m.citations
        }));
        setMessages(loaded);
        setActiveConversationId(conversationId);
      }
    } catch (e) {
      console.error('Error fetching conversation messages:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (text: string, token: string) => {
    if (!text.trim()) return;

    const userMsgId = Date.now().toString();
    const userMsg: Message = {
      id: userMsgId,
      sender: 'USER',
      content: text,
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const aiMsgId = (Date.now() + 1).toString();
    const initialAiMsg: Message = {
      id: aiMsgId,
      sender: 'AI',
      content: '',
      isLoading: true,
    };
    
    setMessages(prev => [...prev, initialAiMsg]);

    try {
      // In mobile, we hit our REST chat endpoint. We pass current conversation ID if active
      const response = await fetch(`${getApiBaseUrl()}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: activeConversationId,
          message: text,
          stream: false // Using standard HTTP POST as default fallback for React Native compilation stability
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const data = resData.data;
        if (!activeConversationId && data.conversationId) {
          setActiveConversationId(data.conversationId);
        }

        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId 
            ? { 
                ...msg, 
                content: data.content,
                structuredData: data.structuredData,
                citations: data.citations,
                isLoading: false
              }
            : msg
        ));
      } else {
        throw new Error(resData.message || 'Unknown server error');
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { 
              ...msg, 
              content: `Lỗi kết nối: ${error.message || 'Không thể liên lạc với trợ lý AI.'}`, 
              isLoading: false 
            } 
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [activeConversationId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setActiveConversationId(null);
  }, []);

  return { messages, isLoading, sendMessage, activeConversationId, loadConversationMessages, clearChat };
};
