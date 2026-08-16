import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PastelHeaderShell from '@/shared/components/PastelHeaderShell/PastelHeaderShell';
import { PASTEL_PALETTE } from '@/shared/constants/PastelPalette';
import { supportService, CustomerSupportTicket } from '@/shared/api/services/supportService';
import { styles } from './SupportCenterScreen.styles';

interface FAQItem {
  id: string;
  category: string;
  categoryName: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    category: 'deposit',
    categoryName: 'Nạp & Rút tiền',
    icon: 'wallet-outline',
    iconColor: '#7C3AED',
    bgColor: '#EDE9FE',
    question: 'Thời gian nạp và rút tiền từ ngân hàng mất bao lâu?',
    answer:
      'Hệ thống SmartSpend hỗ trợ nạp và rút tiền tức thì 24/7 qua cổng ngân hàng liên kết. Tiền sẽ được cộng vào ví hoặc tài khoản ngân hàng của bạn chỉ sau vài giây.',
  },
  {
    id: '2',
    category: 'split',
    categoryName: 'Chia tiền',
    icon: 'people-outline',
    iconColor: '#2563EB',
    bgColor: '#DBEAFE',
    question: 'Tính năng chia tiền (Split Bill) hoạt động như thế nào?',
    answer:
      'Bạn có thể tạo hóa đơn chia tiền, chọn bạn bè trong danh bạ và chia đều hoặc tùy chỉnh số tiền cho từng người. Khi tạo xong, hệ thống sẽ gửi thông báo đến các thành viên và bạn có thể gửi lời nhắc nhở chủ động (mỗi 12 giờ một lần).',
  },
  {
    id: '3',
    category: 'split',
    categoryName: 'Chia tiền',
    icon: 'notifications-outline',
    iconColor: '#EA580C',
    bgColor: '#FFEDD5',
    question: 'Làm sao để biết bạn bè đã thanh toán phần chia tiền?',
    answer:
      'Khi bạn bè chuyển khoản thanh toán, trạng thái thành viên trong hóa đơn chia tiền sẽ tự động chuyển sang "Đã trả", thanh tiến độ thu tiền được cập nhật và bạn sẽ nhận được thông báo ngay lập tức.',
  },
  {
    id: '4',
    category: 'fund',
    categoryName: 'Quỹ nhóm',
    icon: 'cube-outline',
    iconColor: '#059669',
    bgColor: '#D1FAE5',
    question: 'Làm thế nào để tạo Quỹ nhóm chung và mời thành viên?',
    answer:
      'Tại mục Quỹ nhóm, nhấn "Tạo quỹ mới", nhập tên quỹ và mục tiêu tiết kiệm. Sau khi tạo quỹ, bạn có thể gửi lời mời tham gia đến bạn bè qua email tài khoản SmartSpend.',
  },
  {
    id: '5',
    category: 'security',
    categoryName: 'Bảo mật',
    icon: 'key-outline',
    iconColor: '#DC2626',
    bgColor: '#FEE2E2',
    question: 'Tôi quên mã PIN giao dịch thì phải làm sao?',
    answer:
      'Bạn có thể vào mục Tài khoản > Đổi mã PIN > chọn "Quên mã PIN". Hệ thống sẽ gửi mã xác thực OTP về email đăng ký của bạn để thiết lập lại mã PIN mới.',
  },
  {
    id: '6',
    category: 'transfer',
    categoryName: 'Chuyển tiền',
    icon: 'swap-horizontal-outline',
    iconColor: '#0284C7',
    bgColor: '#E0F2FE',
    question: 'Giao dịch chuyển tiền trên SmartSpend có mất phí không?',
    answer:
      'Tất cả giao dịch chuyển tiền giữa các tài khoản SmartSpend và thanh toán hóa đơn đều hoàn toàn miễn phí 100%.',
  },
  {
    id: '7',
    category: 'security',
    categoryName: 'Bảo mật',
    icon: 'shield-checkmark-outline',
    iconColor: '#16A34A',
    bgColor: '#DCFCE7',
    question: 'Làm thế nào để bảo mật tài khoản tốt nhất?',
    answer:
      'Hãy kích hoạt bảo mật vân tay/FaceID, không chia sẻ mã OTP hoặc mã PIN cho bất kỳ ai. SmartSpend không bao giờ yêu cầu cung cấp mã PIN dưới mọi hình thức.',
  },
];

