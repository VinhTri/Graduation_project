import { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import type { NotebookContentTab } from '../../constants/filters'
import { formatCurrency } from '../../utils/notebookMappers'
import { styles } from './NotebookHeader.styles'

type NotebookHeaderProps = {
  totalBalance: number
  contentTab: NotebookContentTab
  onContentTabChange: (tab: NotebookContentTab) => void
  onAddCashBalance?: () => void
  onSpendCashBalance?: () => void
}

export function NotebookHeader({
  totalBalance,
  contentTab,
  onContentTabChange,
  onAddCashBalance,
  onSpendCashBalance,
}: NotebookHeaderProps) {
  const [isBalanceHidden, setIsBalanceHidden] = useState(false)

  return (
    <PastelHeaderShell
      contentStyle={styles.headerContent}
      coverImage={require('../../../../assets/images/notebook-list-header.png')}
    >
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            Sổ tay tiền mặt
          </Text>
        </View>

        <View style={styles.headerTabs}>
          <TouchableOpacity
            style={[styles.headerTab, contentTab === 'history' && styles.headerTabActive]}
            onPress={() => onContentTabChange('history')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.headerTabText,
                contentTab === 'history' && styles.headerTabTextActive,
              ]}
            >
              Lịch sử
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerTab, contentTab === 'report' && styles.headerTabActive]}
            onPress={() => onContentTabChange('report')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.headerTabText,
                contentTab === 'report' && styles.headerTabTextActive,
              ]}
            >
              Báo cáo
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>SỐ DƯ TIỀN MẶT</Text>
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setIsBalanceHidden((v) => !v)}
            activeOpacity={0.75}
          >
            <Feather
              name={isBalanceHidden ? 'eye-off' : 'eye'}
              size={15}
              color={PASTEL_PALETTE.accentDeep}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.balanceValue}>
          {isBalanceHidden ? '•••••• ₫' : formatCurrency(totalBalance)}
        </Text>

        <View style={styles.balanceActions}>
          {onAddCashBalance ? (
            <TouchableOpacity
              style={styles.addBalanceBtn}
              onPress={onAddCashBalance}
              activeOpacity={0.85}
            >
              <Feather name="plus-circle" size={16} color={PASTEL_PALETTE.accentDeep} />
              <Text style={styles.addBalanceText}>Thu nhập</Text>
            </TouchableOpacity>
          ) : null}
          {onSpendCashBalance ? (
            <TouchableOpacity
              style={styles.spendBalanceBtn}
              onPress={onSpendCashBalance}
              activeOpacity={0.85}
            >
              <Feather name="minus-circle" size={16} color="#DC2626" />
              <Text style={styles.spendBalanceText}>Chi tiêu</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </PastelHeaderShell>
  )
}
