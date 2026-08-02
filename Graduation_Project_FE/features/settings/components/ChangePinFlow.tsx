import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../../shared/api/services/auth.service';
import { PinModal, OtpModal, ResetPinModal, SuccessModal } from '../../../shared/components';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export const ChangePinFlow = ({ visible, onClose }: Props) => {
  const [currentPinVisible, setCurrentPinVisible] = useState(false);
  const [newPinVisible, setNewPinVisible] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [mode, setMode] = useState<'change' | 'forgot'>('change');
  const [pinError, setPinError] = useState('');
  const [resetPinError, setResetPinError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCurrentPinVisible(false);
      setNewPinVisible(false);
      setOtpVisible(false);
      setSuccessVisible(false);
      setCurrentPin('');
      setForgotOtp('');
      setMode('change');
      setPinError('');
      setResetPinError('');
      setOtpError('');
      return;
    }

    setMode('change');
    setPinError('');
    setCurrentPinVisible(true);
    AsyncStorage.getItem('userEmail').then(async (email) => {
      if (email) {
        setUserEmail(email);
        return;
      }
      try {
        const { userService } = await import('../../../shared/api/services/userService');
        const profile = await userService.getMyProfile();
        if (profile?.email) {
          setUserEmail(profile.email);
          await AsyncStorage.setItem('userEmail', profile.email);
        }
      } catch {
        // ignore
      }
    });
  }, [visible]);

  const closeAll = () => {
    setCurrentPinVisible(false);
    setNewPinVisible(false);
    setOtpVisible(false);
    setSuccessVisible(false);
    onClose();
  };

  const handleCurrentPin = (pin: string) => {
    setCurrentPin(pin);
    setPinError('');
    setCurrentPinVisible(false);
    setTimeout(() => setNewPinVisible(true), 280);
  };

  const handleForgotPin = async () => {
    setCurrentPinVisible(false);
    setLoading(true);
    try {
      await authService.forgotPin();
      setMode('forgot');
      setOtpError('');
      setTimeout(() => setOtpVisible(true), 280);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể gửi mã OTP khôi phục PIN');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!userEmail) {
      setOtpError('Không tìm thấy email tài khoản');
      return;
    }
    setLoading(true);
    try {
      await authService.verifyOtp({ email: userEmail, otp, purpose: 'RESET_PIN' });
      setForgotOtp(otp);
      setOtpError('');
      setOtpVisible(false);
      setTimeout(() => setNewPinVisible(true), 280);
    } catch (error: any) {
      setOtpError(error?.message || 'Mã OTP không chính xác');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPinConfirm = async (newPinCode: string) => {
    setResetPinError('');
    setLoading(true);
    try {
      if (mode === 'forgot') {
        await authService.resetPin({ otp: forgotOtp, newPinCode });
      } else {
        await authService.changePin({ currentPin, newPinCode });
      }
      setNewPinVisible(false);
      setSuccessVisible(true);
    } catch (error: any) {
      const msg = error?.message || 'Không thể đổi mã PIN';
      if (mode === 'change' && msg.toLowerCase().includes('pin')) {
        setNewPinVisible(false);
        setPinError(msg);
        setTimeout(() => {
          setCurrentPin('');
          setCurrentPinVisible(true);
        }, 280);
      } else {
        setResetPinError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!visible && !successVisible) return null;

  return (
    <>
      <PinModal
        visible={currentPinVisible}
        onClose={closeAll}
        onConfirm={handleCurrentPin}
        onForgotPin={loading ? undefined : handleForgotPin}
        errorMessage={pinError}
        title="Nhập mã PIN hiện tại"
        subtitle="Nhập mã PIN 6 số hiện tại để tiếp tục đổi PIN."
      />

      <OtpModal
        visible={otpVisible}
        email={userEmail}
        errorMessage={otpError}
        onClose={closeAll}
        onVerify={handleVerifyOtp}
      />

      <ResetPinModal
        visible={newPinVisible}
        onClose={closeAll}
        onConfirm={handleNewPinConfirm}
        errorMessage={resetPinError}
      />

      <SuccessModal
        visible={successVisible}
        title="Đổi mã PIN thành công!"
        message="Mã PIN bảo mật của bạn đã được cập nhật."
        onClose={closeAll}
      />
    </>
  );
};
