import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './InvoiceScreen.styles';
import Colors from '@/shared/constants/Colors';
import { invoiceService, InvoiceResponse } from '@/shared/api/services/invoiceService';
import { Swipeable } from 'react-native-gesture-handler';
import { ConfirmModal } from '@/shared/components';

export const InvoiceScreen = () => {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number, name: string } | null>(null);

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchInvoices = async () => {
    try {
      const data = await invoiceService.getInvoices();
      setInvoices(data.data || []);
    } catch (error) {
      console.error("Lỗi khi tải hóa đơn:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchInvoices();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices();
  };

  const openDeleteModal = (id: number, name: string) => {
    setItemToDelete({ id, name });
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteModalVisible(false);

    try {
      setLoading(true);
      await invoiceService.deleteInvoice(itemToDelete.id);
      fetchInvoices(); 
      
      setSuccessMessage(`Đã xóa hóa đơn "${itemToDelete.name}" thành công!`);
      setSuccessModalVisible(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("Không thể xóa hóa đơn này.");
      setErrorModalVisible(true);
      setLoading(false);
    } finally {
      setItemToDelete(null);
    }
  };

  const renderRightActions = (id: number, name: string) => {
    return (
      <TouchableOpacity 
        style={styles.swipeDeleteButton} 
        onPress={() => openDeleteModal(id, name)}
      >
        <Ionicons name="trash-outline" size={24} color={Colors.white} />
        <Text style={styles.swipeDeleteText}>Xóa</Text>
      </TouchableOpacity>
    );
  };

  const renderInvoiceItem = ({ item }: { item: InvoiceResponse }) => {
    const formattedAmount = item.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const dueDate = new Date(item.dueDate);
    const formattedDate = dueDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
      <Swipeable renderRightActions={() => renderRightActions(item.id, item.invoiceName)}>
        <TouchableOpacity 
          style={styles.invoiceCard}
          activeOpacity={0.7}
          onPress={() => router.push(`/invoice/${item.id}`)}
        >
          <View style={styles.invoiceHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.invoiceName}>{item.invoiceName}</Text>
              <Text style={styles.invoiceAmount}>{formattedAmount} VNĐ</Text>
            </View>
          </View>
          <View style={styles.invoiceFooter}>
            <View style={styles.dueDateContainer}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <Text style={styles.dueDateText}>Đến hạn: {formattedDate}</Text>
            </View>
            {item.reminderOption && (
              <View style={styles.reminderBadge}>
                <Text style={styles.reminderText}>{item.reminderOption}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back-outline" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Hóa đơn</Text>
            <Text style={styles.headerSubtitle}>Quản lý thanh toán</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push('/invoice/create')}
        >
          <Text style={styles.createButtonText}>Tạo hóa đơn</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      {loading && !refreshing ? (
        <View style={[styles.emptyStateContainer, { justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : invoices.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="document-text-outline" size={80} color="#E2E8F0" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có hóa đơn nào</Text>
          <Text style={styles.emptySubtitle}>
            Bấm &quot;Tạo hóa đơn&quot; ở góc phải bên trên để thêm hóa đơn mới và cài đặt lịch nhắc nhở.
          </Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderInvoiceItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Xóa hóa đơn"
        message={itemToDelete ? `Bạn có chắc chắn muốn xóa hóa đơn "${itemToDelete.name}" không?` : ""}
        iconName="trash-outline"
        iconColor={Colors.error}
        confirmText="Xóa"
        cancelText="Hủy"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setItemToDelete(null);
        }}
      />

      {/* Success Modal */}
      <ConfirmModal
        visible={successModalVisible}
        title="Thành công"
        message={successMessage}
        iconName="checkmark-circle"
        iconColor={Colors.success || "#10B981"}
        confirmText="Hoàn tất"
        isDestructive={false}
        hideCancel={true}
        onConfirm={() => setSuccessModalVisible(false)}
        onCancel={() => setSuccessModalVisible(false)}
      />

      {/* Error Modal */}
      <ConfirmModal
        visible={errorModalVisible}
        title="Lỗi"
        message={errorMessage}
        iconName="alert-circle"
        iconColor={Colors.error}
        confirmText="Đã hiểu"
        isDestructive={false}
        hideCancel={true}
        onConfirm={() => setErrorModalVisible(false)}
        onCancel={() => setErrorModalVisible(false)}
      />
    </View>
  );
};

export default InvoiceScreen;
