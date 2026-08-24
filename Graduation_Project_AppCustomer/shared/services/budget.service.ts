import { ENDPOINTS } from '@/shared/api/endpoints'
import { axiosClient } from '@/shared/api/axiosClient'
import type {
  BudgetResponse,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from '@/shared/types/budget'

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
    if (typeof message === 'string' && message.trim()) {
      return new Error(message)
    }
  }
  return new Error(fallback)
}

export async function getBudgets(): Promise<BudgetResponse[]> {
  try {
    const response = await axiosClient.get(ENDPOINTS.BUDGET.LIST)
    return unwrap(response, 'Không lấy được danh sách ngân sách')
  } catch (err) {
    throw toError(err, 'Không lấy được danh sách ngân sách')
  }
}

export async function getBudget(budgetId: number): Promise<BudgetResponse> {
  try {
    const response = await axiosClient.get(ENDPOINTS.BUDGET.DETAIL(budgetId))
    return unwrap(response, 'Không lấy được ngân sách')
  } catch (err) {
    throw toError(err, 'Không lấy được ngân sách')
  }
}

export async function createBudget(payload: CreateBudgetRequest): Promise<BudgetResponse> {
  try {
    const response = await axiosClient.post(ENDPOINTS.BUDGET.LIST, payload)
    return unwrap(response, 'Tạo ngân sách thất bại')
  } catch (err) {
    throw toError(err, 'Tạo ngân sách thất bại')
  }
}

export async function updateBudget(
  budgetId: number,
  payload: UpdateBudgetRequest,
): Promise<BudgetResponse> {
  try {
    const response = await axiosClient.patch(ENDPOINTS.BUDGET.DETAIL(budgetId), payload)
    return unwrap(response, 'Cập nhật ngân sách thất bại')
  } catch (err) {
    throw toError(err, 'Cập nhật ngân sách thất bại')
  }
}

export async function deleteBudget(budgetId: number): Promise<void> {
  try {
    await axiosClient.delete(ENDPOINTS.BUDGET.DETAIL(budgetId))
  } catch (err) {
    throw toError(err, 'Xóa ngân sách thất bại')
  }
}
