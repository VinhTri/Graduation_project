import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { styles } from '@/features/auth/styles/verify-pin.styles';
import { axiosClient } from '../../../shared/api/axiosClient';

export default function VerifyPinScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKeyPress = (key: string) => {
    if (loading) return;
    setError('');

    if (key === 'backspace') {
      setPin(prev => prev.slice(0, -1));
      return;
    }

    if (pin.length < 6) {
      const newPin = pin + key;
      setPin(newPin);
      if (newPin.length === 6) {
        // Tự động gọi API xác thực khi đủ 6 số
        setTimeout(() => submitPin(newPin), 300);
      }
    }
  };

  const submitPin = async (enteredPin: string) => {
    setLoading(true);
    try {
      const res: any = await axiosClient.post('/api/v1/auth/verify-pin', { pinCode: enteredPin });
      if (res.success) {
        // Thành công: chuyển vào trang chính
        router.replace('/(tabs)/home');
      } else {
        setError('Mã PIN không chính xác. Vui lòng thử lại.');
        setPin('');
      }
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      setPin('');
    } finally {
      setLoading(false);
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
                    disabled={loading}
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
                  disabled={loading}
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Feather name="lock" size={32} color="#109185" />
        </View>
        <Text style={styles.title}>Nhập mã PIN</Text>
        <Text style={styles.subtitle}>
          Vui lòng nhập mã PIN bảo mật gồm 6 chữ số để đăng nhập vào trang chính.
        </Text>
      </View>

      <View style={styles.pinContainer}>
        {[...Array(6)].map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.pinDot,
              i < pin.length ? styles.pinDotActive : {}
            ]} 
          />
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      {loading && (
        <ActivityIndicator size="small" color="#109185" style={{ marginTop: 20 }} />
      )}

      {renderKeypad()}
    </SafeAreaView>
  );
}
