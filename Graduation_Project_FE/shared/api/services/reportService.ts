import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';

export interface ReportDistributionResponse {
    categoryId: number | null;
    categoryName: string;
    icon: string;
    color: string;
    totalAmount: number;
    percentage: number;
}

export interface ReportTrendResponse {
    label: string;
    value: number;
    isCurrent: boolean;
}

export const reportService = {
    getDistributionReport: async (type: 'EXPENSE' | 'INCOME', filter: string, date: string): Promise<ReportDistributionResponse[]> => {
        try {
            const response: any = await axiosClient.get(ENDPOINTS.REPORT.DISTRIBUTION, {
                params: { type, filter, date }
            });
            return response.data || [];
        } catch (error) {
            console.error("Error fetching distribution report:", error);
            return [];
        }
    },

    getGroupDistributionReport: async (type: 'EXPENSE' | 'INCOME', filter: string, date: string): Promise<ReportDistributionResponse[]> => {
        try {
            const response: any = await axiosClient.get(ENDPOINTS.REPORT.DISTRIBUTION, {
                params: { type, filter, date, groupBy: 'GROUP' }
            });
            return response.data || [];
        } catch (error) {
            console.error("Error fetching group distribution report:", error);
            return [];
        }
    },

    getTrendReport: async (type: 'EXPENSE' | 'INCOME', filter: string, date: string): Promise<ReportTrendResponse[]> => {
        try {
            const response: any = await axiosClient.get(ENDPOINTS.REPORT.TREND, {
                params: { type, filter, date }
            });
            return response.data || [];
        } catch (error) {
            console.error("Error fetching trend report:", error);
            return [];
        }
    }
};
