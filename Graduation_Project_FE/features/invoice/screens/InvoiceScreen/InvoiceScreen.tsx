import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './InvoiceScreen.styles';
import Colors from '@/shared/constants/Colors';
import { invoiceService, InvoiceResponse } from '@/shared/api/services/invoiceService';

export const InvoiceScreen = () => {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      "Xóa hóa đơn",
      `Bạn có chắc chắn muốn xóa hóa đơn "${name}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await invoiceService.deleteInvoice(id);
              fetchInvoices(); // Refresh the list
            } catch (error) {
              console.error(error);
              Alert.alert("Lỗi", "Không thể xóa hóa đơn này.");
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderInvoiceItem = ({ item }: { item: InvoiceResponse }) => {
    const formattedAmount = item.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const dueDate = new Date(item.dueDate);
    const formattedDate = dueDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
      <View style={styles.invoiceCard}>
        <View style={styles.invoiceHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.invoiceName}>{item.invoiceName}</Text>
            <Text style={styles.invoiceAmount}>{formattedAmount} VNĐ</Text>
          </View>
          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={() => router.push(`/invoice/${item.id}`)} style={styles.actionButton}>
              <Ionicons name="pencil-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.invoiceName)} style={[styles.actionButton, styles.deleteButton]}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
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
      </View>
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
          <Text style={styles.headerTitle}>Hóa đơn</Text>
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
    </View>
  );
};

export default InvoiceScreen;
