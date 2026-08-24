import { Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette'
import { registerScreenStyles as styles } from '@/features/auth/styles/registerScreen.styles'

const STEPS = [
  { label: 'Email', icon: 'mail' as const },
  { label: 'Mật khẩu', icon: 'lock' as const },
  { label: 'OTP', icon: 'shield' as const },
]

type RegisterStepProgressProps = {
  currentStep: 1 | 2 | 3
}

function StepCircle({
  stepNumber,
  currentStep,
  icon,
}: {
  stepNumber: number
  currentStep: number
  icon: (typeof STEPS)[number]['icon']
}) {
  const isActive = stepNumber === currentStep
  const isDone = stepNumber < currentStep

  return (
    <View
      style={[
        styles.stepCircle,
        isActive && styles.stepCircleActive,
        isDone && styles.stepCircleDone,
      ]}
    >
      {isDone ? (
        <Feather name="check" size={16} color={PASTEL_PALETTE.white} />
      ) : (
        <Feather
          name={icon}
          size={15}
          color={isActive ? PASTEL_PALETTE.white : PASTEL_PALETTE.gray400}
        />
      )}
    </View>
  )
}

export default function RegisterStepProgress({ currentStep }: RegisterStepProgressProps) {
  return (
    <View style={styles.stepperCard}>
      <View style={styles.stepperTrack}>
        {STEPS.map((item, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isDone = stepNumber < currentStep
          const isLast = index === STEPS.length - 1
          const leftConnectorDone = stepNumber <= currentStep
          const rightConnectorDone = stepNumber < currentStep

          return (
            <View key={item.label} style={styles.stepperColumn}>
              <View style={styles.stepperNodeRow}>
                <View
                  style={[
                    styles.stepConnector,
                    index === 0 && styles.stepConnectorHidden,
                    leftConnectorDone && index > 0 && styles.stepConnectorDone,
                  ]}
                />
                <StepCircle
                  stepNumber={stepNumber}
                  currentStep={currentStep}
                  icon={item.icon}
                />
                <View
                  style={[
                    styles.stepConnector,
                    isLast && styles.stepConnectorHidden,
                    rightConnectorDone && !isLast && styles.stepConnectorDone,
                  ]}
                />
              </View>

              <Text
                style={[
                  styles.stepLabel,
                  isActive && styles.stepLabelActive,
                  isDone && styles.stepLabelDone,
                ]}
              >
                {item.label}
              </Text>
              <Text style={[styles.stepBadge, isActive && styles.stepBadgeActive]}>
                Bước {stepNumber}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
