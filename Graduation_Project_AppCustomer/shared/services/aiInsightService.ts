import { axiosClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

export interface HomeInsightResponse {
  message: string;
  periodLabel?: string;
  insightType?: string;
  hints?: string[];
}

class AiInsightService {
  async getHomeInsight(): Promise<HomeInsightResponse> {
    const response: any = await axiosClient.get(ENDPOINTS.AI.HOME_INSIGHT);
    const data = response?.data?.data ?? response?.data ?? response;
    return {
      message: data?.message || 'Hỏi Trợ lý AI để xem gợi ý tài chính cá nhân.',
      periodLabel: data?.periodLabel,
      insightType: data?.insightType,
      hints: data?.hints,
    };
  }
}

export const aiInsightService = new AiInsightService();