const CATEGORIES = [
  { key: 'all', label: 'Tất cả' },
  { key: 'deposit', label: 'Nạp & Rút' },
  { key: 'split', label: 'Chia tiền' },
  { key: 'fund', label: 'Quỹ nhóm' },
  { key: 'transfer', label: 'Chuyển tiền' },
  { key: 'security', label: 'Bảo mật' },
];

const TOPIC_SUGGESTIONS = [
  'Nạp / Rút tiền',
  'Giao dịch chuyển khoản',
  'Tính năng chia tiền',
  'Quỹ chung nhóm',
  'Lỗi kỹ thuật / Ứng dụng',
  'Khác',
];

const removeVietnameseTones = (str: string): string => {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

export const SupportCenterScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'FAQ' | 'TICKETS'>('FAQ');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Tickets state
  const [tickets, setTickets] = useState<CustomerSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create Ticket Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('Nạp / Rút tiền');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subjectError, setSubjectError] = useState('');
  const [contentError, setContentError] = useState('');

  const loadTickets = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await supportService.getMyTickets();
      if (res && res.success) {
        setTickets(res.data || []);
      } else {
        setTickets([]);
      }
    } catch (error) {
      if (!isSilent) console.log('Error loading support tickets:', error);
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTickets(false);

      const interval = setInterval(() => {
        loadTickets(true);
      }, 4000);

      return () => clearInterval(interval);
    }, [loadTickets])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets(true);
  };

  const openTicketsCount = useMemo(() => {
    return tickets.filter((t) => t.status === 'OPEN').length;
  }, [tickets]);

  const inProgressTicketsCount = useMemo(() => {
    return tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  }, [tickets]);

  const closedTicketsCount = useMemo(() => {
    return tickets.filter((t) => t.status === 'CLOSED').length;
  }, [tickets]);

  const normalizedQuery = removeVietnameseTones(searchQuery);

  const displayedFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const normQ = removeVietnameseTones(item.question);
      const normA = removeVietnameseTones(item.answer);
      const matchQuery = !normalizedQuery || normQ.includes(normalizedQuery) || normA.includes(normalizedQuery);
      return matchCategory && matchQuery;
    });
  }, [selectedCategory, normalizedQuery]);

  const displayedTickets = useMemo(() => {
    return tickets.filter((t) => {
      const normSub = removeVietnameseTones(t.subject);
      const normLast = removeVietnameseTones(t.lastMessage || '');
      const matchQuery =
        !normalizedQuery ||
        normSub.includes(normalizedQuery) ||
        normLast.includes(normalizedQuery) ||
        t.id.toString().includes(normalizedQuery);
      return matchQuery;
    });
  }, [tickets, normalizedQuery]);

  const handleOpenCreateTicket = (presetTopic?: string) => {
    if (presetTopic) {
      setSelectedTopic(presetTopic);
      setSubject(`[${presetTopic}] Cần hỗ trợ`);
    } else {
      setSelectedTopic('Nạp / Rút tiền');
      setSubject('');
    }
    setContent('');
    setSubjectError('');
    setContentError('');
    setModalVisible(true);
  };

  const handleSelectTopic = (topic: string) => {
    setSelectedTopic(topic);
    if (!subject || TOPIC_SUGGESTIONS.some((t) => subject.includes(t))) {
      setSubject(`[${topic}] Cần hỗ trợ`);
    }
  };

  const handleSubmitTicket = async () => {
    let isValid = true;
    if (!subject.trim()) {
      setSubjectError('Vui lòng nhập tiêu đề yêu cầu');
      isValid = false;
    } else {
      setSubjectError('');
    }
    
    if (!content.trim()) {
      setContentError('Vui lòng nhập nội dung chi tiết cần hỗ trợ');
      isValid = false;
    } else {
      setContentError('');
    }

    if (!isValid) return;

    try {
      setSubmitting(true);
      const res = await supportService.createTicket({
        subject: subject.trim(),
        content: content.trim(),
      });

      if (res && res.success && res.data) {
        setModalVisible(false);
        setSubject('');
        setContent('');
        loadTickets(true);
        // Chuyển thẳng vào màn hình chat của ticket mới
        router.push({
          pathname: '/settings/support/[id]',
          params: { id: res.data.id },
        } as any);
      } else {
        Alert.alert('Lỗi', res.message || 'Không thể tạo yêu cầu lúc này');
      }
    } catch (error: any) {
      console.log('Error creating ticket:', error);
      Alert.alert('Lỗi', error?.response?.data?.message || 'Đã có lỗi xảy ra khi gửi yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTicketDate = (dateStr?: string) => {
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

  const renderStatusBadge = (status: string) => {
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
            <Text style={styles.headerTitle}>Trung tâm hỗ trợ</Text>
            <Text style={styles.headerSubtitle}>Hỗ trợ & giải đáp 24/7</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleOpenCreateTicket()}
          activeOpacity={0.8}
        >
          <Ionicons name="add-outline" size={18} color={PASTEL_PALETTE.title} />
          <Text style={styles.addButtonText}>Gửi yêu cầu</Text>
        </TouchableOpacity>
      </View>
    </PastelHeaderShell>
  );

  const renderSummaryCard = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Tổng quan yêu cầu hỗ trợ</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Tổng yêu cầu</Text>
          <Text style={styles.summaryValue}>{tickets.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Đang xử lý</Text>
          <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
            {openTicketsCount + inProgressTicketsCount}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Đã hoàn tất</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>{closedTicketsCount}</Text>
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'FAQ' && styles.tabButtonActive]}
        onPress={() => setActiveTab('FAQ')}
        activeOpacity={0.8}
      >
        <Ionicons
          name="help-circle-outline"
          size={18}
          color={activeTab === 'FAQ' ? PASTEL_PALETTE.accentDeep : PASTEL_PALETTE.textGray}
        />
        <Text style={[styles.tabButtonText, activeTab === 'FAQ' && styles.tabButtonTextActive]}>
          Câu hỏi thường gặp
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'TICKETS' && styles.tabButtonActive]}
        onPress={() => setActiveTab('TICKETS')}
        activeOpacity={0.8}
      >
        <Ionicons
          name="chatbubbles-outline"
          size={18}
          color={activeTab === 'TICKETS' ? PASTEL_PALETTE.accentDeep : PASTEL_PALETTE.textGray}
        />
        <Text style={[styles.tabButtonText, activeTab === 'TICKETS' && styles.tabButtonTextActive]}>
          Yêu cầu của tôi
        </Text>
        {openTicketsCount + inProgressTicketsCount > 0 && (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{openTicketsCount + inProgressTicketsCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSearch = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search-outline" size={20} color={PASTEL_PALETTE.textGray} />
      <TextInput
        style={styles.searchInput}
        placeholder={activeTab === 'FAQ' ? 'Tìm kiếm câu hỏi, vấn đề...' : 'Tìm kiếm theo tiêu đề, mã yêu cầu...'}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor={PASTEL_PALETTE.textGray}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={18} color={PASTEL_PALETTE.textGray} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCategoryPills = () => {
    if (activeTab !== 'FAQ') return null;
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.catPill, isActive && styles.catPillActive]}
              onPress={() => setSelectedCategory(cat.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderFAQItem = ({ item }: { item: FAQItem }) => {
    const isOpen = expandedFaqId === item.id;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpandedFaqId(isOpen ? null : item.id)}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
              <Ionicons name={item.icon} size={20} color={item.iconColor} />
            </View>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>{item.question}</Text>
              <Text style={styles.cardSubtitle}>{item.categoryName}</Text>
            </View>
          </View>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={PASTEL_PALETTE.subtitle}
          />
        </View>

        {isOpen && (
          <View style={styles.faqAnswerContainer}>
            <Text style={styles.faqAnswerText}>{item.answer}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderTicketItem = ({ item }: { item: CustomerSupportTicket }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/settings/support/[id]',
          params: { id: item.id },
        } as any)
      }
      activeOpacity={0.75}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconContainer, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="chatbox-ellipses-outline" size={20} color={PASTEL_PALETTE.accentDeep} />
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.subject}
            </Text>
            <Text style={styles.cardSubtitle}>Mã yêu cầu: #{item.id}</Text>
          </View>
        </View>
        {renderStatusBadge(item.status)}
      </View>

      {item.lastMessage ? (
        <Text style={styles.cardMessagePreview} numberOfLines={2}>
          {item.lastMessage}
        </Text>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.cardDateRow}>
          <Ionicons name="time-outline" size={13} color={PASTEL_PALETTE.textGray} />
          <Text style={styles.cardDateText}>
            {formatTicketDate(item.lastMessageAt || item.createdAt)}
          </Text>
        </View>
        <Text style={styles.cardActionText}>Xem & Trò chuyện ›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons
          name={activeTab === 'FAQ' ? 'search-outline' : 'chatbubbles-outline'}
          size={48}
          color={PASTEL_PALETTE.accentDeep}
        />
      </View>
      <Text style={styles.emptyText}>
        {activeTab === 'FAQ'
          ? 'Không tìm thấy câu hỏi phù hợp'
          : 'Chưa có yêu cầu hỗ trợ nào'}
      </Text>
      <Text style={styles.emptySubText}>
        {activeTab === 'FAQ'
          ? 'Thử tìm kiếm với từ khóa khác hoặc gửi yêu cầu trực tiếp cho đội ngũ hỗ trợ.'
          : 'Hãy gửi yêu cầu hỗ trợ nếu bạn cần giải đáp thắc mắc hoặc xử lý sự cố.'}
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => handleOpenCreateTicket()}
        activeOpacity={0.8}
      >
        <Text style={styles.createButtonText}>Gửi yêu cầu hỗ trợ</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PASTEL_PALETTE.headerStart} />
      {renderHeader()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PASTEL_PALETTE.accentDeep} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'FAQ' ? (displayedFaqs as any) : (displayedTickets as any)}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={
            <View>
              {renderSummaryCard()}
              {renderTabs()}
              {renderSearch()}
              {renderCategoryPills()}
            </View>
          }
          renderItem={activeTab === 'FAQ' ? (renderFAQItem as any) : (renderTicketItem as any)}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 30 }]}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PASTEL_PALETTE.accentDeep]} />
          }
        />
      )}

      {/* CREATE TICKET MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo yêu cầu hỗ trợ mới</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Ionicons name="close" size={20} color={PASTEL_PALETTE.title} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Chủ đề hỗ trợ</Text>
              <View style={styles.topicRow}>
                {TOPIC_SUGGESTIONS.map((topic) => {
                  const isActive = selectedTopic === topic;
                  return (
                    <TouchableOpacity
                      key={topic}
                      style={[styles.topicChip, isActive && styles.topicChipActive]}
                      onPress={() => handleSelectTopic(topic)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.topicChipText, isActive && styles.topicChipTextActive]}>
                        {topic}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Tiêu đề vấn đề *</Text>
                <Text style={styles.charCount}>{subject.length}/50</Text>
              </View>
              <TextInput
                style={[styles.modalInput, subjectError ? styles.inputError : null]}
                placeholder="VD: Cần hỗ trợ nạp tiền qua ngân hàng..."
                placeholderTextColor={PASTEL_PALETTE.textGray}
                value={subject}
                maxLength={50}
                onChangeText={(text) => {
                  setSubject(text);
                  if (subjectError) setSubjectError('');
                }}
              />
              {!!subjectError && <Text style={styles.errorText}>{subjectError}</Text>}

              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Nội dung chi tiết *</Text>
                <Text style={styles.charCount}>{content.length}/150</Text>
              </View>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea, contentError ? styles.inputError : null]}
                placeholder="Mô tả cụ thể vấn đề hoặc mã giao dịch bạn cần được trợ giúp..."
                placeholderTextColor={PASTEL_PALETTE.textGray}
                value={content}
                maxLength={150}
                onChangeText={(text) => {
                  setContent(text);
                  if (contentError) setContentError('');
                }}
                multiline
              />
              {!!contentError && <Text style={styles.errorText}>{contentError}</Text>}

              <TouchableOpacity
                style={[styles.modalSubmitBtn, submitting && styles.modalSubmitBtnDisabled]}
                onPress={handleSubmitTicket}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Gửi yêu cầu hỗ trợ</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default SupportCenterScreen;
