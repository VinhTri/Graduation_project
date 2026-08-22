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

export type FinanceCenterPeriod = 'WEEK' | 'MONTH' | 'YEAR'

export interface FinanceAmountDelta {
    amount: number
    percent: number | null
}

export interface FinanceSourceFlow {
    income: number
    expense: number
    net: number
}

export interface FinanceSourceDelta {
    income: FinanceAmountDelta
    expense: FinanceAmountDelta
    net: FinanceAmountDelta
}

export interface FinancePeriodSnapshot {
    wallet: FinanceSourceFlow
    cash: FinanceSourceFlow
    fund: FinanceSourceFlow
    totalIncome: number
    totalExpense: number
    net: number
}

export interface FinanceCenterResponse {
    period: FinanceCenterPeriod
    currentLabel: string
    compareLabel: string
    currentDate: string
    compareDate: string
    walletBalance: number
    cashBalance: number
    totalAssets: number
    walletBalancePercent: number
    cashBalancePercent: number
    current: FinancePeriodSnapshot
    compare: FinancePeriodSnapshot
    delta: {
        wallet: FinanceSourceDelta
        cash: FinanceSourceDelta
        totalIncome: FinanceAmountDelta
        totalExpense: FinanceAmountDelta
        net: FinanceAmountDelta
    }
    budget: FinanceBudgetOverview
}

export interface FinanceBudgetOverview {
    activeCount: number
    totalLimit: number
    spent: number
    remaining: number
    overLimitCount: number
    atRiskCount: number
    usagePercent: number
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
    },

    getFinanceCenter: async (
        period: FinanceCenterPeriod,
        date: string,
        compareDate?: string,
    ): Promise<FinanceCenterResponse> => {
        const response: any = await axiosClient.get(ENDPOINTS.REPORT.FINANCE_CENTER, {
            params: { period, date, compareDate },
        });
        return response.data;
    },
};
