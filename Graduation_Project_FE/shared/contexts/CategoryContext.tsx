import React, { createContext, useState, useEffect, useContext } from 'react';
import { CATEGORIES_DATA, CategoryGroup, ServiceItem } from '../../features/categories/data/mockData';
import { axiosClient } from '../api/axiosClient';

type CategoryContextType = {
  categories: CategoryGroup[];
  loadCategories: () => Promise<void>;
  addService: (categoryId: string, newService: Omit<ServiceItem, 'id'>) => Promise<void>;
  updateService: (serviceId: string, categoryId: string, updatedService: Omit<ServiceItem, 'id'>) => Promise<void>;
  removeService: (serviceId: string) => Promise<void>;
  addGroup: (title: string) => Promise<void>;
  isLoading: boolean;
};

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axiosClient.get('/api/v1/categories');
      if (response && response.data) {
        setCategories(response.data);
      } else {
        setCategories(CATEGORIES_DATA);
      }
    } catch (error) {
      console.log("Failed to load categories from API (Fallback to mock data)", error);
      setCategories(CATEGORIES_DATA); // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const addService = async (categoryId: string, newService: Omit<ServiceItem, 'id'>) => {
    try {
      const response = await axiosClient.post('/api/v1/categories/items', {
        groupId: categoryId,
        label: newService.label,
        icon: newService.icon,
        color: newService.color,
        bgColor: newService.bgColor
      });
      // Refresh categories after adding
      await loadCategories();
    } catch (error) {
      console.error("Failed to add service", error);
      throw error;
    }
  };

  const updateService = async (serviceId: string, categoryId: string, updatedService: Omit<ServiceItem, 'id'>) => {
    try {
      await axiosClient.put(`/api/v1/categories/items/${serviceId}`, {
        groupId: categoryId,
        label: updatedService.label,
        icon: updatedService.icon,
        color: updatedService.color,
        bgColor: updatedService.bgColor
      });
      await loadCategories();
    } catch (error) {
      console.error("Failed to update service", error);
      throw error;
    }
  };

  const addGroup = async (title: string) => {
    try {
      const response = await axiosClient.post('/api/v1/categories/groups', {
        title: title,
        icon: "apps",
        color: "#64748B",
        bgColor: "#F1F5F9"
      });
      // Refresh categories after adding
      await loadCategories();
    } catch (error) {
      console.error("Failed to add group", error);
      throw error;
    }
  };

  const removeService = async (serviceId: string) => {
    try {
      await axiosClient.delete(`/api/v1/categories/items/${serviceId}`);
      // Refresh categories after deleting
      await loadCategories();
    } catch (error) {
      console.error("Failed to remove service", error);
      throw error;
    }
  };

  return (
    <CategoryContext.Provider value={{ categories, loadCategories, addService, updateService, removeService, addGroup, isLoading }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategoryContext = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategoryContext must be used within a CategoryProvider');
  }
  return context;
};
