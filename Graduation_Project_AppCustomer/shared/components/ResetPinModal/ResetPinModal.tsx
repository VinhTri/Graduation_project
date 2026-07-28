import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, SafeAreaView, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { styles } from '../PinModal/PinModal.styles';

interface ResetPinModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (newPin: string) => void;
  errorMessage?: string;
}

export default function ResetPinModal({ visible, onClose, onConfirm, errorMessage }: ResetPinModalProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (visible) {
      setPin('');
      setConfirmPin('');
      setStep(1);
      setLocalError('');
    }
  }, [visible]);

  const handleKeyPress = (key: string) => {
    setLocalError('');
    
    if (key === 'cancel') {
      onClose();
      return;
    }
    
    if (key === 'backspace') {
      if (step === 1) {
        setPin(prev => prev.slice(0, -1));
      } else {
        setConfirmPin(prev => prev.slice(0, -1));
      }
      return;
    }

    if (step === 1) {
      if (pin.length < 6) {
        const newPin = pin + key;
        setPin(newPin);
        if (newPin.length === 6) {
          setTimeout(() => setStep(2), 300);
        }
      }
    } else {
      if (confirmPin.length < 6) {
        const newConfirm = confirmPin + key;
        setConfirmPin(newConfirm);
        if (newConfirm.length === 6) {
          setTimeout(() => {
            if (pin === newConfirm) {
              onConfirm(newConfirm);
            } else {
              setLocalError('Mã PIN không khớp. Vui lòng nhập lại.');
              setConfirmPin('');
            }
          }, 300);
        }
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

  const currentPin = step === 1 ? pin : confirmPin;
  const displayError = localError || errorMessage;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.dragIndicator} />
          
          <View style={styles.headerIconContainer}>
            <Ionicons name="key" size={28} color="#109185" />
          </View>

          <View style={styles.headerRow}>
            <Text style={styles.title}>
              {step === 1 ? 'Đặt lại mã PIN mới' : 'Xác nhận mã PIN'}
            </Text>
          </View>

          <Text style={styles.subtitle}>
            {step === 1 
              ? 'Vui lòng nhập 6 số cho mã PIN mới của bạn.' 
              : 'Vui lòng nhập lại 6 số để xác nhận.'}
          </Text>

          <View style={styles.pinContainer}>
            {[...Array(6)].map((_, i) => (
              <View 
                key={i} 
                style={[styles.pinDot, i < currentPin.length ? styles.pinDotActive : null]} 
              />
            ))}
          </View>

          {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}
          
          {/* Add empty space to maintain layout height when error is hidden or forgot pin is removed */}
          <View style={{ height: 32 }} />

          {renderKeypad()}
        </SafeAreaView>
      </View>
    </Modal>
  );
}
