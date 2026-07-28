import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Linking } from "react-native";
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
            onPress={() => {
              if (banner.targetLink) {
                Linking.openURL(banner.targetLink).catch(err => console.error("Couldn't load page", err));
              }
            }}
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
