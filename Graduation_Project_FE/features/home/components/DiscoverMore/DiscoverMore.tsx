import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "./DiscoverMore.styles";

const BANNERS = [
  {
    id: "1",
    overlayTitle: "NẠP DATA 4G/5G",
    overlaySub: "AI gợi ý gói tốt nhất",
    bgColor: "#8B5CF6", // Purple placeholder
    title: "Tặng bạn bộ quà đến 10K khi nạp 4G/5G",
    actionText: "XEM NGAY",
  },
  {
    id: "2",
    overlayTitle: "CHUYỂN CHỈ 111Đ",
    overlaySub: "Săn lì xì 10 triệu",
    bgColor: "#D97706", // Gold/Orange placeholder
    title: "Chuyển 111Đ, săn lì xì 10 triệu",
    actionText: "CHUYỂN NGAY",
  },
  {
    id: "3",
    overlayTitle: "THÁNG 5 LÀ LỜI",
    overlaySub: "Đến 1 triệu Xu",
    bgColor: "#E11D48", // Red placeholder
    title: "Chuyển 111Đ, săn thưởng đến 1 triệu Xu",
    actionText: "CHUYỂN NGAY",
  },
  {
    id: "4",
    overlayTitle: "RỦ BẠN DÙNG APP",
    overlaySub: "Nhận lì xì tiền mặt",
    bgColor: "#BE185D", // Pink/Dark red placeholder
    title: "100% cả hai có 20K tiền mặt",
    actionText: "MỜI BẠN NGAY",
  },
];

export const DiscoverMore = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Khám phá thêm</Text>
      <View style={styles.grid}>
        {BANNERS.map((banner) => (
          <TouchableOpacity key={banner.id} style={styles.card} activeOpacity={0.8}>
            <View style={[styles.imagePlaceholder, { backgroundColor: banner.bgColor }]}>
              <Text style={styles.imageOverlayText}>{banner.overlayTitle}</Text>
              <Text style={styles.imageOverlaySubtext}>{banner.overlaySub}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={2}>{banner.title}</Text>
              <Text style={styles.cardAction}>{banner.actionText}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default DiscoverMore;
