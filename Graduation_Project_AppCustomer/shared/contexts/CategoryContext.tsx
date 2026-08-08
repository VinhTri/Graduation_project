import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { CategoryGroup, ServiceItem } from '../../features/categories/data/mockData';
import { axiosClient } from '../api/axiosClient';

type CategoryContextType = {
  categories: CategoryGroup[];
  loadCategories: () => Promise<void>;
  resetCategories: () => void;
  addService: (categoryId: string, newService: Omit<ServiceItem, 'id'>) => Promise<any>;
  removeService: (serviceId: string) => Promise<void>;
  addGroup: (group: { title: string; icon: string; color: string; bgColor: string }) => Promise<string>;
  removeGroup: (groupId: string) => Promise<void>;
  isLoading: boolean;
};

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const resetCategories = useCallback(() => {
    setCategories([]);
    setIsLoading(true);
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(prev => {
        if (prev.length === 0) setIsLoading(true);
        return prev;
      });
      const response = await axiosClient.get('/api/v1/categories');
      if (response && response.data) {
        setCategories(response.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.log("Failed to load categories from API", error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const addService = useCallback(async (categoryId: string, newService: Omit<ServiceItem, 'id'>) => {
    try {
      const response = await axiosClient.post('/api/v1/categories/items', {
        groupId: categoryId,
        label: newService.label,
        icon: newService.icon,
        color: newService.color,
        bgColor: newService.bgColor
      });
      await loadCategories();
      return response?.data?.data || response?.data;
    } catch (error) {
      console.error("Failed to add service", error);
      throw error;
    }
  }, [loadCategories]);

  const addGroup = useCallback(async (group: { title: string; icon: string; color: string; bgColor: string }): Promise<string> => {
    try {
      const response = await axiosClient.post('/api/v1/categories/groups', {
        title: group.title,
        icon: group.icon,
        color: group.color,
        bgColor: group.bgColor,
      });
      await loadCategories();
      return response.data?.id || '';
    } catch (error) {
      console.error("Failed to add group", error);
      throw error;
    }
  }, [loadCategories]);

  const removeService = useCallback(async (serviceId: string) => {
    try {
      await axiosClient.delete(`/api/v1/categories/items/${serviceId}`);
      await loadCategories();
    } catch (error) {
      console.error("Failed to remove service", error);
      throw error;
    }
  }, [loadCategories]);

  const removeGroup = useCallback(async (groupId: string) => {
    try {
      await axiosClient.delete(`/api/v1/categories/groups/${groupId}`);
      await loadCategories();
    } catch (error) {
      console.error("Failed to remove group", error);
      throw error;
    }
  }, [loadCategories]);

  const value = useMemo(() => ({
    categories,
    loadCategories,
    resetCategories,
    addService,
    removeService,
    addGroup,
    removeGroup,
    isLoading,
  }), [categories, loadCategories, resetCategories, addService, removeService, addGroup, removeGroup, isLoading]);

  return (
    <CategoryContext.Provider value={value}>
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
