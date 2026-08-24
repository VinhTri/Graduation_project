import { ENDPOINTS } from '@/shared/api/endpoints'
import { axiosClient } from '@/shared/api/axiosClient'
import type {
  ChangePasswordRequest,
  ChangePinRequest,
  VerifyPasswordRequest,
  VerifyPinRequest,
} from '@/shared/types/auth'

type ApiEnvelope<T> = {
  success?: boolean
  message?: string
  data?: T
}

function unwrapMessage(response: ApiEnvelope<void> | void, fallback: string): string {
  if (response && typeof response === 'object' && 'message' in response) {
    const message = (response as ApiEnvelope<void>).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return fallback
}

function toError(err: unknown, fallback: string): Error {
  if (err instanceof Error) return err
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return new Error(message)
  }
  return new Error(fallback)
}

export async function verifyCurrentPassword(payload: VerifyPasswordRequest): Promise<void> {
  try {
    await axiosClient.post(ENDPOINTS.ACCOUNT.VERIFY_PASSWORD, payload)
  } catch (err) {
    throw toError(err, 'Mật khẩu hiện tại không đúng!')
  }
}

export async function verifyCurrentPin(payload: VerifyPinRequest): Promise<void> {
  try {
    await axiosClient.post(ENDPOINTS.ACCOUNT.VERIFY_PIN, payload)
  } catch (err) {
    throw toError(err, 'Mã PIN hiện tại không đúng!')
  }
}

export async function changePassword(payload: ChangePasswordRequest): Promise<string> {
  try {
    const response = await axiosClient.post(ENDPOINTS.ACCOUNT.CHANGE_PASSWORD, payload)
    return unwrapMessage(response, 'Mật khẩu đã đổi thành công!')
  } catch (err) {
    throw toError(err, 'Không thể đổi mật khẩu')
  }
}

export async function changePin(payload: ChangePinRequest): Promise<string> {
  try {
    const response = await axiosClient.post(ENDPOINTS.ACCOUNT.CHANGE_PIN, payload)
    return unwrapMessage(response, 'Mã PIN đã thay đổi thành công!')
  } catch (err) {
    throw toError(err, 'Không thể đổi mã PIN')
  }
}
