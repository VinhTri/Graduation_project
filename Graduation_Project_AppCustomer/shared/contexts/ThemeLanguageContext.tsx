import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'vi' | 'en';

export interface ThemeColors {
  bg: string;
  bgSoft: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  headerGradient: readonly [string, string, string];
  navHeaderBg: string;
  statusBarStyle: 'dark-content' | 'light-content';
  shadowColor: string;
  iconColor: string;
  divider: string;
}

export const LIGHT_THEME: ThemeColors = {
  bg: '#FFF8FC',
  bgSoft: '#FFF1F8',
  card: '#FFFFFF',
  cardBorder: '#F3E8FF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  primary: '#EC4899',
  primaryDark: '#BE185D',
  primarySoft: '#FCE7F3',
  headerGradient: ['#FFD6EC', '#E9D5FF', '#BFDBFE'],
  navHeaderBg: '#FFFFFF',
  statusBarStyle: 'dark-content',
  shadowColor: 'rgba(236, 72, 153, 0.08)',
  iconColor: '#EC4899',
  divider: '#F3E8FF',
};

export const DARK_THEME: ThemeColors = {
  bg: '#0F172A',
  bgSoft: '#1E293B',
  card: '#1E293B',
  cardBorder: '#334155',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#F472B6',
  primaryDark: '#EC4899',
  primarySoft: '#371B2D',
  headerGradient: ['#1E1B4B', '#31103F', '#1E293B'],
  navHeaderBg: '#1E293B',
  statusBarStyle: 'light-content',
  shadowColor: 'rgba(0, 0, 0, 0.3)',
  iconColor: '#F472B6',
  divider: '#334155',
};

