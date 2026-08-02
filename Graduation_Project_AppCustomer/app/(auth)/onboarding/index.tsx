import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { styles } from '@/features/auth/styles/onboarding.styles';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
  const router = useRouter();
  
  // 0: Question, 1: Solution, 2: Final Welcome Page
  const [step, setStep] = useState(0);

  // Animation values for smooth cinematic transitions
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  const runOnboardingSequence = useCallback(() => {
    // Reset to step 0
    setStep(0);
    textOpacity.setValue(0);
    textTranslateY.setValue(20);
    buttonOpacity.setValue(0);

    // STEP 0: Show the Question
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Stay for 2.2 seconds, then transition out
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(textTranslateY, {
            toValue: -15, // Slides slightly upwards during fade out
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Switch to STEP 1: Show the Reassurance
          setStep(1);
          textTranslateY.setValue(20); // Reset position below

          Animated.parallel([
            Animated.timing(textOpacity, {
              toValue: 1,
              duration: 900,
              useNativeDriver: true,
            }),
            Animated.timing(textTranslateY, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Stay for 2.2 seconds, then transition out
            setTimeout(() => {
              Animated.parallel([
                Animated.timing(textOpacity, {
                  toValue: 0,
                  duration: 600,
                  useNativeDriver: true,
                }),
                Animated.timing(textTranslateY, {
                  toValue: -15,
                  duration: 600,
                  useNativeDriver: true,
                }),
              ]).start(() => {
                // Switch to STEP 2: Final Welcome Screen
                setStep(2);
                textTranslateY.setValue(20);

                // Fade in the welcome typography group and the action button
                Animated.parallel([
                  Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                  }),
                  Animated.timing(textTranslateY, {
                    toValue: 0,
                    duration: 850,
                    useNativeDriver: true,
                  }),
                  Animated.timing(buttonOpacity, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                  }),
                ]).start();
              });
            }, 2200);
          });
        });
      }, 2200);
    });
  }, [buttonOpacity, textOpacity, textTranslateY]);

  useEffect(() => {
    runOnboardingSequence();
  }, [runOnboardingSequence]);

  const handleStart = async () => {
    try {
      // Import AsyncStorage locally to avoid changing top level imports if possible
      // Actually, better to import it at top level, but for simplicity let's require it
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/(auth)/login');
    } catch (e) {
      console.log('Error routing to login', e);
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Soft blurred ambient decorative background shapes */}
      <View style={[styles.bgCircle, styles.circleTopLeft]} />
      <View style={[styles.bgCircle, styles.circleBottomRight]} />

      <View style={{ flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 54, zIndex: 1 }}>
        {/* Animated Typographic Storytelling Content Area */}
        <Animated.View 
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
              flex: 1,
              justifyContent: 'center',
            }
          ]}
        >
          {step === 0 && (
            <Text style={styles.title1}>
              Bạn đang gặp khó{'\n'}khăn{'\n'}trong việc quản lý{'\n'}chi tiêu hàng ngày?
            </Text>
          )}

          {step === 1 && (
            <Text style={styles.title2}>
              Đừng lo lắng...{'\n'}
              <Text style={styles.highlight}>SmartSpend</Text> sẽ{'\n'}đồng hành và giúp{'\n'}bạn làm chủ tài{'\n'}chính!
            </Text>
          )}

          {step === 2 && (
            <View style={{ alignItems: 'center' }}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>SMARTSPEND</Text>
              </View>
              <Text style={styles.title3}>
                Quản Lý Tài Chính{'\n'}Thông Minh & Tối{'\n'}Ưu
              </Text>
              <Text style={styles.subtitle3}>
                Theo dõi chi tiêu hàng ngày, tự động lập{'\n'}ngân sách và phân tích dòng tiền thông{'\n'}minh cùng trợ lý AI.
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Action Button - Fades in only during the final step */}
        <Animated.View 
          style={{
            opacity: buttonOpacity,
            width: '100%',
            paddingHorizontal: 32,
            paddingBottom: 50,
          }}
        >
          <TouchableOpacity 
            style={styles.button} 
            activeOpacity={0.8} 
            onPress={handleStart}
            disabled={step !== 2} // Prevent interactions during story steps
          >
            <Text style={styles.buttonText}>Bắt đầu sử dụng</Text>
            <Feather name="arrow-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
