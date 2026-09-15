import { useEffect, useState } from 'react'
import { Image, TouchableOpacity } from 'react-native'
import { styles } from './AIChatButton.styles'

const FRAMES = [
  require('../../../../assets/images/ai-robot/1-thumb.png'),
  require('../../../../assets/images/ai-robot/2-wave.png'),
  require('../../../../assets/images/ai-robot/3-wave-high.png'),
  require('../../../../assets/images/ai-robot/2-wave.png'),
]

const FRAME_MS = 420

type AIChatButtonProps = {
  onPress: () => void
}

export function AIChatButton({ onPress }: AIChatButtonProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % FRAMES.length)
    }, FRAME_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <TouchableOpacity style={styles.btn} activeOpacity={0.85} onPress={onPress}>
      <Image source={FRAMES[index]} style={styles.robot} resizeMode="contain" />
    </TouchableOpacity>
  )
}
