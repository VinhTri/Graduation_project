import React, { useState } from 'react';
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
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles } from './CreateInvoiceScreen.styles';
import Colors from '@/shared/constants/Colors';
import { invoiceService } from '@/shared/api/services/invoiceService';
import { getAvailableReminderOptions } from '../../utils/invoiceUtils';

export const CreateInvoiceScreen = () => {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);

  const [invoiceName, setInvoiceName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  const availableReminderOptions = getAvailableReminderOptions(dueDate);
  const [reminderOption, setReminderOption] = useState('Đúng ngày');

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

  const handleSave = async () => {
    if (!invoiceName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên hóa đơn.");
      return;
    }
    
    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ.");
      return;
    }

    try {
      setLoading(true);
      const requestData = {
        invoiceName: invoiceName.trim(),
        amount: numericAmount,
        dueDate: dueDate.toISOString().split('T')[0], // format yyyy-mm-dd
        reminderOption: reminderOption,
        isPaid: false
      };
      
      await invoiceService.createInvoice(requestData);
      
      Alert.alert("Thành công", "Đã lưu hóa đơn thành công!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Lỗi", error?.response?.data?.message || "Có lỗi xảy ra khi lưu hóa đơn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back-outline" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thêm hóa đơn</Text>
        </View>
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
              onPress={() => setShowDatePicker(!showDatePicker)}
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
              onPress={() => setShowReminderPicker(true)}
            >
              <Text style={styles.dropdownButtonText}>{reminderOption}</Text>
              <Ionicons name="chevron-down-outline" size={20} color="#64748B" />
            </TouchableOpacity>
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
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, loading && { opacity: 0.7 }]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CreateInvoiceScreen;
