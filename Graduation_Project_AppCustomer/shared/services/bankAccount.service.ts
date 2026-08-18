import { ENDPOINTS } from '@/shared/api/endpoints'
import { axiosClient } from '@/shared/api/axiosClient'
import type {
  BankAccountResponse,
  LinkBankAccountRequest,
} from '@/shared/types/bankAccount'

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

function toError(err: unknown, fallback: string): Error {
  if (err instanceof Error) return err
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return new Error(message)
  }
  return new Error(fallback)
}

export async function getBankAccounts(): Promise<BankAccountResponse[]> {
  try {
    const response = await axiosClient.get(ENDPOINTS.BANK_ACCOUNT.GET_ALL)
    return unwrap(response, 'Không lấy được danh sách ngân hàng')
  } catch (err) {
    throw toError(err, 'Không lấy được danh sách ngân hàng')
  }
}

export async function linkBankAccount(
  payload: LinkBankAccountRequest,
): Promise<BankAccountResponse> {
  try {
    const response = await axiosClient.post(ENDPOINTS.BANK_ACCOUNT.GET_ALL, payload)
    return unwrap(response, 'Liên kết ngân hàng thất bại')
  } catch (err) {
    throw toError(err, 'Liên kết ngân hàng thất bại')
  }
}

export async function unlinkBankAccount(accountId: number): Promise<void> {
  try {
    await axiosClient.delete(ENDPOINTS.BANK_ACCOUNT.DELETE(accountId))
  } catch (err) {
    throw toError(err, 'Hủy liên kết ngân hàng thất bại')
  }
}
