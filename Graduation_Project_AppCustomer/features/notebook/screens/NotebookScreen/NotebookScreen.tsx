import { useState } from 'react'
import { View } from 'react-native'
import type { NotebookContentTab } from '../../constants/filters'
import { useNotebookBook } from '../../hooks/useNotebookBook'
import { NotebookBookPanel } from '../../components/NotebookBookPanel/NotebookBookPanel'
import { NotebookHeader } from '../../components/NotebookHeader/NotebookHeader'
import { styles } from './NotebookScreen.styles'

export default function NotebookScreen() {
  const [contentTab, setContentTab] = useState<NotebookContentTab>('history')
  const cashState = useNotebookBook()

  return (
    <View style={styles.container}>
      <NotebookHeader
        totalBalance={cashState.balance}
        contentTab={contentTab}
        onContentTabChange={setContentTab}
        onAddCashBalance={() => cashState.openEditor('add')}
        onSpendCashBalance={() => cashState.openEditor('spend')}
      />

      <NotebookBookPanel state={cashState} contentTab={contentTab} />
    </View>
  )
}