export const translations = {
  vi: {
    // Tabs
    homeTab: 'Trang chủ',
    walletTab: 'Ví',
    fundsTab: 'Quỹ nhóm',
    notebookTab: 'Sổ tay',
    moreTab: 'Tài khoản',

    // Navigation / Header
    account: 'Tài khoản',
    settings: 'Cài đặt',
    appSettings: 'Cài đặt ứng dụng',
    darkMode: 'Giao diện & Chế độ tối',
    language: 'Ngôn ngữ',
    back: 'Quay lại',

    finance: 'Tài chính',
    utilities: 'Tiện ích',
    security: 'Bảo mật',
    accountSecurity: 'Bảo mật tài khoản',
    accountSecuritySub: 'Mật khẩu, mã PIN',
    changePasswordSub: 'Cập nhật mật khẩu đăng nhập',
    changePin: 'Đổi mã PIN',
    changePinSub: 'Cập nhật PIN bảo mật giao dịch',
    supportAndSettings: 'Hỗ trợ & Cài đặt',

    appSettingsSubtitle: 'Tùy chỉnh giao diện, ngôn ngữ và ứng dụng',
    themeSubtitle: 'Thay đổi chế độ sáng/tối toàn ứng dụng',
    languageSubtitle: 'Chọn ngôn ngữ hiển thị',
    themeSystem: 'Tự động (Theo hệ thống)',
    themeSystemSub: 'Điều chỉnh theo cài đặt hệ thống thiết bị',
    themeLight: 'Chế độ Sáng',
    themeLightSub: 'Giao diện sáng rạng rỡ với gam màu pastel',
    themeDark: 'Chế độ Tối',
    themeDarkSub: 'Giao diện tối dịu mắt, tiết kiệm pin',

    vietnamese: 'Tiếng Việt',
    english: 'English',

    bankBinding: 'Liên kết ngân hàng',
    bankBindingSub: 'Quản lý tài khoản ngân hàng',
    smartSpendWallet: 'Ví SmartSpend',
    walletSub: 'Số dư và cài đặt ví',
    expenseNotebook: 'Sổ tay chi tiêu',
    notebookSub: 'Ghi chép thu chi hàng ngày',

    invoiceManagement: 'Quản lý hóa đơn',
    invoiceSub: 'Theo dõi và thanh toán hóa đơn',
    groupFund: 'Quỹ nhóm',
    groupFundSub: 'Quỹ chung cùng bạn bè',

    supportCenter: 'Trung tâm hỗ trợ',
    supportSub: 'Câu hỏi thường gặp',

    changePassword: 'Đổi mật khẩu',
    biometrics: 'Xác thực sinh trắc học',
    logout: 'Đăng xuất',

    selectTheme: 'Chọn giao diện',
    selectLanguage: 'Chọn ngôn ngữ',
    preview: 'Xem trước giao diện',
    previewText: 'SmartSpend mang đến trải nghiệm quản lý tài chính cá nhân thông minh và hiện đại.',
    appliedImmediately: 'Thay đổi sẽ được áp dụng ngay lập tức trên toàn ứng dụng.',

    // Home Screen
    welcome: 'Xin chào',
    totalBalance: 'Tổng số dư ví',
    availableBalance: 'Số dư khả dụng',
    services: 'Dịch vụ tiện ích',
    recentActivity: 'Hoạt động gần đây',
    viewAll: 'Xem tất cả',
    aiInsights: 'Gợi ý từ AI',
    discoverMore: 'Khám phá thêm',

    // Wallet Screen
    deposit: 'Nạp tiền',
    withdraw: 'Rút tiền',
    transfer: 'Chuyển tiền',
    transactionHistory: 'Lịch sử giao dịch',
    statisticsReport: 'Báo cáo thống kê',
    allTransactions: 'Tất cả giao dịch',
    income: 'Thu nhập',
    expense: 'Chi tiêu',
    totalIncome: 'Tổng thu',
    totalExpense: 'Tổng chi',

    // Notebook Screen
    monthlyOverview: 'Tổng quan tháng này',
    addTransaction: 'Thêm thu chi',
    categorySpending: 'Phân loại chi tiêu',
    recentRecords: 'Ghi chép gần đây',
    cashBalance: 'Số dư tiền mặt',

    // Group Fund Screen
    createFund: 'Tạo quỹ mới',
    activeFunds: 'Quỹ đang hoạt động',
    members: 'thành viên',
    contribute: 'Đóng góp',
    targetAmount: 'Mục tiêu',

    // Invoice Screen
    createInvoice: 'Tạo hóa đơn',
    pendingInvoices: 'Chưa thanh toán',
    paidInvoices: 'Đã thanh toán',
    overdueInvoices: 'Quá hạn',

    // Contacts Screen
    contacts: 'Danh bạ',
    searchUser: 'Tìm kiếm người dùng...',
    addFriend: 'Thêm bạn',
    friendRequests: 'Lời mời kết bạn',

    // Categories Screen
    categories: 'Danh mục thu chi',
    incomeCategories: 'Danh mục thu',
    expenseCategories: 'Danh mục chi',
    addCategory: 'Thêm danh mục',
  },
  en: {
    // Tabs
    homeTab: 'Home',
    walletTab: 'Wallet',
    fundsTab: 'Funds',
    notebookTab: 'Notebook',
    moreTab: 'Account',

    // Navigation / Header
    account: 'Account',
    settings: 'Settings',
    appSettings: 'App Settings',
    darkMode: 'Theme & Dark Mode',
    language: 'Language',
    back: 'Back',

    finance: 'Finance',
    utilities: 'Utilities',
    security: 'Security',
    accountSecurity: 'Account Security',
    accountSecuritySub: 'Password, PIN code',
    changePasswordSub: 'Update login password',
    changePin: 'Change PIN',
    changePinSub: 'Update transaction security PIN',
    supportAndSettings: 'Support & Settings',

    appSettingsSubtitle: 'Customize theme, language, and app settings',
    themeSubtitle: 'Change full-app light/dark mode',
    languageSubtitle: 'Select display language',
    themeSystem: 'System Default',
    themeSystemSub: 'Adjust automatically based on device settings',
    themeLight: 'Light Mode',
    themeLightSub: 'Bright & cheerful pastel theme',
    themeDark: 'Dark Mode',
    themeDarkSub: 'Eye-soothing dark theme, saves battery',

    vietnamese: 'Vietnamese',
    english: 'English',

    bankBinding: 'Bank Binding',
    bankBindingSub: 'Manage bank accounts',
    smartSpendWallet: 'SmartSpend Wallet',
    walletSub: 'Balance & wallet settings',
    expenseNotebook: 'Expense Notebook',
    notebookSub: 'Daily income & expense tracking',

    invoiceManagement: 'Invoice Management',
    invoiceSub: 'Track & pay bills',
    groupFund: 'Group Fund',
    groupFundSub: 'Shared pool with friends',

    supportCenter: 'Help Center',
    supportSub: 'Frequently asked questions',

    changePassword: 'Change Password',
    biometrics: 'Biometric Authentication',
    logout: 'Log Out',

    selectTheme: 'Select Theme',
    selectLanguage: 'Select Language',
    preview: 'Theme Preview',
    previewText: 'SmartSpend provides a smart and modern personal finance management experience.',
    appliedImmediately: 'Changes will be applied immediately across the entire app.',

    // Home Screen
    welcome: 'Welcome',
    totalBalance: 'Total Balance',
    availableBalance: 'Available Balance',
    services: 'Services & Features',
    recentActivity: 'Recent Activity',
    viewAll: 'View All',
    aiInsights: 'AI Insights',
    discoverMore: 'Discover More',

    // Wallet Screen
    deposit: 'Top Up',
    withdraw: 'Withdraw',
    transfer: 'Transfer',
    transactionHistory: 'Transaction History',
    statisticsReport: 'Analytics Report',
    allTransactions: 'All Transactions',
    income: 'Income',
    expense: 'Expense',
    totalIncome: 'Total Income',
    totalExpense: 'Total Expense',

    // Notebook Screen
    monthlyOverview: 'Monthly Overview',
    addTransaction: 'Add Record',
    categorySpending: 'Category Spending',
    recentRecords: 'Recent Records',
    cashBalance: 'Cash Balance',

    // Group Fund Screen
    createFund: 'Create Fund',
    activeFunds: 'Active Funds',
    members: 'members',
    contribute: 'Contribute',
    targetAmount: 'Target',

    // Invoice Screen
    createInvoice: 'Create Invoice',
    pendingInvoices: 'Unpaid Invoices',
    paidInvoices: 'Paid Invoices',
    overdueInvoices: 'Overdue',

    // Contacts Screen
    contacts: 'Contacts',
    searchUser: 'Search users...',
    addFriend: 'Add Friend',
    friendRequests: 'Friend Requests',

    // Categories Screen
    categories: 'Categories',
    incomeCategories: 'Income Categories',
    expenseCategories: 'Expense Categories',
    addCategory: 'Add Category',
  },
} as const;

