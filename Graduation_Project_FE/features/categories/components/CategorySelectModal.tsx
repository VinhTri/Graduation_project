import React, { useState, useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, Modal, 
  StyleSheet, ScrollView, Platform, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../shared/constants/Colors';
import { useCategoryContext } from '../../../shared/contexts/CategoryContext';

interface CategorySelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: any, groupName: string) => void;
  onAddCategory?: () => void;
}

export function CategorySelectModal({ visible, onClose, onSelect, onAddCategory }: CategorySelectModalProps) {
  const { categories } = useCategoryContext();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const lowerQuery = searchQuery.toLowerCase();
    return categories.map(group => ({
      ...group,
      items: group.items.filter((item: any) => 
        item.label.toLowerCase().includes(lowerQuery)
      )
    })).filter(group => group.items.length > 0);
  }, [categories, searchQuery]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chọn danh mục</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search and Add new */}
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Tìm kiếm"
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            {onAddCategory && (
              <TouchableOpacity style={styles.addBtn} onPress={() => { onClose(); setTimeout(onAddCategory, 100); }}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.text} style={styles.addIcon} />
                <Text style={styles.addBtnText}>Tạo mới</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {filteredCategories.map((group) => {
              if (group.items.length === 0) return null;
              return (
                <View key={group.id} style={styles.groupContainer}>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  <View style={styles.gridContainer}>
                    {group.items.map((item: any) => (
                      <TouchableOpacity 
                        key={item.id} 
                        style={styles.gridItem}
                        onPress={() => onSelect(item, group.title)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.iconWrapper, { backgroundColor: item.bgColor }]}>
                          <Ionicons name={item.icon as any} size={24} color={item.color} />
                        </View>
                        <Text style={styles.itemLabel} numberOfLines={2}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    padding: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  addIcon: {
    marginRight: 4,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  content: {
    padding: 20,
    paddingTop: 8,
  },
  groupContainer: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: '21%',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
  },
});
