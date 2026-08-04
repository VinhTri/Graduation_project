import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from './ServiceLookupScreen.styles';

const SERVICE_CONFIG = {
  electricity: { title: 'Tiền Điện', icon: 'flash', color: '#F59E0B', bg: '#FEF3C7', gradient: ['#FDE68A', '#F59E0B'] as const },
  water: { title: 'Tiền Nước', icon: 'water', color: '#3B82F6', bg: '#DBEAFE', gradient: ['#93C5FD', '#3B82F6'] as const },
  internet: { title: 'Tiền Mạng', icon: 'wifi', color: '#8B5CF6', bg: '#EDE9FE', gradient: ['#C4B5FD', '#8B5CF6'] as const },
  rent: { title: 'Tiền Nhà', icon: 'home', color: '#10B981', bg: '#D1FAE5', gradient: ['#6EE7B7', '#10B981'] as const },
};

export const ServiceLookupScreen = () => {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: keyof typeof SERVICE_CONFIG }>();
  
  const config = SERVICE_CONFIG[type] || SERVICE_CONFIG.electricity;

  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLookup = () => {
    if (!customerId) return;
    setLoading(true);
    
    // Giả lập gọi API tra cứu (Mocking network delay)
    setTimeout(() => {
      setLoading(false);
      // Chuyển sang màn hình tạo hóa đơn, mang theo dữ liệu đã tra cứu được
      router.push({
         pathname: '/invoice/create',
         params: { 
            prefillName: `${config.title} - ${customerId}`, 
            prefillAmount: Math.floor(Math.random() * 1000000) + 50000 // Số tiền ngẫu nhiên từ 50k - 1tr
         }
      });
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={config.gradient} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán {config.title.toLowerCase()}</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
           <View style={[styles.iconCircle, { backgroundColor: '#FFF' }]}>
             <Ionicons name={config.icon as any} size={40} color={config.color} />
           </View>
           <Text style={styles.instructionText}>
             Nhập mã khách hàng để kiểm tra cước {config.title.toLowerCase()} của bạn.
           </Text>
        </View>

        <View style={styles.inputGroup}>
           <Text style={styles.label}>Nhà cung cấp</Text>
           <View style={styles.pickerContainer}>
             <TextInput 
                style={[styles.input, { backgroundColor: '#F8FAFC', color: '#94A3B8' }]} 
                value="Tự động nhận diện" 
                editable={false} 
             />
           </View>
        </View>

        <View style={styles.inputGroup}>
           <Text style={styles.label}>Mã khách hàng / Mã hợp đồng</Text>
           <TextInput 
              style={styles.input} 
              placeholder="Ví dụ: PE012345678"
              value={customerId}
              onChangeText={setCustomerId}
              autoCapitalize="characters"
           />
        </View>

        <TouchableOpacity 
          style={[styles.lookupBtn, { backgroundColor: customerId ? config.color : '#CBD5E1', shadowColor: config.color }]}
          disabled={!customerId}
          onPress={handleLookup}
        >
          <Text style={styles.lookupBtnText}>Kiểm tra hóa đơn</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
           <ActivityIndicator size="large" color={config.color} />
           <Text style={styles.loadingText}>Đang tra cứu hệ thống...</Text>
        </View>
      )}
    </View>
  );
};