export type TranslationKey = keyof typeof translations['vi'];

interface ThemeLanguageContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  theme: ThemeColors;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const STORAGE_THEME_KEY = '@smartspend_theme_mode';
const STORAGE_LANG_KEY = '@smartspend_language';

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [language, setLanguageState] = useState<Language>('vi');

  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(STORAGE_THEME_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
          setThemeModeState(savedTheme);
        }
        const savedLang = await AsyncStorage.getItem(STORAGE_LANG_KEY);
        if (savedLang === 'vi' || savedLang === 'en') {
          setLanguageState(savedLang);
        }
      } catch (error) {
        console.error('Failed to load theme/language preferences:', error);
      }
    })();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(STORAGE_THEME_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  const t = useCallback((key: TranslationKey): string => {
    const langDict = translations[language];
    return langDict[key] || translations.vi[key] || key;
  }, [language]);

  const contextValue = useMemo(() => ({
    themeMode,
    setThemeMode,
    isDark,
    theme,
    language,
    setLanguage,
    t,
  }), [themeMode, isDark, theme, language, t]);

  return (
    <ThemeLanguageContext.Provider value={contextValue}>
      {children}
    </ThemeLanguageContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeLanguageProvider');
  }
  return {
    themeMode: context.themeMode,
    setThemeMode: context.setThemeMode,
    isDark: context.isDark,
    theme: context.theme,
  };
};

export const useLanguage = () => {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a ThemeLanguageProvider');
  }
  return {
    language: context.language,
    setLanguage: context.setLanguage,
    t: context.t,
  };
};

export const useTranslation = () => {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a ThemeLanguageProvider');
  }
  return context.t;
};
