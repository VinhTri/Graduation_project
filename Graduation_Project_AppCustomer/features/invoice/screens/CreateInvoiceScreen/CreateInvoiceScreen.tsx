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
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ConfirmModal } from '@/shared/components';
import { styles, PALETTE } from './CreateInvoiceScreen.styles';
import { Colors } from '@/shared/constants/Colors';
import { invoiceService } from '@/shared/api/services/invoiceService';
import { getAvailableReminderOptions } from '../../utils/invoiceUtils';

type FormErrors = Partial<Record<'invoiceName' | 'amount' | 'dueDate' | 'reminder', string>>;

const MAX_INVOICE_AMOUNT = 1_000_000_000;

export const CreateInvoiceScreen = () => {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const params = useLocalSearchParams<{ prefillName?: string; prefillAmount?: string }>();

  const [invoiceName, setInvoiceName] = useState(params.prefillName || '');
  const [amount, setAmount] = useState(() => {
    if (params.prefillAmount) {
      const num = String(params.prefillAmount).replace(/[^0-9]/g, '');
      return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    return '';
  });
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

  const handleAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
    if (!numericValue) {
      setAmount('');
      setFormErrors(current => ({ ...current, amount: undefined }));
      return;
    }

    if (BigInt(numericValue) > BigInt(MAX_INVOICE_AMOUNT)) {
      setFormErrors(current => ({
        ...current,
        amount: 'Số tiền tối đa là 1.000.000.000đ.',
      }));
      return;
    }

    const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    setAmount(formatted);
    setFormErrors(current => ({ ...current, amount: undefined }));
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dueDate;
    setShowDatePicker(false);
    setDueDate(currentDate);
    setFormErrors(current => ({ ...current, dueDate: undefined, reminder: undefined }));

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
      setFormErrors(current => ({ ...current, reminder: undefined }));
    }
  };

  const handleSave = async () => {
    const nextErrors: FormErrors = {};
    const normalizedName = invoiceName.trim();
    const numericAmount = parseFloat(amount.replace(/,/g, ''));

    if (!normalizedName) nextErrors.invoiceName = 'Vui lòng nhập tên hóa đơn.';
    else if (normalizedName.length < 2) nextErrors.invoiceName = 'Tên hóa đơn phải có ít nhất 2 ký tự.';
    else if (normalizedName.length > 80) nextErrors.invoiceName = 'Tên hóa đơn không được vượt quá 80 ký tự.';

    if (!amount.trim()) nextErrors.amount = 'Vui lòng nhập số tiền.';
    else if (!Number.isFinite(numericAmount) || numericAmount <= 0) nextErrors.amount = 'Số tiền phải lớn hơn 0đ.';
    else if (numericAmount > MAX_INVOICE_AMOUNT) nextErrors.amount = 'Số tiền tối đa là 1.000.000.000đ.';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDueDate = new Date(dueDate);
    selectedDueDate.setHours(0, 0, 0, 0);
    if (selectedDueDate < today) nextErrors.dueDate = 'Ngày đến hạn không được nằm trong quá khứ.';

    if (!availableReminderOptions.includes(reminderOption)) {
      nextErrors.reminder = 'Thời điểm nhắc không phù hợp với ngày đến hạn.';
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
      setErrorMessage('Thời gian nhắc nhở không được nằm trong quá khứ.');
      setErrorModalVisible(true);
      return;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({});

    try {
      setLoading(true);
      
      const year = dueDate.getFullYear();
      const month = String(dueDate.getMonth() + 1).padStart(2, '0');
      const day = String(dueDate.getDate()).padStart(2, '0');
      const localDueDate = `${year}-${month}-${day}`;

      const requestData = {
        invoiceName: normalizedName,
        amount: numericAmount,
        dueDate: localDueDate,
        reminderOption: reminderOption,
        reminderTime: reminderTime.toTimeString().split(' ')[0], // format HH:mm:ss
        isPaid: false
      };
      
      await invoiceService.createInvoice(requestData);
      
      setShowSuccessModal(true);
    } catch (error: any) {
      console.log("Create Invoice Error:", error);
      setErrorMessage(error?.message || error?.response?.data?.message || "Có lỗi xảy ra khi lưu hóa đơn.");
      setErrorModalVisible(true);
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
              <Text style={styles.headerTitle}>Thêm hóa đơn</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Thông tin cơ bản */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin cơ bản</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên hóa đơn <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, formErrors.invoiceName && styles.inputError]}
              placeholder="VD: Tiền điện, Internet..."
              value={invoiceName}
              onChangeText={(value) => {
                setInvoiceName(value);
                setFormErrors(current => ({ ...current, invoiceName: undefined }));
              }}
              maxLength={80}
              placeholderTextColor="#94A3B8"
            />
            {formErrors.invoiceName ? <Text style={styles.errorText}>{formErrors.invoiceName}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số tiền <Text style={styles.required}>*</Text></Text>
            <View style={[styles.amountInputContainer, formErrors.amount && styles.inputError]}>
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
            {formErrors.amount ? <Text style={styles.errorText}>{formErrors.amount}</Text> : null}
          </View>
        </View>

        {/* Thiết lập thời gian */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lịch & Nhắc nhở</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngày đến hạn <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity 
              style={[styles.dropdownButton, formErrors.dueDate && styles.inputError]}
              onPress={() => setShowDatePicker(!showDatePicker)}
            >
              <Text style={styles.dropdownButtonText}>
                {dueDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
            {formErrors.dueDate ? <Text style={styles.errorText}>{formErrors.dueDate}</Text> : null}
            
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
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Giờ thông báo</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setShowTimePicker(!showTimePicker)}
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
                    setFormErrors(current => ({ ...current, reminder: undefined }));
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

      <ConfirmModal
        visible={showSuccessModal}
        title="Thành công"
        message="Hóa đơn mới đã được lưu thành công!"
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
        onConfirm={() => setErrorModalVisible(false)}
        onCancel={() => setErrorModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

export default CreateInvoiceScreen;
