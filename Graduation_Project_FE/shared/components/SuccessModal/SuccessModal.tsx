import React from 'react';
import { 
  View, Text, TouchableOpacity, Modal, 
  Platform, KeyboardAvoidingView 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from './SuccessModal.styles';

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function SuccessModal({ visible, title, message, onClose }: SuccessModalProps) {
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

          {/* Nút Tiếp tục */}
          <TouchableOpacity 
            style={styles.button} 
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Tiếp tục</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
