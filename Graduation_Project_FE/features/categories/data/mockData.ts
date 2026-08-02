export type ServiceItem = {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  isCustom?: boolean;
  isDefault?: boolean;
};

export type CategoryGroup = {
  id: string;
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  isDefault?: boolean;
  items: ServiceItem[];
};

export const CATEGORIES_DATA: CategoryGroup[] = [];
