import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PastelHeaderShell } from '../../../shared/components/PastelHeaderShell';
import { PASTEL_PALETTE } from '../../../shared/constants/PastelPalette';
import { walletService } from '../../../shared/api/services/walletService';
import { userService } from '../../../shared/api/services/userService';
import { resolveMediaUrl } from '../../../shared/utils/resolveMediaUrl';
import { styles } from '../SettingsScreen.styles';
import { ProfileDetailModal } from './ProfileDetailModal';

export const ProfileHeader = () => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileVisible, setProfileVisible] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedName = await AsyncStorage.getItem('userName');
        const storedEmail = await AsyncStorage.getItem('userEmail');
        const storedAvatar = await AsyncStorage.getItem('userAvatarUrl');

        if (storedName) {
          setUserName(storedName);
        } else if (storedEmail) {
          setUserName(storedEmail.split('@')[0]);
        }

        if (storedEmail) {
          setUserEmail(storedEmail);
        }
        if (storedAvatar) {
          setAvatarUrl(storedAvatar);
        }

        const [wallet, profile] = await Promise.all([
          walletService.getMyWallet().catch(() => null),
          userService.getMyProfile().catch(() => null),
        ]);

        if (wallet?.accountNumber) {
          setAccountNumber(String(wallet.accountNumber));
        }
        if (profile?.username) {
          setUserName(profile.username);
        }
        if (profile?.email) {
          setUserEmail(profile.email);
        }
        if (profile?.avatarUrl) {
          setAvatarUrl(profile.avatarUrl);
          await AsyncStorage.setItem('userAvatarUrl', profile.avatarUrl);
        }
      } catch (error) {
        console.error('Error fetching user data', error);
      }
    };

    fetchUserData();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const avatarUri = resolveMediaUrl(avatarUrl);

  return (
    <>
      <PastelHeaderShell contentStyle={styles.headerContent}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Tài khoản</Text>
        </View>

        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarContainer}
            activeOpacity={0.85}
            onPress={() => setProfileVisible(true)}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{getInitials(userName)}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {userName || 'Người dùng'}
              </Text>
              <MaterialIcons name="verified" size={16} color={PASTEL_PALETTE.accentDeep} />
            </View>
            <Text style={styles.userEmail} numberOfLines={1}>
              {userEmail || 'Chưa cập nhật email'}
            </Text>
            <Text style={styles.userStk} numberOfLines={1}>
              STK: {accountNumber || 'Chưa thiết lập'}
            </Text>
            <View style={styles.badge}>
              <Feather name="shield" size={11} color={PASTEL_PALETTE.accentDeep} />
              <Text style={styles.badgeText}>Đã xác thực</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            activeOpacity={0.75}
            onPress={() => setProfileVisible(true)}
          >
            <Feather name="edit-2" size={16} color={PASTEL_PALETTE.accentDeep} />
          </TouchableOpacity>
        </View>
      </PastelHeaderShell>

      <ProfileDetailModal
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        fallbackName={userName}
        fallbackEmail={userEmail}
        fallbackAccountNumber={accountNumber}
        fallbackAvatarUrl={avatarUrl}
        onAvatarChanged={setAvatarUrl}
      />
    </>
  );
};
