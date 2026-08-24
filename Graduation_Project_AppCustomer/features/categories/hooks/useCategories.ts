import { useCallback, useState } from 'react'
import { Alert } from 'react-native'
import { useFocusEffect } from 'expo-router'
import {
  createCategoryGroup,
  createCategoryItem,
  deleteCategoryGroup,
  deleteCategoryItem,
  getCategories,
} from '@/shared/services/category.service'
import type {
  CategoryGroup,
  CreateCategoryGroupRequest,
  CreateCategoryItemRequest,
} from '@/shared/types/category'

type UseCategoriesOptions = {
  reloadOnFocus?: boolean
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const { reloadOnFocus = true } = options
  const [categories, setCategories] = useState<CategoryGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getCategories()
      setCategories(data)
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không tải được danh mục')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (!reloadOnFocus) return undefined
      loadCategories()
      return undefined
    }, [reloadOnFocus, loadCategories]),
  )

  const addGroup = useCallback(
    async (payload: CreateCategoryGroupRequest) => {
      try {
        setSaving(true)
        const group = await createCategoryGroup(payload)
        await loadCategories()
        return group.id
      } finally {
        setSaving(false)
      }
    },
    [loadCategories],
  )

  const addItem = useCallback(
    async (payload: CreateCategoryItemRequest) => {
      try {
        setSaving(true)
        await createCategoryItem(payload)
        await loadCategories()
      } finally {
        setSaving(false)
      }
    },
    [loadCategories],
  )

  const removeItem = useCallback(
    async (itemId: number) => {
      try {
        setSaving(true)
        await deleteCategoryItem(itemId)
        await loadCategories()
      } finally {
        setSaving(false)
      }
    },
    [loadCategories],
  )

  const removeGroup = useCallback(
    async (groupId: number) => {
      try {
        setSaving(true)
        await deleteCategoryGroup(groupId)
        await loadCategories()
      } finally {
        setSaving(false)
      }
    },
    [loadCategories],
  )

  return {
    categories,
    loading,
    saving,
    loadCategories,
    addGroup,
    addItem,
    removeItem,
    removeGroup,
  }
}

export type CategoriesState = ReturnType<typeof useCategories>
