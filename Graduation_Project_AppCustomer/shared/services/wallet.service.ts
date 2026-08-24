import { ENDPOINTS } from '@/shared/api/endpoints'
import { axiosClient } from '@/shared/api/axiosClient'
import type {
  WalletResponse,
  WalletSettingsRequest,
  WalletTransactionResponse,
  WalletWithdrawRequest,
} from '@/shared/types/wallet'

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

export async function getWallets(): Promise<WalletResponse[]> {
  try {
    const response = await axiosClient.get(ENDPOINTS.WALLET.LIST)
    return unwrap(response, 'Không lấy được danh sách ví')
  } catch (err) {
    throw toError(err, 'Không lấy được danh sách ví')
  }
}

export async function getDefaultWallet(): Promise<WalletResponse | null> {
  const wallets = await getWallets()
  return wallets.find((wallet) => wallet.isDefault) ?? wallets[0] ?? null
}

export async function getDefaultWalletBalance(): Promise<number> {
  const wallet = await getDefaultWallet()
  return Number(wallet?.balance ?? 0)
}

export async function updateWalletSettings(
  walletId: number,
  payload: WalletSettingsRequest,
): Promise<WalletResponse> {
  try {
    const response = await axiosClient.put(ENDPOINTS.WALLET.UPDATE_SETTINGS(walletId), payload)
    return unwrap(response, 'Cập nhật thiết lập ví thất bại')
  } catch (err) {
    throw toError(err, 'Cập nhật thiết lập ví thất bại')
  }
}

export async function withdrawWallet(
  payload: WalletWithdrawRequest,
): Promise<WalletTransactionResponse> {
  try {
    const response = await axiosClient.post(ENDPOINTS.WALLET.WITHDRAW, payload)
    return unwrap(response, 'Rút tiền thất bại')
  } catch (err) {
    throw toError(err, 'Rút tiền thất bại')
  }
}

export async function getWalletTransactions(): Promise<WalletTransactionResponse[]> {
  try {
    const response = await axiosClient.get(ENDPOINTS.WALLET.TRANSACTIONS)
    return unwrap(response, 'Không lấy được lịch sử ví')
  } catch (err) {
    throw toError(err, 'Không lấy được lịch sử ví')
  }
}
