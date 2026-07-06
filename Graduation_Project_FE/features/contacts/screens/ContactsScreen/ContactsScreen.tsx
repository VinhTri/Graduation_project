import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './ContactsScreen.styles';
import Colors from '../../../../shared/constants/Colors';
import { friendshipService, FriendshipResponse } from '../../../../shared/api/services/friendship.service';
import SuccessModal from '../../../../shared/components/SuccessModal/SuccessModal';
import ConfirmModal from '../../../../shared/components/ConfirmModal/ConfirmModal';

export const ContactsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'FRIENDS' | 'REQUESTS'>('FRIENDS');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [friends, setFriends] = useState<FriendshipResponse[]>([]);
  const [requests, setRequests] = useState<FriendshipResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Modals state
  const [successModal, setSuccessModal] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });
  const [errorModal, setErrorModal] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState<{ visible: boolean; id: number; username: string; type: 'remove' | 'accept' | 'reject' | null }>({ visible: false, id: 0, username: '', type: null });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Always fetch pending requests count for the badge
      const reqRes = await friendshipService.getRequests();
      if (reqRes.success) {
        setRequests(reqRes.data);
        setPendingCount(reqRes.data.length);
      }

      if (activeTab === 'FRIENDS') {
        const res = await friendshipService.getFriends();
        if (res.success) setFriends(res.data);
      }
    } catch (error) {
      console.log('Fetch error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const emailToSearch = searchEmail.trim();
    if (!emailToSearch) return;
    setSearchError(null);
    setSearchResult(null);
    try {
      const res = await friendshipService.searchUser(emailToSearch);
      if (res.success) {
        setSearchResult(res.data);
      } else {
        if (res.message === "Không thể tìm kiếm chính mình") {
          setSearchError(res.message);
        } else {
          setSearchError("Người này chưa sử dụng SmartSpend. Hãy gửi lời mời để nhận thưởng!");
        }
      }
    } catch (error) {
      setSearchError("Không thể kết nối đến máy chủ.");
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult) return;
    try {
      const res = await friendshipService.sendRequest(searchResult.email);
      if (res.success) {
        setSuccessModal({ visible: true, title: 'Thành công', message: 'Đã gửi lời mời kết bạn' });
        setSearchResult(null);
        setSearchEmail('');
      } else {
        setErrorModal({ visible: true, title: 'Lỗi', message: res.message });
      }
    } catch (error: any) {
      setErrorModal({ visible: true, title: 'Lỗi', message: error.response?.data?.message || 'Có lỗi xảy ra' });
    }
  };

  const handleAccept = async (id: number) => {
    try {
      const res = await friendshipService.acceptRequest(id);
      if (res.success) {
        setSuccessModal({ visible: true, title: 'Thành công', message: 'Đã chấp nhận kết bạn' });
        fetchData();
      }
    } catch (error) {
      setErrorModal({ visible: true, title: 'Lỗi', message: 'Không thể chấp nhận' });
    }
  };

  const handleReject = async (id: number) => {
    try {
      const res = await friendshipService.rejectRequest(id);
      if (res.success) {
        fetchData();
      }
    } catch (error) {
      setErrorModal({ visible: true, title: 'Lỗi', message: 'Không thể từ chối' });
    }
  };

  const handleRemoveFriend = (id: number, username: string) => {
    setConfirmModal({ visible: true, id, username, type: 'remove' });
  };

  const executeRemoveFriend = async () => {
    try {
      const res = await friendshipService.removeFriend(confirmModal.id);
      if (res.success) {
        setConfirmModal({ ...confirmModal, visible: false });
        setSuccessModal({ visible: true, title: 'Thành công', message: 'Đã xóa bạn bè' });
        fetchData();
      }
    } catch (error) {
      setConfirmModal({ ...confirmModal, visible: false });
      setErrorModal({ visible: true, title: 'Lỗi', message: 'Không thể xóa bạn bè' });
    }
  };

  const renderUserAvatar = (name: string) => {
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    return (
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: FriendshipResponse }) => (
    <View style={styles.listItem}>
      <View style={styles.userInfo}>
        {renderUserAvatar(item.friendUsername)}
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{item.friendUsername}</Text>
          <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="tail">{item.friendEmail}</Text>
        </View>
      </View>
      
      {activeTab === 'REQUESTS' ? (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(item.id)}>
            <Text style={styles.acceptText}>Đồng ý</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton} onPress={() => handleReject(item.id)}>
            <Text style={styles.rejectText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.removeFriendButton} onPress={() => handleRemoveFriend(item.id, item.friendUsername)}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={{ backgroundColor: Colors.primary, height: insets.top, position: 'absolute', top: 0, left: 0, right: 0 }} />
      
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          activeOpacity={0.7}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/home');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh bạ</Text>
      </View>
      <View style={styles.content}>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Nhập email để tìm bạn bè..."
          value={searchEmail}
          onChangeText={setSearchEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Tìm</Text>
        </TouchableOpacity>
      </View>

      {/* Search Result */}
      {searchResult && (
        <View style={styles.searchResultCard}>
          <View style={styles.userInfo}>
            {renderUserAvatar(searchResult.username)}
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{searchResult.username}</Text>
              <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="tail">{searchResult.email}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addFriendButton} onPress={handleSendRequest}>
            <Text style={styles.addFriendText}>Kết bạn</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Error - User not found */}
      {searchError && (
        <View style={styles.errorCard}>
          <Ionicons name="sad-outline" size={40} color="#9CA3AF" style={{ marginBottom: 8 }} />
          <Text style={styles.errorText}>{searchError}</Text>
          {searchError !== "Không thể tìm kiếm chính mình" && (
            <TouchableOpacity style={styles.inviteButton}>
              <Ionicons name="share-social-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.inviteText}>Mời dùng App</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'FRIENDS' && styles.activeTab]}
          onPress={() => setActiveTab('FRIENDS')}
        >
          <Text style={[styles.tabText, activeTab === 'FRIENDS' && styles.activeTabText]}>Bạn bè</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'REQUESTS' && styles.activeTab]}
          onPress={() => setActiveTab('REQUESTS')}
        >
          <Text style={[styles.tabText, activeTab === 'REQUESTS' && styles.activeTabText]}>Lời mời</Text>
          {pendingCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={activeTab === 'FRIENDS' ? friends : requests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {activeTab === 'FRIENDS' ? 'Bạn chưa có người bạn nào.' : 'Không có lời mời kết bạn nào.'}
            </Text>
          }
        />
      )}
      </View>

      {/* Modals */}
      <SuccessModal
        visible={successModal.visible}
        title={successModal.title}
        message={successModal.message}
        onClose={() => setSuccessModal({ ...successModal, visible: false })}
      />
      <ConfirmModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        iconName="alert-circle"
        hideCancel
        confirmText="Đóng"
        onConfirm={() => setErrorModal({ ...errorModal, visible: false })}
        onCancel={() => setErrorModal({ ...errorModal, visible: false })}
      />
      <ConfirmModal
        visible={confirmModal.visible}
        title="Xác nhận"
        message={`Bạn có chắc chắn muốn hủy kết bạn với ${confirmModal.username}?`}
        confirmText="Đồng ý"
        cancelText="Hủy"
        isDestructive
        onConfirm={executeRemoveFriend}
        onCancel={() => setConfirmModal({ ...confirmModal, visible: false })}
      />
      </View>
    </View>
  );
};

export default ContactsScreen;
