import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { styles } from '@/features/auth/styles/setup-pin.styles';
import { axiosClient } from '../../../shared/api/axiosClient';
import SuccessModal from '../../../shared/components/SuccessModal/SuccessModal';

export default function SetupPinScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [error, setError] = useState('');
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);

  const handleKeyPress = (key: string) => {
    setError('');
    
    if (key === 'backspace') {
      if (step === 'create') {
        setPin(prev => prev.slice(0, -1));
      } else {
        setConfirmPin(prev => prev.slice(0, -1));
      }
      return;
    }

    if (step === 'create') {
      if (pin.length < 6) {
        const newPin = pin + key;
        setPin(newPin);
        if (newPin.length === 6) {
          setTimeout(() => setStep('confirm'), 300);
        }
      }
    } else {
      if (confirmPin.length < 6) {
        const newConfirmPin = confirmPin + key;
        setConfirmPin(newConfirmPin);
        if (newConfirmPin.length === 6) {
          if (newConfirmPin === pin) {
            submitPin(newConfirmPin);
          } else {
            setError('Mã PIN không khớp. Vui lòng thử lại.');
            setConfirmPin('');
            setStep('create');
            setPin('');
          }
        }
      }
    }
  };

  const submitPin = async (finalPin: string) => {
    try {
      const res: any = await axiosClient.post('/api/v1/auth/setup-pin', { pinCode: finalPin });
      if (res.success) {
        setIsSuccessVisible(true);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể cài đặt mã PIN. Vui lòng thử lại.');
      setConfirmPin('');
      setStep('create');
      setPin('');
    }
  };

  const renderKeypad = () => {
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'backspace']
    ];

    return (
      <View style={styles.keypadContainer}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, colIndex) => {
              if (key === '') return <View key={colIndex} style={styles.keyEmpty} />;
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

  const currentPin = step === 'create' ? pin : confirmPin;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Feather name="lock" size={32} color="#109185" />
        </View>
        <Text style={styles.title}>
          {step === 'create' ? 'Thiết lập mã PIN' : 'Xác nhận mã PIN'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'create' 
            ? 'Mã PIN 6 số sẽ được dùng để xác thực các giao dịch rút tiền của bạn.' 
            : 'Vui lòng nhập lại mã PIN để xác nhận.'}
        </Text>
      </View>

      <View style={styles.pinContainer}>
        {[...Array(6)].map((_, i) => (
          <View 
            key={i} 
            style={[styles.pinDot, i < currentPin.length ? styles.pinDotActive : null]} 
          />
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {renderKeypad()}

      <SuccessModal
        visible={isSuccessVisible}
        title="Thiết lập thành công!"
        message="Mã PIN của bạn đã được lưu lại."
        isAutoClose={true}
        onClose={() => {
          setIsSuccessVisible(false);
          router.replace('/(tabs)/home');
        }}
      />
    </SafeAreaView>
  );
}
