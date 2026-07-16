export type ServiceItem = {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  isCustom?: boolean;
};

export type CategoryGroup = {
  id: string;
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  items: ServiceItem[];
};

export const CATEGORIES_DATA: CategoryGroup[] = [];
