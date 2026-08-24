import { type ReactNode } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { styles } from '../SettingsScreen.styles'

type SettingsSectionProps = {
  title: string
  rightLink?: string
  children: ReactNode
}

export function SettingsSection({ title, rightLink, children }: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {rightLink ? (
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.sectionLink}>{rightLink}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  )
}
