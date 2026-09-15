import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ConfirmModal } from '@/shared/components';
import { styles, PALETTE } from '../CreateInvoiceScreen/CreateInvoiceScreen.styles';
import Colors from '@/shared/constants/Colors';
import { invoiceService } from '@/shared/api/services/invoiceService';
import { getAvailableReminderOptions } from '../../utils/invoiceUtils';

export const EditInvoiceScreen = () => {
  const router = useRouter();
  const { id, viewOnly } = useLocalSearchParams();
  const isViewOnly = viewOnly === 'true';

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [invoiceName, setInvoiceName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  const availableReminderOptions = getAvailableReminderOptions(dueDate);
  const [reminderOption, setReminderOption] = useState('Đúng ngày');

  const [reminderTime, setReminderTime] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0); // Default to 09:00
    return d;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!id) return;
      try {
        setFetching(true);
        const res = await invoiceService.getInvoiceById(Number(id));
        const data = res.data;
        if (data) {
          setInvoiceName(data.invoiceName);
          setAmount(data.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
          setDueDate(new Date(data.dueDate));
          setReminderOption(data.reminderOption || 'Đúng ngày');
          
          if (data.reminderTime) {
            const timeParts = data.reminderTime.split(':');
            const d = new Date();
            d.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
            setReminderTime(d);
          }
        }
      } catch (error) {
        console.log("Fetch Invoice Error:", error);
        setErrorMessage("Không thể lấy thông tin hóa đơn vì hóa đơn này đã bị xóa.");
        setErrorModalVisible(true);
      } finally {
        setFetching(false);
      }
    };
    fetchInvoiceData();
  }, [id]);

  const handleAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (!numericValue) {
      setAmount('');
      return;
    }
    const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    setAmount(formatted);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dueDate;
    setShowDatePicker(false);
    setDueDate(currentDate);

    const newOptions = getAvailableReminderOptions(currentDate);
    if (!newOptions.includes(reminderOption)) {
      // If previously selected reminder is no longer valid, set it to the maximum available
      setReminderOption(newOptions[newOptions.length - 1]);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setReminderTime(selectedTime);
    }
  };

  const handleSave = async () => {
    if (!invoiceName.trim()) {
      setErrorMessage("Vui lòng nhập tên hóa đơn.");
      setErrorModalVisible(true);
      return;
    }
    
    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage("Vui lòng nhập số tiền hợp lệ.");
      setErrorModalVisible(true);
      return;
    }

    const now = new Date();
    const reminderDate = new Date(dueDate);
    reminderDate.setHours(reminderTime.getHours(), reminderTime.getMinutes(), 0, 0);

    if (reminderOption === 'Trước 1 ngày') {
      reminderDate.setDate(reminderDate.getDate() - 1);
    } else if (reminderOption === 'Trước 2 ngày') {
      reminderDate.setDate(reminderDate.getDate() - 2);
    } else if (reminderOption === 'Trước 3 ngày') {
      reminderDate.setDate(reminderDate.getDate() - 3);
    }

    if (reminderDate <= now) {
      setErrorMessage("Thời gian nhắc nhở không được nằm trong quá khứ.");
      setErrorModalVisible(true);
      return;
    }

    try {
      setLoading(true);
      
      const year = dueDate.getFullYear();
      const month = String(dueDate.getMonth() + 1).padStart(2, '0');
      const day = String(dueDate.getDate()).padStart(2, '0');
      const localDueDate = `${year}-${month}-${day}`;

      const requestData = {
        invoiceName: invoiceName.trim(),
        amount: numericAmount,
        dueDate: localDueDate,
        reminderOption: reminderOption,
        reminderTime: reminderTime.toTimeString().split(' ')[0], // format HH:mm:ss
        isPaid: false
      };
      
      await invoiceService.updateInvoice(Number(id), requestData);
      
      setShowSuccessModal(true);
    } catch (error: any) {
      console.log("Update Invoice Error:", error);
      setErrorMessage(error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật hóa đơn.");
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  if (fetching || errorMessage === "Không thể lấy thông tin hóa đơn vì hóa đơn này đã bị xóa.") {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        {fetching && <ActivityIndicator size="large" color={Colors.primary} />}
        {errorMessage === "Không thể lấy thông tin hóa đơn vì hóa đơn này đã bị xóa." && (
          <ConfirmModal
            visible={errorModalVisible}
            title="Lỗi"
            message={errorMessage}
            iconName="alert-circle"
            iconColor={Colors.error}
            confirmText="Đã hiểu"
            isDestructive={false}
            hideCancel={true}
            onConfirm={() => {
              setErrorModalVisible(false);
              router.back();
            }}
            onCancel={() => {
              setErrorModalVisible(false);
              router.back();
            }}
          />
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={[PALETTE.headerStart, PALETTE.headerMid, PALETTE.headerEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerDecorCircleLarge} />
          <View style={styles.headerDecorCircleSmall} />

          <View style={styles.headerTopRow}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                <Ionicons name="chevron-back-outline" size={22} color="#7C3AED" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{isViewOnly ? 'Chi tiết hóa đơn' : 'Sửa hóa đơn'}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Thông tin cơ bản */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin cơ bản</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên hóa đơn</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Tiền điện, Internet..."
              value={invoiceName}
              onChangeText={setInvoiceName}
              placeholderTextColor="#94A3B8"
              editable={!isViewOnly}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số tiền</Text>
            <View style={styles.amountInputContainer}>
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="0"
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholderTextColor="#94A3B8"
                editable={!isViewOnly}
              />
              <Text style={styles.currencySuffix}>VNĐ</Text>
            </View>
          </View>
        </View>

        {/* Thiết lập thời gian */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lịch & Nhắc nhở</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngày đến hạn</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => !isViewOnly && setShowDatePicker(!showDatePicker)}
              activeOpacity={isViewOnly ? 1 : 0.7}
            >
              <Text style={styles.dropdownButtonText}>
                {dueDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                themeVariant="light"
                minimumDate={new Date()}
                onChange={onDateChange}
              />
            )}
          </View>


          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nhắc nhở tôi</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => !isViewOnly && setShowReminderPicker(true)}
              activeOpacity={isViewOnly ? 1 : 0.7}
            >
              <Text style={styles.dropdownButtonText}>{reminderOption}</Text>
              <Ionicons name="chevron-down-outline" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Giờ thông báo</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => !isViewOnly && setShowTimePicker(!showTimePicker)}
              activeOpacity={isViewOnly ? 1 : 0.7}
            >
              <Text style={styles.dropdownButtonText}>
                {reminderTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
            
            {showTimePicker && (
              <View style={{ alignItems: 'center', width: '100%', marginTop: 8 }}>
                <DateTimePicker
                  value={reminderTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  themeVariant="light"
                  onChange={onTimeChange}
                  style={{ alignSelf: 'center' }}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={{
                      marginTop: 16,
                      width: '100%',
                      backgroundColor: '#F472B6',
                      paddingVertical: 14,
                      borderRadius: 16,
                      alignItems: 'center'
                    }}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>Xong</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

      </ScrollView>

      {/* Reminder Picker Modal */}
      <Modal
        visible={showReminderPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReminderPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowReminderPicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Chọn thời gian nhắc nhở</Text>
              {availableReminderOptions.map((option, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.modalOption,
                    reminderOption === option && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setReminderOption(option);
                    setShowReminderPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    reminderOption === option && styles.modalOptionTextActive
                  ]}>
                    {option}
                  </Text>
                  {reminderOption === option && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Footer */}
      {!isViewOnly && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveButton, loading && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Cập nhật</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <ConfirmModal
        visible={showSuccessModal}
        title="Thành công"
        message="Hóa đơn đã được cập nhật thành công!"
        iconName="checkmark-circle"
        iconColor="#EC4899"
        confirmText="Hoàn tất"
        isDestructive={false}
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
        iconColor={Colors.error}
        confirmText="Đã hiểu"
        isDestructive={false}
        hideCancel={true}
        onConfirm={() => {
          setErrorModalVisible(false);
        }}
        onCancel={() => {
          setErrorModalVisible(false);
        }}
      />
    </KeyboardAvoidingView>
  );
};

export default EditInvoiceScreen;
