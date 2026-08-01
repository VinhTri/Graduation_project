import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { PASTEL_PALETTE } from '../../../../shared/constants/PastelPalette';
import { walletService, WalletData } from '../../../../shared/api/services/walletService';
import { CreateBankWalletModal } from '../CreateBankWalletModal/CreateBankWalletModal';
import { ConfirmModal } from '../../../../shared/components';
import Colors from '../../../../shared/constants/Colors';
import { styles } from './BankNotebookList.styles';

export const BankNotebookList = () => {
  const router = useRouter();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<WalletData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadWallets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await walletService.getBankWallets();
      setWallets(data);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không tải được danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWallets();
    }, [loadWallets])
  );

  const handleCreateManualBank = async (bankName: string, accountNumber: string) => {
    await walletService.createManualBank({ bankName, accountNumber });
    setModalVisible(false);
    loadWallets();
  };

  const confirmDeleteWallet = async () => {
    if (!walletToDelete) return;
    try {
      setDeleting(true);
      await walletService.deleteManualBank(walletToDelete.id);
      loadWallets();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể xóa sổ tay');
    } finally {
      setDeleting(false);
      setWalletToDelete(null);
    }
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
    wallet: WalletData
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.88, 1],
      extrapolate: 'clamp',
    });
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.swipeDeleteActionWrap,
          { transform: [{ scale }, { translateX }] },
        ]}
      >
        <RectButton
          style={styles.swipeDeleteButton}
          onPress={() => setWalletToDelete(wallet)}
        >
          <LinearGradient
            colors={['#FCA5A5', '#EF4444', '#DC2626']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.swipeDeleteGradient}
          >
            <View style={styles.swipeDeleteIconCircle}>
              <Ionicons name="trash" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.swipeDeleteText}>Xóa</Text>
          </LinearGradient>
        </RectButton>
      </Animated.View>
    );
  };

  const renderItem = ({ item }: { item: WalletData }) => {
    const isManual = item.walletType === 'MANUAL';
    
    const itemContent = (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push(`/notebook/${item.id}`)}
      >
        <View style={styles.iconBox}>
          <Ionicons name="card" size={24} color={PASTEL_PALETTE.accentDeep} />
        </View>
        <View style={styles.info}>
          <Text style={styles.bankName}>{item.name}</Text>
          {!!item.accountNumber && (
            <Text style={styles.accountNumber}>STK: {item.accountNumber}</Text>
          )}
          {isManual && (
            <View style={{ alignSelf: 'flex-start' }}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>SỔ TAY GHI CHÉP</Text>
              </View>
            </View>
          )}
        </View>
        <View style={styles.balanceWrap}>
          <Text style={styles.balance}>
            {Number(item.balance).toLocaleString('vi-VN')} ₫
          </Text>
          <Ionicons name="chevron-forward" size={16} color={PASTEL_PALETTE.textMuted} style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>
    );

    if (isManual) {
      return (
        <Swipeable
          key={item.id}
          renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
          friction={2}
          rightThreshold={40}
        >
          {itemContent}
        </Swipeable>
      );
    }

    return itemContent;
  };

  if (loading && wallets.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={PASTEL_PALETTE.accentDeep} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Danh sách tài khoản</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={18} color={PASTEL_PALETTE.accentDeep} />
          <Text style={styles.addBtnText}>Thêm sổ tay</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={wallets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={48} color={PASTEL_PALETTE.border} />
            <Text style={styles.emptyText}>Bạn chưa có sổ tay ngân hàng nào.</Text>
          </View>
        }
      />

      <CreateBankWalletModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreateManualBank}
      />

      <ConfirmModal
        visible={!!walletToDelete}
        title="Xóa sổ tay"
        message={walletToDelete ? `Bạn có chắc chắn muốn xóa sổ tay ngân hàng "${walletToDelete.name}" không?` : ''}
        iconName="trash-outline"
        iconColor={Colors.error}
        confirmText="Xóa"
        cancelText="Hủy"
        isDestructive={true}
        onConfirm={confirmDeleteWallet}
        onCancel={() => setWalletToDelete(null)}
      />
    </View>
  );
};
