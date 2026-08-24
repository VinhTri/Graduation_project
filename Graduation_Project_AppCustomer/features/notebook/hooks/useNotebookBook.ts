import { useCallback, useState } from 'react'

import { Alert } from 'react-native'

import { useFocusEffect } from 'expo-router'

import {

  createNotebookTransaction,

  deleteNotebookTransaction,

  getCashNotebook,

  getNotebookTransaction,

  getNotebookTransactions,

  updateNotebookTransaction,

} from '@/shared/services/notebook.service'

import type { NotebookBookResponse } from '@/shared/types/notebook'

import type {

  InitialTransactionData,

  TransactionMode,

  TransactionPayload,

} from '../types/transaction'

import {

  mapNotebookTransaction,

  type NotebookTransactionItem,

} from '../utils/notebookMappers'



export function useNotebookBook() {

  const [book, setBook] = useState<NotebookBookResponse | null>(null)

  const [transactions, setTransactions] = useState<NotebookTransactionItem[]>([])

  const [loading, setLoading] = useState(true)

  const [refreshing, setRefreshing] = useState(false)

  const [saving, setSaving] = useState(false)



  const [editorVisible, setEditorVisible] = useState(false)

  const [editorMode, setEditorMode] = useState<TransactionMode>('add')

  const [editingTx, setEditingTx] = useState<InitialTransactionData | null>(null)

  const [txToDelete, setTxToDelete] = useState<InitialTransactionData | null>(null)



  const loadData = useCallback(async () => {

    const bookData = await getCashNotebook()

    const history = await getNotebookTransactions(bookData.id, 'YEAR')

    setBook(bookData)

    setTransactions(history.map(mapNotebookTransaction))

    return bookData

  }, [])



  const runInitialLoad = useCallback(async () => {

    try {

      setLoading(true)

      await loadData()

    } catch (e: any) {

      Alert.alert('Lỗi', e?.message || 'Không tải được dữ liệu sổ tay tiền mặt')

    } finally {

      setLoading(false)

    }

  }, [loadData])



  useFocusEffect(

    useCallback(() => {

      let active = true

      ;(async () => {

        if (!active) return

        await runInitialLoad()

      })()

      return () => {

        active = false

      }

    }, [runInitialLoad]),

  )



  const refresh = useCallback(async () => {

    try {

      setRefreshing(true)

      await loadData()

    } catch (e: any) {

      Alert.alert('Lỗi', e?.message || 'Không làm mới được dữ liệu')

    } finally {

      setRefreshing(false)

    }

  }, [loadData])



  const openEditor = useCallback((mode: TransactionMode, tx?: InitialTransactionData) => {

    setEditorMode(mode)

    setEditingTx(tx ?? null)

    setEditorVisible(true)

  }, [])



  const openTransactionDetail = useCallback(

    async (transactionCode: string, type: 'EXPENSE' | 'INCOME') => {

      try {

        setSaving(true)

        const detail = await getNotebookTransaction(transactionCode)

        setEditorMode(type === 'INCOME' ? 'add' : 'spend')

        setEditingTx({

          transactionCode: detail.transactionCode,

          amount: Number(detail.amount),

          note: detail.note,

          categoryId: detail.categoryId,

          categoryName: detail.categoryName,

          categoryIcon: detail.categoryIcon,

          categoryColor: detail.categoryColor,

          categoryDeleted: !!detail.categoryDeleted,

          createdAt: detail.createdAt,

        })

        setEditorVisible(true)

      } catch (e: any) {

        Alert.alert('Lỗi', e?.message || 'Không lấy được chi tiết giao dịch')

      } finally {

        setSaving(false)

      }

    },

    [],

  )



  const closeEditor = useCallback(() => {

    setEditorVisible(false)

    setEditingTx(null)

  }, [])



  const saveTransaction = useCallback(

    async ({ amount, note, category }: TransactionPayload) => {

      if (!book) {

        throw new Error('Sổ tay chưa sẵn sàng')

      }



      try {

        setSaving(true)

        const payload = {

          amount,

          type: editorMode === 'add' ? ('INCOME' as const) : ('EXPENSE' as const),

          categoryId: category.id,

          note,

          bookId: book.id,

        }



        if (editingTx) {

          await updateNotebookTransaction(editingTx.transactionCode, payload)

        } else {

          await createNotebookTransaction(payload)

        }



        await loadData()

      } catch (e: any) {

        Alert.alert('Lỗi', e?.message || 'Không lưu được giao dịch')

        throw e

      } finally {

        setSaving(false)

      }

    },

    [book, editingTx, editorMode, loadData],

  )



  const requestDelete = useCallback((tx: InitialTransactionData) => {

    setTxToDelete(tx)

  }, [])



  const cancelDelete = useCallback(() => {

    setTxToDelete(null)

  }, [])



  const confirmDelete = useCallback(async () => {

    if (!txToDelete) return

    try {

      setSaving(true)

      await deleteNotebookTransaction(txToDelete.transactionCode)

      closeEditor()

      await loadData()

    } catch (e: any) {

      Alert.alert('Lỗi', e?.message || 'Không xóa được giao dịch')

    } finally {

      setSaving(false)

      setTxToDelete(null)

    }

  }, [closeEditor, loadData, txToDelete])



  return {

    book,

    balance: Number(book?.balance) || 0,

    transactions,

    loading,

    refreshing,

    saving,

    editorVisible,

    editorMode,

    editingTx,

    txToDelete,

    refresh,

    openEditor,

    openTransactionDetail,

    closeEditor,

    saveTransaction,

    requestDelete,

    cancelDelete,

    confirmDelete,

  }

}



export type NotebookBookState = ReturnType<typeof useNotebookBook>


