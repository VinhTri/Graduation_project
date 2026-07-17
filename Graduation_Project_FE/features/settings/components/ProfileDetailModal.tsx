import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PASTEL_PALETTE } from '../../../shared/constants/PastelPalette';
import { userService, UserProfile } from '../../../shared/api/services/userService';
import { resolveMediaUrl } from '../../../shared/utils/resolveMediaUrl';
import { styles } from '../SettingsScreen.styles';

type Props = {
  visible: boolean;
  onClose: () => void;
  fallbackName?: string;
  fallbackEmail?: string;
  fallbackAccountNumber?: string;
  fallbackAvatarUrl?: string;
  onAvatarChanged?: (avatarUrl: string) => void;
};

const formatCreatedAt = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const ProfileDetailModal = ({
  visible,
  onClose,
  fallbackName = '',
  fallbackEmail = '',
  fallbackAccountNumber = '',
  fallbackAvatarUrl = '',
  onAvatarChanged,
}: Props) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await userService.getMyProfile();
        if (!cancelled) setProfile(data);
      } catch (error) {
        console.error('Error loading profile', error);
        if (!cancelled) {
          setProfile({
            id: 0,
            username: fallbackName,
            email: fallbackEmail,
            accountNumber: fallbackAccountNumber || null,
            avatarUrl: fallbackAvatarUrl || null,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [visible, fallbackName, fallbackEmail, fallbackAccountNumber, fallbackAvatarUrl]);

  const username = profile?.username || fallbackName || 'Người dùng';
  const email = profile?.email || fallbackEmail || '—';
  const accountNumber =
    profile?.accountNumber || fallbackAccountNumber || 'Chưa thiết lập';
  const createdAt = formatCreatedAt(profile?.createdAt);
  const isActive = profile?.isActive !== false;
  const avatarUri = resolveMediaUrl(profile?.avatarUrl || fallbackAvatarUrl);

  const pickAndUpload = async (source: 'camera' | 'library') => {
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Cần quyền', 'Vui lòng cho phép truy cập máy ảnh để chụp ảnh đại diện.');
          return;
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Cần quyền', 'Vui lòng cho phép truy cập thư viện ảnh.');
          return;
        }
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setUploading(true);
      const updated = await userService.uploadAvatar(result.assets[0].uri);
      setProfile(updated);
      if (updated.avatarUrl) {
        await AsyncStorage.setItem('userAvatarUrl', updated.avatarUrl);
        onAvatarChanged?.(updated.avatarUrl);
      }
    } catch (error: any) {
      console.error('Upload avatar failed', error);
      Alert.alert(
        'Không thể đổi ảnh',
        error?.message || 'Vui lòng thử lại sau.'
      );
    } finally {
      setUploading(false);
    }
  };

  const openAvatarPicker = () => {
    if (uploading) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Hủy', 'Chụp ảnh', 'Chọn từ thư viện'],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) pickAndUpload('camera');
          if (index === 2) pickAndUpload('library');
        }
      );
      return;
    }

    Alert.alert('Đổi ảnh đại diện', 'Chọn nguồn ảnh', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Chụp ảnh', onPress: () => pickAndUpload('camera') },
      { text: 'Thư viện', onPress: () => pickAndUpload('library') },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.profileModalOverlay}>
        <TouchableOpacity style={styles.profileModalBackdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.profileModalSheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.profileModalHandle} />

          <View style={styles.profileModalHeader}>
            <Text style={styles.profileModalTitle}>Thông tin tài khoản</Text>
            <TouchableOpacity style={styles.profileModalClose} onPress={onClose} activeOpacity={0.75}>
              <Feather name="x" size={18} color={PASTEL_PALETTE.title} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.profileModalLoading}>
              <ActivityIndicator color={PASTEL_PALETTE.accentDeep} />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={styles.profileModalHero}>
                <TouchableOpacity
                  style={styles.profileModalAvatarWrap}
                  onPress={openAvatarPicker}
                  activeOpacity={0.85}
                  disabled={uploading}
                >
                  {avatarUri ? (
                    <Image
                      source={{ uri: avatarUri }}
                      style={styles.profileModalAvatarImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.profileModalAvatar}>
                      <Text style={styles.profileModalAvatarText}>{getInitials(username)}</Text>
                    </View>
                  )}
                  <View style={styles.profileModalAvatarBadge}>
                    {uploading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Feather name="camera" size={14} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>

                <Text style={styles.profileModalChangeHint}>Chạm để đổi ảnh đại diện</Text>

                <View style={styles.profileModalNameRow}>
                  <Text style={styles.profileModalName}>{username}</Text>
                  <MaterialIcons name="verified" size={18} color={PASTEL_PALETTE.accentDeep} />
                </View>
                <View style={[styles.badge, { alignSelf: 'center', marginTop: 10 }]}>
                  <Feather name="shield" size={11} color={PASTEL_PALETTE.accentDeep} />
                  <Text style={styles.badgeText}>
                    {isActive ? 'Đã xác thực' : 'Chưa kích hoạt'}
                  </Text>
                </View>
              </View>

              <View style={styles.profileModalCard}>
                <InfoRow icon="user" label="Tên đăng nhập" value={username} />
                <InfoRow icon="mail" label="Email" value={email} />
                <InfoRow icon="credit-card" label="Số tài khoản" value={accountNumber} />
                <InfoRow icon="calendar" label="Ngày tạo tài khoản" value={createdAt} isLast />
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
  isLast,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  isLast?: boolean;
}) => (
  <View style={[styles.profileInfoRow, isLast && styles.profileInfoRowLast]}>
    <View style={styles.profileInfoIcon}>
      <Feather name={icon} size={16} color={PASTEL_PALETTE.accentDeep} />
    </View>
    <View style={styles.profileInfoContent}>
      <Text style={styles.profileInfoLabel}>{label}</Text>
      <Text style={styles.profileInfoValue}>{value}</Text>
    </View>
  </View>
);
