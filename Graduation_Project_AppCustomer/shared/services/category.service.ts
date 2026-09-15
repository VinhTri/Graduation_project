import { ENDPOINTS } from '@/shared/api/endpoints'
import { axiosClient } from '@/shared/api/axiosClient'
import type {
  CategoryGroup,
  CategoryItem,
  CreateCategoryGroupRequest,
  CreateCategoryItemRequest,
} from '@/shared/types/category'

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

export async function getCategories(): Promise<CategoryGroup[]> {
  const response = await axiosClient.get(ENDPOINTS.CATEGORY.LIST)
  return unwrap(response, 'Không lấy được danh mục')
}

export async function createCategoryGroup(
  payload: CreateCategoryGroupRequest,
): Promise<CategoryGroup> {
  const response = await axiosClient.post(ENDPOINTS.CATEGORY.GROUPS, payload)
  return unwrap(response, 'Không tạo được nhóm danh mục')
}

export async function createCategoryItem(
  payload: CreateCategoryItemRequest,
): Promise<CategoryItem> {
  const response = await axiosClient.post(ENDPOINTS.CATEGORY.ITEMS, payload)
  return unwrap(response, 'Không tạo được danh mục')
}

export async function deleteCategoryItem(itemId: number): Promise<void> {
  await axiosClient.delete(ENDPOINTS.CATEGORY.DELETE_ITEM(itemId))
}

export async function deleteCategoryGroup(groupId: number): Promise<void> {
  await axiosClient.delete(ENDPOINTS.CATEGORY.DELETE_GROUP(groupId))
}
