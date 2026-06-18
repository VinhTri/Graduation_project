import React from 'react';
import { View, Text, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './ConfirmModal.styles';
import Colors from '../../constants/Colors';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
  children?: React.ReactNode;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  iconName = "alert-circle",
  iconColor = Colors.error,
  confirmText = "Đồng ý",
  cancelText = "Hủy",
  onConfirm,
  onCancel,
  isDestructive = true,
  children
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalContainer}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '1A' }]}>
            <Ionicons name={iconName} size={32} color={iconColor} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {children}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmButton, { backgroundColor: isDestructive ? Colors.error : Colors.primary }]} 
              onPress={onConfirm} 
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
