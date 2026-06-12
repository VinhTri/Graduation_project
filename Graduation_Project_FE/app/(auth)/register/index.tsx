import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  ScrollView, SafeAreaView, Platform, KeyboardAvoidingView
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { styles } from './_register.styles';
import FeatureSlider from '../../../shared/components/FeatureSlider/FeatureSlider';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Trạng thái ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* CÁC KHỐI TRÒN TRANG TRÍ ĐỂ TẠO HIỆU ỨNG BACKGROUND MỜ */}
      <View style={[styles.bgCircle, styles.circleTopLeft]} />
      <View style={[styles.bgCircle, styles.circleMiddleRight]} />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* ================= PHẦN TRÊN ================= */}
          <FeatureSlider />

          {/* ================= PHẦN DƯỚI (FORM) ================= */}
          <View style={styles.bottomSection}>
            <View style={styles.dragHandle} />
            
            <Text style={styles.brandTitle}>SmartSpend</Text>
            <Text style={styles.brandSubtitle}>Nhập thông tin để đăng ký tài khoản mới</Text>

            <View style={styles.formContainer}>
              {/* Họ và tên */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Họ và tên</Text>
                <View style={styles.inputContainer}>
                  <Feather name="user" size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Nhập họ và tên của bạn" 
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Địa chỉ Email</Text>
                <View style={styles.inputContainer}>
                  <Feather name="mail" size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Nhập email của bạn" 
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {/* Mật khẩu */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mật khẩu</Text>
                <View style={styles.inputContainer}>
                  <Feather name="lock" size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)" 
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Feather name={showPassword ? "eye" : "eye-off"} size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Xác nhận mật khẩu */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Xác nhận mật khẩu</Text>
                <View style={styles.inputContainer}>
                  <Feather name="check-circle" size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Nhập lại mật khẩu" 
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                    <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Nút đăng ký */}
              <TouchableOpacity style={styles.registerButton} activeOpacity={0.8}>
                <Text style={styles.registerButtonText}>Đăng ký tài khoản</Text>
              </TouchableOpacity>

              {/* Chuyển hướng đăng nhập */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Bạn đã có tài khoản? </Text>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>Đăng nhập ngay</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
