import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { styles } from './feature-slider.styles';

const SLIDES = [
  {
    id: 1,
    badgeText: 'HỆ THỐNG',
    badgeColor: '#109185',
    badgeBg: '#E6F7F5',
    title: 'Tài chính tối giản',
    card1Icon: 'credit-card',
    card1IconType: 'Feather',
    card1Title: 'Quản lý tập trung',
    card1Desc: 'Mọi dòng tiền thu chi cá nhân nằm gọn trong một ứng d...',
    card2Icon: 'shield',
    card2IconType: 'Feather',
    card2Title: 'Bảo mật tuyệt đối',
    card2Desc: 'Mã hóa dữ liệu tài chính cá nhân an toàn chuẩn ngân hà...',
  },
  {
    id: 2,
    badgeText: 'TÍNH NĂNG',
    badgeColor: '#109185',
    badgeBg: '#E6F7F5',
    title: 'Ngân sách & Tích lũy',
    card1Icon: 'pie-chart',
    card1IconType: 'Feather',
    card1Title: 'Hạn mức chi tiêu',
    card1Desc: 'Nhận cảnh báo tức thời khi chi tiêu chạm ngưỡng ngân s...',
    card2Icon: 'trending-up',
    card2IconType: 'Feather',
    card2Title: 'Quỹ tiết kiệm',
    card2Desc: 'Tự động tích lũy tài chính cho các mục tiêu tương lai dài...',
  },
  {
    id: 3,
    badgeText: 'DÒNG TIỀN',
    badgeColor: '#6366F1',
    badgeBg: '#EEF2FF',
    title: 'Kiểm soát thu chi',
    card1Icon: 'plus-circle',
    card1IconType: 'Feather',
    card1Title: 'Ghi chép nhanh',
    card1Desc: 'Nhập liệu giao dịch chỉ trong 3 giây cực kỳ tinh gọn, thu...',
    card2Icon: 'refresh-cw',
    card2IconType: 'Feather',
    card2Title: 'Khoản chi định kỳ',
    card2Desc: 'Tự động hóa ghi chép cho các khoản chi cố định hàng th...',
  },
  {
    id: 4,
    badgeText: 'TRỢ LÝ AI',
    badgeColor: '#F5A623',
    badgeBg: '#FFF7E6',
    title: 'Trí tuệ nhân tạo AI',
    card1Icon: 'trending-up',
    card1IconType: 'Feather',
    card1Title: 'Phân tích hành vi',
    card1Desc: 'AI phân tích sâu thói quen tiêu dùng để tối ưu hóa chi phí.',
    card2Icon: 'lightbulb',
    card2IconType: 'FontAwesome5',
    card2Title: 'Lời khuyên tài chính',
    card2Desc: 'Gợi ý mẹo tiết kiệm thông minh và dự báo xu hướng dòng...',
  }
];

export default function FeatureSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change slide
        setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 3000); // Đổi slide mỗi 3 giây

    return () => clearInterval(interval);
  }, []);

  const currentSlide = SLIDES[currentIndex];

  const renderIcon = (type: string, name: any, color: string) => {
    if (type === 'FontAwesome5') {
      return <FontAwesome5 name={name} size={18} color={color} solid />;
    }
    return <Feather name={name} size={18} color={color} />;
  };

  return (
    <View style={styles.topSection}>
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        <View style={styles.headerTitleContainer}>
          <View style={[styles.badgeContainer, { borderColor: currentSlide.badgeColor }]}>
            <Text style={[styles.badgeText, { color: currentSlide.badgeColor }]}>
              {currentSlide.badgeText}
            </Text>
          </View>
          <Text style={styles.mainHeading}>{currentSlide.title}</Text>
        </View>

        {/* Card 1 */}
        <View style={styles.infoCard}>
          <View style={[styles.iconContainer, { backgroundColor: currentSlide.badgeBg }]}>
            {renderIcon(currentSlide.card1IconType, currentSlide.card1Icon, currentSlide.badgeColor)}
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>{currentSlide.card1Title}</Text>
            <Text style={styles.infoDesc}>{currentSlide.card1Desc}</Text>
          </View>
        </View>

        {/* Card 2 */}
        <View style={styles.infoCard}>
          <View style={[styles.iconContainer, { backgroundColor: currentSlide.badgeBg }]}>
            {renderIcon(currentSlide.card2IconType, currentSlide.card2Icon, currentSlide.badgeColor)}
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>{currentSlide.card2Title}</Text>
            <Text style={styles.infoDesc}>{currentSlide.card2Desc}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {SLIDES.map((slide, index) => (
          <View
            key={slide.id}
            style={[
              styles.dot,
              currentIndex === index ? [styles.activeDot, { backgroundColor: currentSlide.badgeColor }] : styles.inactiveDot
            ]}
          />
        ))}
      </View>
    </View>
  );
}
