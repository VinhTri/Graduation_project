import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Linking } from "react-native";
import { useRouter } from "expo-router";
import { styles } from "./DiscoverMore.styles";
import { postService, PostResponse } from "../../../../shared/api/services/post.service";
import { getApiBaseUrl } from "../../../../shared/api/axiosClient";

const getValidImageUrl = (url: string) => {
  if (!url) return '';
  // Nếu url chứa localhost (được admin lưu từ web browser)
  // Ta phải đổi nó thành IP thật của mạng LAN để điện thoại tải được ảnh
  if (url.includes('localhost')) {
    const baseUrl = getApiBaseUrl(); // ví dụ: http://192.168.1.5:9090
    return url.replace(/http:\/\/localhost:\d+/, baseUrl);
  }
  return url;
};

export const DiscoverMore = () => {
  const router = useRouter();
  const [banners, setBanners] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await postService.getActivePosts();
        // Cần map `bgColor` nếu null về màu mặc định hoặc xử lý an toàn
        setBanners(data);
      } catch (error) {
        console.error("Failed to fetch banners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const handleBannerPress = async (targetLink?: string) => {
    if (!targetLink) return;
    const link = targetLink.trim().toLowerCase();

    // 1. Phân tích các liên kết nội bộ của ứng dụng (In-app routing)
    if (link.includes('topup') || link.includes('nap-tien')) {
      router.push('/wallet/action' as any);
      return;
    }
    if (link.includes('withdraw') || link.includes('rut-tien')) {
      router.push({ pathname: '/wallet/action', params: { initialTab: 'withdraw' } } as any);
      return;
    }
    if (link.includes('transfer') || link.includes('chuyen-tien')) {
      router.push('/transfer' as any);
      return;
    }
    if (link.includes('wallet') || link.includes('vi')) {
      router.push('/(tabs)/wallet' as any);
      return;
    }
    if (link.includes('notebook') || link.includes('so-tay')) {
      router.push('/(tabs)/notebook' as any);
      return;
    }
    if (link.includes('budget') || link.includes('ngan-sach')) {
      router.push('/budget' as any);
      return;
    }
    if (link.includes('funds') || link.includes('quy')) {
      router.push('/funds' as any);
      return;
    }
    if (link.includes('categories') || link.includes('danh-muc')) {
      router.push('/categories' as any);
      return;
    }
    if (link.includes('split-bill') || link.includes('chia-tien')) {
      router.push('/split-bill' as any);
      return;
    }

    // 2. Nếu là đường dẫn nội bộ dạng /...
    if (targetLink.startsWith('/')) {
      try {
        router.push(targetLink as any);
        return;
      } catch {
        // Fallback
      }
    }

    // 3. Mở liên kết ngoài an toàn
    try {
      const supported = await Linking.canOpenURL(targetLink);
      if (supported) {
        await Linking.openURL(targetLink);
      }
    } catch {
      // Bỏ qua lỗi nếu link demo không mở được trên trình duyệt thật
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', minHeight: 150 }]}>
        <ActivityIndicator size="small" color="#0ea5e9" />
      </View>
    );
  }

  if (banners.length === 0) {
    return null; // Ẩn phần này nếu không có bài viết nào
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Khám phá thêm</Text>
      <View style={styles.grid}>
        {banners.map((banner) => (
          <TouchableOpacity 
            key={banner.id} 
            style={styles.card} 
            activeOpacity={0.8}
            onPress={() => handleBannerPress(banner.targetLink)}
          >
            <Image 
              source={{ uri: getValidImageUrl(banner.imageUrl) }} 
              style={styles.imageCover} 
              resizeMode="cover"
            />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={2}>{banner.title}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default DiscoverMore;
