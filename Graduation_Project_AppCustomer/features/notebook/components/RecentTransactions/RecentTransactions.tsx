import { useRef, useState } from 'react'

import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native'

import { Ionicons } from '@expo/vector-icons'

import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'

import type { NotebookTransactionItem } from '../../utils/notebookMappers'

import { formatCurrency } from '../../utils/notebookMappers'

import { styles } from './RecentTransactions.styles'



type RecentTransactionsProps = {

  transactions: NotebookTransactionItem[]

  listTitle?: string

  emptyTitle?: string

  emptySubtitle?: string

  onPressItem?: (tx: NotebookTransactionItem) => void

  onDeleteItem?: (tx: NotebookTransactionItem) => void

}



const DELETE_WIDTH = 72



export function RecentTransactions({

  transactions,

  listTitle = 'Giao dịch gần đây',

  emptyTitle = 'Chưa có giao dịch',

  emptySubtitle = 'Bấm Thu nhập hoặc Chi tiêu để ghi sổ tay đầu tiên.',

  onPressItem,

  onDeleteItem,

}: RecentTransactionsProps) {

  if (transactions.length === 0) {

    return (

      <View style={styles.container}>

        <Text style={styles.sectionTitle}>{listTitle}</Text>

        <View style={styles.emptyContainer}>

          <Ionicons name="wallet-outline" size={48} color={PASTEL_PALETTE.lavender} />

          <Text style={styles.emptyText}>{emptyTitle}</Text>

          <Text style={styles.emptySubtext}>{emptySubtitle}</Text>

        </View>

      </View>

    )

  }



  const groups = groupByDate(transactions)



  return (

    <View style={styles.container}>

      <Text style={styles.sectionTitle}>{listTitle}</Text>

      {groups.map(([day, items]) => (

        <View key={day} style={styles.dayGroup}>

          <Text style={styles.dayLabel}>{day}</Text>

          {items.map((tx) => (

            <TransactionRow

              key={tx.id}

              tx={tx}

              onPress={() => onPressItem?.(tx)}

              onRequestDelete={() => onDeleteItem?.(tx)}

            />

          ))}

        </View>

      ))}

    </View>

  )

}



function TransactionRow({

  tx,

  onPress,

  onRequestDelete,

}: {

  tx: NotebookTransactionItem

  onPress: () => void

  onRequestDelete: () => void

}) {

  const [open, setOpen] = useState(false)

  const progress = useRef(new Animated.Value(0)).current

  const isIncome = tx.type === 'INCOME'

  const tone = isIncome ? '#059669' : '#DC2626'



  const toggle = () => {

    const next = !open

    setOpen(next)

    Animated.timing(progress, {

      toValue: next ? 1 : 0,

      duration: 200,

      easing: Easing.out(Easing.cubic),

      useNativeDriver: false,

    }).start()

  }



  const deleteWidth = progress.interpolate({

    inputRange: [0, 1],

    outputRange: [0, DELETE_WIDTH],

  })



  const arrowRotate = progress.interpolate({

    inputRange: [0, 1],

    outputRange: ['0deg', '180deg'],

  })



  return (

    <View style={styles.rowWrap}>

      <View style={styles.transactionItem}>

        <TouchableOpacity style={styles.transactionMain} activeOpacity={0.85} onPress={onPress}>

          <View style={[styles.iconContainer, { backgroundColor: `${tone}18` }]}>

            <Ionicons

              name={isIncome ? 'arrow-down-circle' : 'arrow-up-circle'}

              size={24}

              color={tone}

            />

          </View>

          <View style={styles.detailsContainer}>

            <Text style={styles.title} numberOfLines={1}>

              {tx.title}

            </Text>

            <Text style={styles.subtitle} numberOfLines={1}>

              {tx.subtitle}

            </Text>

          </View>

          <Text style={[styles.amount, isIncome ? styles.amountIncome : styles.amountExpense]}>

            {`${isIncome ? '+' : '-'}${formatCurrency(tx.amount)}`}

          </Text>

        </TouchableOpacity>

        <TouchableOpacity

          style={styles.arrowBtn}

          onPress={toggle}

          activeOpacity={0.75}

          hitSlop={8}

        >

          <Animated.View style={{ transform: [{ rotate: arrowRotate }] }}>

            <Ionicons name="chevron-back" size={18} color={PASTEL_PALETTE.gray400} />

          </Animated.View>

        </TouchableOpacity>

      </View>



      <Animated.View style={[styles.deletePanel, { width: deleteWidth }]}>

        <TouchableOpacity

          style={styles.deleteAction}

          activeOpacity={0.85}

          onPress={() => {

            if (!open) return

            setOpen(false)

            progress.setValue(0)

            onRequestDelete()

          }}

        >

          <Text style={styles.deleteActionText} numberOfLines={1}>

            Xóa

          </Text>

        </TouchableOpacity>

      </Animated.View>

    </View>

  )

}



function groupByDate(transactions: NotebookTransactionItem[]) {

  const map = new Map<string, NotebookTransactionItem[]>()

  transactions.forEach((tx) => {

    const key = tx.dateLabel || 'Khác'

    const list = map.get(key) || []

    list.push(tx)

    map.set(key, list)

  })

  return Array.from(map.entries())

}


