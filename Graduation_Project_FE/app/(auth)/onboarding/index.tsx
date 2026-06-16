import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from './_onboarding.styles';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();

  const handleStart = async () => {
    try {
      router.replace('/(auth)/login');
    } catch (e) {
      console.log('Error routing to login', e);
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.bgCircle, styles.circleTopLeft]} />
      <View style={[styles.bgCircle, styles.circleBottomRight]} />

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={styles.scrollView}
      >
        {/* Slide 1 */}
        <View style={styles.slide}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={styles.title1}>
              Bạn đang gặp khó{'\n'}khăn{'\n'}trong việc quản lý{'\n'}chi tiêu hàng ngày?
            </Text>
          </View>
        </View>

        {/* Slide 2 */}
        <View style={styles.slide}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={styles.title2}>
              Đừng lo lắng...{'\n'}
              <Text style={styles.highlight}>SmartSpend</Text> sẽ{'\n'}đồng hành và giúp{'\n'}bạn làm chủ tài{'\n'}chính!
            </Text>
          </View>
        </View>

        {/* Slide 3 */}
        <View style={styles.slide}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
          <View style={{ width: '100%', paddingBottom: 50 }}>
            <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={handleStart}>
              <Text style={styles.buttonText}>Bắt đầu sử dụng</Text>
              <Feather name="arrow-right" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
