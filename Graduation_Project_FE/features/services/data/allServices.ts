export type AppServiceItem = {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
};

export type AppServiceGroup = {
  id: string;
  title: string;
  data: AppServiceItem[];
};

export const ALL_SERVICES_DATA: AppServiceGroup[] = [
  {
    id: "finance",
    title: "Tài chính & Bảo hiểm",
    data: [
      { id: "1", label: "Chuyển tiền", icon: "paper-plane-outline", color: "#EF4444", bgColor: "#FEE2E2" },
      { id: "2", label: "Nhận tiền", icon: "business-outline", color: "#3B82F6", bgColor: "#DBEAFE" },
      { id: "6", label: "Túi Thần Tài", icon: "cash-outline", color: "#F59E0B", bgColor: "#FEF3C7" },
      { id: "7", label: "Ví Trả Sau", icon: "time-outline", color: "#EC4899", bgColor: "#FCE7F3" },
      { id: "9", label: "Tiết kiệm", icon: "save-outline", color: "#E11D48", bgColor: "#FFE4E6" },
    ]
  },
  {
    id: "payment",
    title: "Thanh toán hóa đơn",
    data: [
      { id: "3", label: "Điện", icon: "flash-outline", color: "#10B981", bgColor: "#D1FAE5" },
      { id: "8", label: "Nước", icon: "water-outline", color: "#0EA5E9", bgColor: "#E0F2FE" },
      { id: "12", label: "Internet", icon: "globe-outline", color: "#8B5CF6", bgColor: "#EDE9FE" },
    ]
  },
  {
    id: "telecom",
    title: "Viễn thông",
    data: [
      { id: "4", label: "Nạp tiền ĐT", icon: "phone-portrait-outline", color: "#0EA5E9", bgColor: "#E0F2FE" },
      { id: "5", label: "Data 4G/5G", icon: "wifi-outline", color: "#3B82F6", bgColor: "#DBEAFE" },
    ]
  },
  {
    id: "shopping",
    title: "Mua sắm & Giải trí",
    data: [
      { id: "11", label: "Mua vé", icon: "film-outline", color: "#06B6D4", bgColor: "#CFFAFE" },
      { id: "10", label: "Danh bạ", icon: "book-outline", color: "#8B5CF6", bgColor: "#EDE9FE" },
    ]
  }
];
