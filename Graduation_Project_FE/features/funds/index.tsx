import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { styles } from './FundsScreen.styles';

interface FundCardProps {
  name: string;
  balance: string;
  isOwner?: boolean;
}

const FundCard: React.FC<FundCardProps> = ({ name, balance, isOwner = true }) => {
  return (
    <View style={styles.fundCard}>
      <View style={styles.fundCardTop}>
        <View>
          <Text style={styles.fundName}>{name}</Text>
          {isOwner && (
            <View style={styles.tagContainer}>
              <FontAwesome5 name="star" size={10} color="#FFFFFF" solid />
              <Text style={styles.tagText}>Chủ quỹ</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.fundCardBottom}>
        <View style={styles.balanceContainer}>
          <View style={styles.moIcon}>
            <Text style={styles.moTextIcon}>mo</Text>
          </View>
          <Text style={styles.balanceText}>{balance}</Text>
        </View>
        <TouchableOpacity style={styles.changeImageBtn} activeOpacity={0.7}>
          <Feather name="camera" size={14} color="#374151" />
          <Text style={styles.changeImageText}>Đổi hình</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export function FundsScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#109185" />
      
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <Text style={styles.headerTitle}>Quỹ</Text>
          <Text style={styles.headerSubtitle}>Mục tiêu và các quỹ của bạn</Text>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Mỗi quỹ một việc</Text>
            <Text style={styles.bannerSubtitle}>Chi tiêu đúng mục đích!</Text>
          </View>
          <View style={styles.bannerImagePlaceholder}>
            <Feather name="smartphone" size={32} color="#109185" />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Feather name="list" size={18} color="#374151" />
            <Text style={styles.actionButtonText}>Quản lý</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Feather name="plus" size={18} color="#374151" />
            <Text style={styles.actionButtonText}>Tạo quỹ (1/10)</Text>
          </TouchableOpacity>
        </View>

        {/* Carousel */}
        <View style={styles.carouselContainer}>
          <View style={styles.carouselImageContainer}>
            <Feather name="gift" size={32} color="#109185" />
          </View>
          <View style={styles.carouselDots}>
            <View style={styles.dotActive} />
            <View style={styles.dotInactive} />
            <View style={styles.dotInactive} />
          </View>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Quỹ của tôi</Text>

        {/* Funds List */}
        <FundCard name="Tiền thưởng" balance="33đ" />
        <FundCard name="Quỹ cặp đôi" balance="0đ" />
        
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}
