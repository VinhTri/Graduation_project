import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  ScrollView, SafeAreaView, Platform, KeyboardAvoidingView
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { styles } from './_login.styles';
import FeatureSlider from '../../../shared/components/FeatureSlider/FeatureSlider';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Trạng thái ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);

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
            <Text style={styles.brandSubtitle}>Đăng nhập để quản lý tài chính cá nhân</Text>

            <View style={styles.formContainer}>
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
                    placeholder="Nhập mật khẩu" 
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

              {/* Quên mật khẩu */}
              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity>
                  <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </View>

              {/* Nút đăng nhập */}
              <TouchableOpacity style={styles.loginButton} activeOpacity={0.8}>
                <Text style={styles.loginButtonText}>Đăng nhập</Text>
              </TouchableOpacity>

              {/* Hoặc tiếp tục bằng */}
              <View style={styles.dividerContainer}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>Hoặc tiếp tục bằng</Text>
                <View style={styles.line} />
              </View>

              {/* Đăng nhập mạng xã hội */}
              <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                  <View style={styles.socialContent}>
                    <FontAwesome5 name="google" size={18} color="#EA4335" />
                    <Text style={styles.socialText}>Google</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                  <View style={styles.socialContent}>
                    <FontAwesome5 name="apple" size={18} color="#000000" />
                    <Text style={styles.socialText}>Apple</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Chuyển hướng đăng ký */}
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Bạn chưa có tài khoản? </Text>
                <TouchableOpacity onPress={() => router.replace("/(auth)/register")}>
                  <Text style={styles.registerLink}>Đăng ký ngay</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
