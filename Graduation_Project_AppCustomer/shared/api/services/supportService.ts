import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
export type SupportSenderType = 'USER' | 'ADMIN';

export interface CustomerSupportMessage {
  id: number;
  content: string;
  senderType: SupportSenderType;
  senderUsername?: string;
  createdAt: string;
}

export interface CustomerSupportTicket {
  id: number;
  subject: string;
  status: SupportTicketStatus;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  messages?: CustomerSupportMessage[];
}

export interface CreateSupportTicketPayload {
  subject: string;
  content: string;
}

export interface SendSupportMessagePayload {
  content: string;
}

export const supportService = {
  getMyTickets: async (): Promise<{ success: boolean; data: CustomerSupportTicket[]; message?: string }> => {
    const response: any = await axiosClient.get(ENDPOINTS.SUPPORT.TICKETS);
    return response;
  },

  getMyTicketDetail: async (id: number): Promise<{ success: boolean; data: CustomerSupportTicket; message?: string }> => {
    const response: any = await axiosClient.get(ENDPOINTS.SUPPORT.TICKET_DETAIL(id));
    return response;
  },

  createTicket: async (payload: CreateSupportTicketPayload): Promise<{ success: boolean; data: CustomerSupportTicket; message?: string }> => {
    const response: any = await axiosClient.post(ENDPOINTS.SUPPORT.CREATE_TICKET, payload);
    return response;
  },

  sendMessage: async (ticketId: number, payload: SendSupportMessagePayload): Promise<{ success: boolean; data: CustomerSupportMessage; message?: string }> => {
    const response: any = await axiosClient.post(ENDPOINTS.SUPPORT.SEND_MESSAGE(ticketId), payload);
    return response;
  },
};
