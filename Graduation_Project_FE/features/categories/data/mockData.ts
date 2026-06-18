export type ServiceItem = {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
};

export type CategoryGroup = {
  id: string;
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  items: ServiceItem[];
};

export const CATEGORIES_DATA: CategoryGroup[] = [
  {
    id: "sinh_hoat",
    title: "Chi tiêu - sinh hoạt",
    icon: "receipt",
    color: "#F59E0B",
    bgColor: "#FEF3C7",
    items: [
      { id: "c1", label: "Chợ, siêu thị", icon: "cart", color: "#F97316", bgColor: "#FFF7ED" },
      { id: "c2", label: "Ăn uống", icon: "fast-food", color: "#F97316", bgColor: "#FFF7ED" },
      { id: "c3", label: "Di chuyển", icon: "car", color: "#3B82F6", bgColor: "#EFF6FF" },
    ]
  },
  {
    id: "phat_sinh",
    title: "Chi phí phát sinh",
    icon: "layers",
    color: "#EAB308",
    bgColor: "#FEF9C3",
    items: [
      { id: "p1", label: "Mua sắm", icon: "bag-handle", color: "#F59E0B", bgColor: "#FFFBEB" },
      { id: "p2", label: "Giải trí", icon: "film", color: "#EC4899", bgColor: "#FDF2F8" },
      { id: "p3", label: "Làm đẹp", icon: "rose", color: "#EC4899", bgColor: "#FDF2F8" },
      { id: "p4", label: "Sức khỏe", icon: "medkit", color: "#EF4444", bgColor: "#FEF2F2" },
      { id: "p5", label: "Từ thiện", icon: "heart", color: "#EC4899", bgColor: "#FDF2F8" },
    ]
  },
  {
    id: "co_dinh",
    title: "Chi phí cố định",
    icon: "home",
    color: "#3B82F6",
    bgColor: "#DBEAFE",
    items: [
      { id: "f1", label: "Hóa đơn", icon: "document-text", color: "#14B8A6", bgColor: "#F0FDFA" },
      { id: "f2", label: "Nhà cửa", icon: "home", color: "#8B5CF6", bgColor: "#F5F3FF" },
      { id: "f3", label: "Người thân", icon: "people", color: "#EC4899", bgColor: "#FDF2F8" },
    ]
  },
  {
    id: "dau_tu",
    title: "Đầu tư - tiết kiệm",
    icon: "trending-up",
    color: "#10B981",
    bgColor: "#D1FAE5",
    items: [
      { id: "i1", label: "Đầu tư", icon: "cash", color: "#10B981", bgColor: "#ECFDF5" },
      { id: "i2", label: "Học tập", icon: "book", color: "#8B5CF6", bgColor: "#F5F3FF" },
    ]
  }
];
