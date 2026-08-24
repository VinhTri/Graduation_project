import { ENDPOINTS } from '@/shared/api/endpoints'
import { axiosClient } from '@/shared/api/axiosClient'
import type {
  NotebookBookResponse,
  NotebookPeriod,
  NotebookTransactionRequest,
  NotebookTransactionResponse,
} from '@/shared/types/notebook'

type ApiEnvelope<T> = {
  success?: boolean
  message?: string
  data?: T
}

function unwrap<T>(response: ApiEnvelope<T> | T, fallback: string): T {
  if (response && typeof response === 'object' && 'data' in (response as object)) {
    const envelope = response as ApiEnvelope<T>
    if (envelope.data !== undefined && envelope.data !== null) {
      return envelope.data
    }
  }
  if (response !== undefined && response !== null && !('data' in (response as object))) {
    return response as T
  }
  throw new Error(fallback)
}

export async function getCashNotebook(): Promise<NotebookBookResponse> {
  const response = await axiosClient.get(ENDPOINTS.NOTEBOOK.CASH)
  return unwrap(response, 'Không lấy được sổ tiền mặt')
}

export async function getNotebookTransactions(
  bookId: number,
  period: NotebookPeriod,
): Promise<NotebookTransactionResponse[]> {
  const response = await axiosClient.get(ENDPOINTS.NOTEBOOK.TRANSACTIONS(bookId, period))
  return unwrap(response, 'Không lấy được giao dịch sổ tay') || []
}

export async function getNotebookTransaction(
  transactionCode: string,
): Promise<NotebookTransactionResponse> {
  const response = await axiosClient.get(ENDPOINTS.NOTEBOOK.TRANSACTION_DETAIL(transactionCode))
  return unwrap(response, 'Không lấy được chi tiết giao dịch')
}

export async function createNotebookTransaction(
  payload: NotebookTransactionRequest,
): Promise<NotebookTransactionResponse> {
  const response = await axiosClient.post(ENDPOINTS.NOTEBOOK.CREATE_TRANSACTION, payload)
  return unwrap(response, 'Không ghi chép được giao dịch')
}

export async function updateNotebookTransaction(
  transactionCode: string,
  payload: NotebookTransactionRequest,
): Promise<NotebookTransactionResponse> {
  const response = await axiosClient.put(
    ENDPOINTS.NOTEBOOK.UPDATE_TRANSACTION(transactionCode),
    payload,
  )
  return unwrap(response, 'Không cập nhật được giao dịch')
}

export async function deleteNotebookTransaction(transactionCode: string): Promise<void> {
  await axiosClient.delete(ENDPOINTS.NOTEBOOK.DELETE_TRANSACTION(transactionCode))
}
