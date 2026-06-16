import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { styles } from '../SettingsScreen.styles';
import Colors from '../../../shared/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ProfileHeader = () => {
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('Chưa cập nhật số điện thoại');
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedName = await AsyncStorage.getItem('userName');
        const storedEmail = await AsyncStorage.getItem('userEmail');
        
        if (storedName) {
          setUserName(storedName.toUpperCase());
        } else if (storedEmail) {
          // Fallback to email prefix if no name
          setUserName(storedEmail.split('@')[0].toUpperCase());
        }
        
        // For phone, since we don't have it in the backend yet, we keep it as a placeholder or remove it
        // setUserPhone(storedPhone || '0559760650');
      } catch (error) {
        console.error("Error fetching user data", error);
      }
    };
    
    fetchUserData();
  }, []);

  // Calculate initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Tài khoản</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{getInitials(userName)}</Text>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{userName}</Text>
            <MaterialIcons name="verified" size={18} color={Colors.success} />
          </View>
          <Text style={styles.userPhone}>{userPhone}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Đã xác thực</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editIconContainer} activeOpacity={0.7}>
          <Feather name="edit-2" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
