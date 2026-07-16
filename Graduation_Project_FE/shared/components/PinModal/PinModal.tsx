import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, SafeAreaView, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { styles } from './PinModal.styles';

interface PinModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  onForgotPin?: () => void;
  errorMessage?: string;
  title?: string;
  subtitle?: string;
}

export default function PinModal({
  visible,
  onClose,
  onConfirm,
  onForgotPin,
  errorMessage,
  title = 'Nhập mã PIN',
  subtitle = 'Vui lòng nhập mã PIN bảo mật để xác nhận giao dịch rút tiền.',
}: PinModalProps) {
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (visible) {
      setPin('');
    }
  }, [visible]);

  const handleKeyPress = (key: string) => {
    if (key === 'cancel') {
      onClose();
      return;
    }
    
    if (key === 'backspace') {
      setPin(prev => prev.slice(0, -1));
      return;
    }

    if (pin.length < 6) {
      const newPin = pin + key;
      setPin(newPin);
      if (newPin.length === 6) {
        // Tự động confirm khi nhập đủ 6 số
        setTimeout(() => onConfirm(newPin), 300);
      }
    }
  };

  const renderKeypad = () => {
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['cancel', '0', 'backspace']
    ];

    return (
      <View style={styles.keypadContainer}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, colIndex) => {
              if (key === 'cancel') {
                return (
                  <TouchableOpacity 
                    key={colIndex} 
                    style={styles.key} 
                    onPress={() => handleKeyPress(key)}
                  >
                    <Text style={[styles.keyText, { fontSize: 18, color: '#6B7280' }]}>Hủy</Text>
                  </TouchableOpacity>
                );
              }
              if (key === 'backspace') {
                return (
                  <TouchableOpacity 
                    key={colIndex} 
                    style={styles.key} 
                    onPress={() => handleKeyPress(key)}
                  >
                    <Feather name="delete" size={24} color="#1F2937" />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity 
                  key={colIndex} 
                  style={styles.key} 
                  onPress={() => handleKeyPress(key)}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.dragIndicator} />
          
          <View style={styles.headerIconContainer}>
            <Ionicons name="lock-closed" size={28} color="#109185" />
          </View>

          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
          </View>

          <Text style={styles.subtitle}>
            {subtitle}
          </Text>

          <View style={styles.pinContainer}>
            {[...Array(6)].map((_, i) => (
              <View 
                key={i} 
                style={[styles.pinDot, i < pin.length ? styles.pinDotActive : null]} 
              />
            ))}
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          
          <TouchableOpacity onPress={() => {
            if (onForgotPin) {
              onForgotPin();
            } else {
              Alert.alert("Quên mã PIN", "Vui lòng liên hệ bộ phận CSKH để được hỗ trợ cấp lại mã PIN.");
            }
          }}>
            <Text style={styles.forgotPinText}>Quên mã PIN?</Text>
          </TouchableOpacity>

          {renderKeypad()}
        </SafeAreaView>
      </View>
    </Modal>
  );
}
