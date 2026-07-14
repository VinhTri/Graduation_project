import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';

export interface InvoiceRequest {
  invoiceName: string;
  amount: number;
  dueDate: string;
  reminderOption: string;
  reminderTime?: string;
  isPaid: boolean;
}

export interface InvoiceResponse {
  id: number;
  invoiceName: string;
  amount: number;
  dueDate: string;
  reminderOption: string;
  reminderTime?: string;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export const invoiceService = {
  createInvoice: async (data: InvoiceRequest) => {
    const response = await axiosClient.post(ENDPOINTS.INVOICE.BASE, data);
    return response;
  },

  getInvoices: async () => {
    const response = await axiosClient.get(ENDPOINTS.INVOICE.BASE);
    return response;
  },

  getInvoiceById: async (id: number) => {
    const response = await axiosClient.get(ENDPOINTS.INVOICE.DETAIL(id));
    return response;
  },

  updateInvoice: async (id: number, data: InvoiceRequest) => {
    const response = await axiosClient.put(ENDPOINTS.INVOICE.DETAIL(id), data);
    return response;
  },

  updateInvoiceStatus: async (id: number, isPaid: boolean) => {
    const response = await axiosClient.patch(ENDPOINTS.INVOICE.STATUS(id), null, {
      params: { isPaid }
    });
    return response;
  },

  deleteInvoice: async (id: number) => {
    const response = await axiosClient.delete(ENDPOINTS.INVOICE.DETAIL(id));
    return response;
  }
};
