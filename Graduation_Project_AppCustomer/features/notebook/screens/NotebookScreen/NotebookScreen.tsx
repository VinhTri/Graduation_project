import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useNotebookBook } from '../../hooks/useNotebookBook'
import { NotebookBookPanel } from '../../components/NotebookBookPanel/NotebookBookPanel'
import { NotebookHeader } from '../../components/NotebookHeader/NotebookHeader'
import { styles } from './NotebookScreen.styles'

export default function NotebookScreen() {
  const router = useRouter()
  const cashState = useNotebookBook()

  return (
    <View style={styles.container}>
      <NotebookHeader
        totalBalance={cashState.balance}
        contentTab="history"
        onContentTabChange={(next) => {
          if (next === 'report') {
            router.push({ pathname: '/finance-center', params: { tab: 'spending' } })
          }
        }}
        onAddCashBalance={() => cashState.openEditor('add')}
        onSpendCashBalance={() => cashState.openEditor('spend')}
      />

      <NotebookBookPanel state={cashState} contentTab="history" />
    </View>
  )
}
