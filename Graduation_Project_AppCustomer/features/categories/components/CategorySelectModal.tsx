import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../shared/constants/Colors';
import { PASTEL_PALETTE } from '../../../shared/constants/PastelPalette';
import { useCategoryContext } from '../../../shared/contexts/CategoryContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PAGE_HORIZONTAL_PADDING = 16;
const PAGE_WIDTH = SCREEN_WIDTH; // full-bleed pager inside bottom sheet

interface CategorySelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: any, groupName: string) => void;
  onAddCategory?: () => void;
}

export function CategorySelectModal({
  visible,
  onClose,
  onSelect,
  onAddCategory,
}: CategorySelectModalProps) {
  const { categories, loadCategories } = useCategoryContext();
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible, loadCategories]);

  const groupsWithItems = useMemo(
    () => categories.filter((g) => (g.items?.length ?? 0) > 0),
    [categories]
  );

  const hasAnyCategory = groupsWithItems.length > 0;
  const showDots = groupsWithItems.length > 1;

  useEffect(() => {
    if (!visible) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex(0);
    requestAnimationFrame(() => {
      pagerRef.current?.scrollTo({ x: 0, animated: false });
    });
  }, [visible]);

  useEffect(() => {
    if (activeIndex >= groupsWithItems.length && groupsWithItems.length > 0) {
      setActiveIndex(0);
      pagerRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [groupsWithItems.length, activeIndex]);

  const handleCreate = () => {
    onAddCategory?.();
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / PAGE_WIDTH);
    setActiveIndex(Math.max(0, Math.min(index, groupsWithItems.length - 1)));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chọn danh mục</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={PASTEL_PALETTE.title} />
              </TouchableOpacity>
            </View>
          </View>

          {!hasAnyCategory ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="pricetags-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Chưa có danh mục</Text>
              <Text style={styles.emptySubtitle}>
                Tạo nhóm và danh mục đầu tiên để phân loại giao dịch tiền mặt.
              </Text>
              {onAddCategory ? (
                <TouchableOpacity
                  style={styles.emptyCta}
                  activeOpacity={0.85}
                  onPress={handleCreate}
                >
                  <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
                  <Text style={styles.emptyCtaText}>Tạo danh mục mới</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <ScrollView 
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {groupsWithItems.map((group) => (
                <View key={group.id} style={styles.listGroup}>
                  <View style={styles.listGroupHeader}>
                    <Ionicons
                      name={(group.icon as any) || 'folder'}
                      size={18}
                      color={group.color || PASTEL_PALETTE.title}
                    />
                    <Text style={[styles.listGroupTitle, { color: group.color || PASTEL_PALETTE.title }]}>
                      {group.title}
                    </Text>
                  </View>
                  
                  {group.items.map((item: any) => (
                    <TouchableOpacity 
                      key={item.id}
                      style={styles.listItem}
                      onPress={() => onSelect(item, group.title)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.listIconContainer, { backgroundColor: item.bgColor || PASTEL_PALETTE.lavenderSoft }]}>
                        <Ionicons name={item.icon as any} size={22} color={item.color || PASTEL_PALETTE.accentDeep} />
                      </View>
                      <Text style={styles.listItemLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: PASTEL_PALETTE.bg,
    borderRadius: 24,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: PASTEL_PALETTE.bg,
    borderBottomWidth: 1,
    borderBottomColor: PASTEL_PALETTE.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PASTEL_PALETTE.title,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    padding: 4,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: PASTEL_PALETTE.white,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  listGroup: {
    marginBottom: 20,
  },
  listGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listGroupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: PASTEL_PALETTE.bgSoft,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  listIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listItemLabel: {
    fontSize: 15,
    color: PASTEL_PALETTE.title,
    fontWeight: '600',
    flex: 1,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyCta: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyCtaText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
