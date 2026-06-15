import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, Modal, 
  Platform, KeyboardAvoidingView, ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from './SuccessModal.styles';

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  isAutoClose?: boolean;
  onClose: () => void;
}

export default function SuccessModal({ visible, title, message, isAutoClose = false, onClose }: SuccessModalProps) {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (!visible || !isAutoClose) return;
    
    setTimeLeft(5); // reset time when modal opens
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose(); // Auto close when countdown reaches 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, isAutoClose, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>
          {/* Icon Tích Xanh */}
          <View style={styles.iconContainer}>
            <Feather name="check-circle" size={40} color="#109185" />
          </View>

          {/* Tiêu đề */}
          <Text style={styles.title}>{title}</Text>
          
          {/* Lời nhắn */}
          <Text style={styles.message}>{message}</Text>

          {/* Nút Tiếp tục hoặc Vòng load đếm ngược */}
          {isAutoClose ? (
            <View style={styles.autoCloseContainer}>
              <ActivityIndicator size="small" color="#109185" />
              <Text style={styles.autoCloseText}>Chuyển hướng sau {timeLeft}s...</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.button} 
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Tiếp tục</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
