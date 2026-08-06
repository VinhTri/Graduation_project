import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  KeyboardAvoidingView, Platform, Modal, TouchableWithoutFeedback, ActivityIndicator 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

import { styles } from './InternetInvoiceScreen.styles';
import { invoiceService } from '@/shared/api/services/invoiceService';
import { ConfirmModal } from '@/shared/components';

export const InternetInvoiceScreen = () => {
  const router = useRouter();
  const { editId } = useLocalSearchParams();

  // Loading & Modal States
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!editId);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Block 1: Amount Info
  const [amountStr, setAmountStr] = useState('100,000');
  const [fetchedAmount, setFetchedAmount] = useState(0);

  // Block 2: Billing Period
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); 
    return d;
  });
  const [endDate, setEndDate] = useState(new Date());

  // Block 3: Payment & Reminder
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5); 
    return d;
  });

  const [reminderTime, setReminderTime] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Date picker states
  const [datePickerConfig, setDatePickerConfig] = useState<{ visible: boolean; mode: 'start' | 'end' | 'due' }>({ visible: false, mode: 'start' });

  // --- Fetch Logic (Edit Mode) ---
  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!editId) return;
      try {
        setFetching(true);
        const res = await invoiceService.getInvoiceById(Number(editId));
        const data = res.data;
        if (data) {
          setAmountStr(data.amount?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || '100,000');
          setFetchedAmount(data.amount);
          
          if (data.startDate) {
            setStartDate(new Date(data.startDate));
          }
          if (data.endDate) {
            setEndDate(new Date(data.endDate));
          }
          if (data.dueDate) {
            setDueDate(new Date(data.dueDate));
          }
          
          if (data.reminderTime) {
            const timeParts = data.reminderTime.split(':');
            const d = new Date();
            d.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
            setReminderTime(d);
          }
        }
      } catch (error) {
        console.error(error);
        setErrorMessage("Không thể lấy thông tin hóa đơn");
        setErrorModalVisible(true);
      } finally {
        setFetching(false);
      }
    };
    fetchInvoiceData();
  }, [editId]);

  // --- Calculations ---
  const getMinDueDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    return end > today ? end : today;
  };

  const totalAmount = useMemo(() => {
    return parseInt(amountStr.replace(/,/g, '')) || 0;
  }, [amountStr]);

  // --- Handlers ---
  const handleAmountChange = (text: string) => {
    const num = text.replace(/[^0-9]/g, '');
    setAmountStr(num ? num.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : '');
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setDatePickerConfig({ ...datePickerConfig, visible: false });
    }
    if (!selectedDate) return;

    if (datePickerConfig.mode === 'start') {
      setStartDate(selectedDate);
      if (selectedDate > endDate) {
        setEndDate(selectedDate);
        if (selectedDate > dueDate) {
          setDueDate(selectedDate);
        }
      }
    } else if (datePickerConfig.mode === 'end') {
      setEndDate(selectedDate);
      if (selectedDate > dueDate) {
        setDueDate(selectedDate);
      }
    } else if (datePickerConfig.mode === 'due') {
      setDueDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setReminderTime(selectedTime);
    }
  };

  const handleSave = async () => {
    if (totalAmount <= 0) {
      setErrorMessage("Vui lòng nhập đơn giá lớn hơn 0.");
      setErrorModalVisible(true);
      return;
    }

    try {
      setLoading(true);
      
      const formatApiDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const monthLabel = endDate.getMonth() + 1;
      const invoiceName = `Tiền mạng tháng ${monthLabel}`;

      const requestData = {
        invoiceName,
        amount: totalAmount,
        startDate: formatApiDate(startDate),
        endDate: formatApiDate(endDate),
        dueDate: formatApiDate(dueDate),
        reminderOption: "Đúng ngày",
        reminderTime: reminderTime.toTimeString().split(' ')[0],
        oldReading: 0,
        newReading: 0,
        pricePerKwh: 0,
        isPaid: false
      };
      
      if (editId) {
        await invoiceService.updateInvoice(Number(editId), requestData);
      } else {
        await invoiceService.createInvoice(requestData);
      }
      
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.response?.data?.message || "Có lỗi xảy ra khi lưu hóa đơn.");
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDateUI = (d: Date) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (fetching) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#EC4899" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.headerWrap}>
        <LinearGradient colors={['#FFD6EC', '#E9D5FF', '#BFDBFE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.headerDecorCircleLarge} />
          <View style={styles.headerDecorCircleSmall} />
          
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="chevron-back-outline" size={24} color="#7C3AED" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>{editId ? "Sửa hóa đơn" : "Tiền mạng"}</Text>
              <Text style={styles.headerSubtitle}>Quản lý cước viễn thông</Text>
            </View>
          </View>
          <View style={styles.totalAmountWrap}>
            <Text style={styles.totalAmountLabel}>Tạm tính thành tiền</Text>
            <Text style={styles.totalAmountValue}>{totalAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} đ</Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin gói cước</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Đơn giá cố định</Text>
            <View style={styles.inputWithSuffix}>
              <TextInput style={styles.inputCore} value={amountStr} onChangeText={handleAmountChange} keyboardType="numeric" />
              <Text style={styles.inputSuffix}>VNĐ / tháng</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kỳ cước</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Từ ngày</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setDatePickerConfig({ visible: true, mode: 'start' })}>
                <Text style={styles.dateButtonText}>{formatDateUI(startDate)}</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Chốt sổ ngày</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setDatePickerConfig({ visible: true, mode: 'end' })}>
                <Text style={styles.dateButtonText}>{formatDateUI(endDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hạn thanh toán & Nhắc nhở</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngày đến hạn thanh toán</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setDatePickerConfig({ visible: true, mode: 'due' })}>
              <Text style={styles.dateButtonText}>{formatDateUI(dueDate)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Giờ thông báo</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.dateButtonText}>{reminderTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>
              <Ionicons name="time-outline" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>{editId ? "Cập nhật Hóa Đơn" : "Lưu Hóa Đơn"}</Text>}
        </TouchableOpacity>
      </View>

      {Platform.OS === 'android' && datePickerConfig.visible && (
        <DateTimePicker
          value={datePickerConfig.mode === 'start' ? startDate : datePickerConfig.mode === 'end' ? endDate : dueDate}
          mode="date"
          onChange={handleDateChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={datePickerConfig.visible} transparent={true} animationType="slide">
          <TouchableWithoutFeedback onPress={() => setDatePickerConfig({ ...datePickerConfig, visible: false })}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { paddingBottom: 30 }]}>
                  <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 16 }]}>Chọn ngày</Text>
                  
                  <View style={{ alignItems: 'center', width: '100%' }}>
                    <DateTimePicker
                      value={datePickerConfig.mode === 'start' ? startDate : datePickerConfig.mode === 'end' ? endDate : dueDate}
                      minimumDate={datePickerConfig.mode === 'end' ? startDate : datePickerConfig.mode === 'due' ? getMinDueDate() : undefined}
                      mode="date"
                      display="inline"
                      themeVariant="light"
                      onChange={handleDateChange}
                      style={{ height: 320, alignSelf: 'center' }}
                    />
                  </View>

                  <TouchableOpacity 
                    style={{
                      backgroundColor: '#EC4899',
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: 'center',
                      marginTop: 16,
                      width: '100%'
                    }}
                    onPress={() => setDatePickerConfig({ ...datePickerConfig, visible: false })}
                  >
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Xong</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={showTimePicker} transparent={true} animationType="slide">
          <TouchableWithoutFeedback onPress={() => setShowTimePicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { paddingBottom: 30 }]}>
                  <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 16 }]}>Giờ thông báo</Text>
                  
                  <View style={{ alignItems: 'center', width: '100%' }}>
                    <DateTimePicker
                      value={reminderTime}
                      mode="time"
                      display="spinner"
                      themeVariant="light"
                      onChange={handleTimeChange}
                      style={{ height: 260, alignSelf: 'center' }}
                    />
                  </View>

                  <TouchableOpacity 
                    style={{ backgroundColor: '#EC4899', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16, width: '100%' }}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Xong</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      <ConfirmModal
        visible={showSuccessModal}
        title="Thành công"
        message={editId ? "Hóa đơn đã được cập nhật!" : "Hóa đơn tiền mạng đã được tạo!"}
        iconName="checkmark-circle"
        iconColor="#10B981"
        confirmText="Hoàn tất"
        hideCancel={true}
        onConfirm={() => {
          setShowSuccessModal(false);
          router.back();
        }}
        onCancel={() => setShowSuccessModal(false)}
      />

      <ConfirmModal
        visible={errorModalVisible}
        title="Lỗi"
        message={errorMessage}
        iconName="alert-circle"
        iconColor="#EF4444"
        confirmText="Đã hiểu"
        isDestructive={false}
        hideCancel={true}
        onConfirm={() => setErrorModalVisible(false)}
        onCancel={() => setErrorModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};
