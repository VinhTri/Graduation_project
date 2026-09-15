import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PastelHeaderShell, { PASTEL_PALETTE } from '@/shared/components/PastelHeaderShell/PastelHeaderShell';
import {
  supportService,
  CustomerSupportTicket,
  CustomerSupportMessage,
} from '@/shared/api/services/supportService';
import { styles } from './SupportDetailScreen.styles';

export const SupportDetailScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const ticketId = typeof id === 'string' ? parseInt(id, 10) : Number(id);

  const [ticket, setTicket] = useState<CustomerSupportTicket | null>(null);
  const [messages, setMessages] = useState<CustomerSupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const loadTicketDetail = useCallback(async (isSilent = false) => {
    if (!ticketId || isNaN(ticketId)) return;
    try {
      if (!isSilent) setLoading(true);
      const res = await supportService.getMyTicketDetail(ticketId);
      if (res && res.success && res.data) {
        setTicket(res.data);
        const newMsgs = res.data.messages || [];
        setMessages((prev) => {
          if (newMsgs.length > prev.length) {
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 150);
          }
          return newMsgs;
        });
      }
    } catch (error) {
      if (!isSilent) {
        console.log('Error loading ticket detail:', error);
        Alert.alert('Lỗi', 'Không thể tải chi tiết yêu cầu hỗ trợ');
      }
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  }, [ticketId]);

  // Initial load and auto-polling every 3 seconds
  useEffect(() => {
    loadTicketDetail(false);

    const interval = setInterval(() => {
      loadTicketDetail(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [loadTicketDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTicketDetail(true);
  };

  const handleSendMessage = async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed || sending || !ticketId) return;

    try {
      setSending(true);
      const res = await supportService.sendMessage(ticketId, { content: trimmed });
      if (res && res.success && res.data) {
        setInputMessage('');
        // Append new message to local state
        setMessages((prev) => [...prev, res.data]);
        if (ticket && ticket.status === 'CLOSED') {
          setTicket({ ...ticket, status: 'OPEN' });
        }
        // Scroll down
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 150);
      } else {
        Alert.alert('Lỗi', res.message || 'Không thể gửi tin nhắn lúc này');
      }
    } catch (error: any) {
      console.log('Error sending message:', error);
      Alert.alert('Lỗi', error?.response?.data?.message || 'Đã có lỗi xảy ra khi gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      return `${hours}:${minutes} - ${day}/${month}`;
    } catch {
      return dateStr;
    }
  };

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7' }]}>
            <Text style={[styles.statusBadgeText, { color: '#15803D' }]}>Mới</Text>
          </View>
        );
      case 'IN_PROGRESS':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.statusBadgeText, { color: '#B45309' }]}>Đang xử lý</Text>
          </View>
        );
      case 'CLOSED':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#F3F4F6' }]}>
            <Text style={[styles.statusBadgeText, { color: '#6B7280' }]}>Đã đóng</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderHeader = () => (
    <PastelHeaderShell contentStyle={styles.headerContent}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back-outline" size={22} color="#7C3AED" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>{ticket ? `Yêu cầu #${ticket.id}` : 'Chi tiết hỗ trợ'}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {ticket ? ticket.subject : 'Hỗ trợ khách hàng 24/7'}
            </Text>
          </View>
        </View>
        {ticket && renderStatusBadge(ticket.status)}
      </View>
    </PastelHeaderShell>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PASTEL_PALETTE.headerStart} />
      {renderHeader()}

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={PASTEL_PALETTE.accentDeep} />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {/* Top Ticket Overview Info Card */}
            {ticket && (
              <View style={styles.infoCard}>
                <View style={styles.infoTopRow}>
                  <View style={styles.ticketIdPill}>
                    <Ionicons name="pricetag-outline" size={13} color={PASTEL_PALETTE.accentDeep} />
                    <Text style={styles.ticketIdText}>Mã yêu cầu: #{ticket.id}</Text>
                  </View>
                  {renderStatusBadge(ticket.status)}
                </View>

                <Text style={styles.ticketSubject}>{ticket.subject}</Text>

                <View style={styles.ticketDateRow}>
                  <Ionicons name="time-outline" size={13} color={PASTEL_PALETTE.textMuted} />
                  <Text style={styles.ticketDateText}>
                    Tạo lúc: {formatMessageTime(ticket.createdAt)}
                  </Text>
                </View>

                {ticket.status === 'CLOSED' && (
                  <View style={styles.closedNotice}>
                    <Ionicons name="information-circle-outline" size={14} color={PASTEL_PALETTE.subtitle} />
                    <Text style={styles.closedNoticeText}>
                      Yêu cầu này đã hoàn tất. Gửi tin nhắn mới sẽ tự động mở lại hỗ trợ.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Chat Thread Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PASTEL_PALETTE.accentDeep]} />
              }
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
            >
              {messages.length === 0 ? (
                <View style={styles.emptyChatWrap}>
                  <MaterialCommunityIcons name="chat-processing-outline" size={40} color={PASTEL_PALETTE.textGray} />
                  <Text style={styles.emptyChatText}>Bắt đầu cuộc trò chuyện với tư vấn viên</Text>
                </View>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.senderType === 'USER';

                  if (isUser) {
                    return (
                      <View key={msg.id} style={styles.userBubbleRow}>
                        <View style={styles.userBubble}>
                          <Text style={styles.userBubbleText}>{msg.content}</Text>
                          <Text style={styles.userTimeText}>{formatMessageTime(msg.createdAt)}</Text>
                        </View>
                      </View>
                    );
                  }

                  return (
                    <View key={msg.id} style={styles.adminBubbleRow}>
                      <View style={styles.adminAvatarBox}>
                        <Feather name="headphones" size={16} color={PASTEL_PALETTE.accentDeep} />
                      </View>

                      <View style={styles.adminBubbleContainer}>
                        <View style={styles.adminSenderLabel}>
                          <Text style={styles.adminSenderName}>
                            {msg.senderUsername || 'Tư vấn viên SmartSpend'}
                          </Text>
                          <View style={styles.adminRoleBadge}>
                            <Text style={styles.adminRoleBadgeText}>CSKH</Text>
                          </View>
                        </View>

                        <View style={styles.adminBubble}>
                          <Text style={styles.adminBubbleText}>{msg.content}</Text>
                          <Text style={styles.adminTimeText}>{formatMessageTime(msg.createdAt)}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Bottom Chat Composer Bar */}
            <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <View style={styles.composerRow}>
                <TextInput
                  style={styles.composerInput}
                  placeholder="Nhập nội dung phản hồi..."
                  placeholderTextColor={PASTEL_PALETTE.textMuted}
                  value={inputMessage}
                  onChangeText={setInputMessage}
                  multiline
                />
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    (!inputMessage.trim() || sending) && styles.sendBtnDisabled,
                  ]}
                  onPress={handleSendMessage}
                  disabled={!inputMessage.trim() || sending}
                  activeOpacity={0.8}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

export default SupportDetailScreen;
