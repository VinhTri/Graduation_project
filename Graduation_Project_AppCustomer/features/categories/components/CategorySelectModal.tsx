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
  const { categories } = useCategoryContext();
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef<ScrollView>(null);

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
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chọn danh mục</Text>
            <View style={styles.headerActions}>
              {hasAnyCategory && onAddCategory ? (
                <TouchableOpacity style={styles.addBtn} onPress={handleCreate} activeOpacity={0.85}>
                  <Ionicons name="add" size={22} color={Colors.primary} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.text} />
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
            <View style={styles.pagerSection}>
              <ScrollView
                ref={pagerRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScrollEnd}
                scrollEventThrottle={16}
                decelerationRate="fast"
                bounces={false}
              >
                {groupsWithItems.map((group) => (
                  <View key={group.id} style={[styles.page, { width: PAGE_WIDTH }]}>
                    <View style={styles.groupCard}>
                      <View style={[styles.groupHeader, { backgroundColor: group.bgColor }]}>
                        <View style={styles.groupHeaderLeft}>
                          <Ionicons
                            name={(group.icon as any) || 'layers-outline'}
                            size={20}
                            color={group.color}
                          />
                          <Text style={[styles.groupTitle, { color: group.color }]} numberOfLines={1}>
                            {group.title}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.gridContainer}>
                        {group.items.map((item: any) => (
                          <TouchableOpacity
                            key={item.id}
                            style={styles.gridItem}
                            onPress={() => onSelect(item, group.title)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.iconWrapper}>
                              <Ionicons name={item.icon as any} size={28} color={item.color} />
                            </View>
                            <Text style={styles.itemLabel} numberOfLines={2}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {showDots ? (
                <View style={styles.dotsWrap}>
                  <View style={styles.dotsRow}>
                    {groupsWithItems.map((group, i) => (
                      <View
                        key={group.id}
                        style={[
                          styles.dot,
                          i === activeIndex && styles.dotActive,
                          i === activeIndex && { backgroundColor: group.color },
                        ]}
                      />
                    ))}
                  </View>
                  {activeIndex < groupsWithItems.length - 1 ? (
                    <Text style={styles.swipeHint}>Vuốt sang trái để xem nhóm khác</Text>
                  ) : (
                    <Text style={styles.swipeHint}>Vuốt sang phải để quay lại</Text>
                  )}
                </View>
              ) : null}
            </View>
          )}
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
    paddingBottom: 24,
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
  headerActions: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  closeBtn: {
    padding: 4,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagerSection: {
    paddingTop: 12,
  },
  page: {
    paddingHorizontal: PAGE_HORIZONTAL_PADDING,
  },
  groupCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  groupTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingBottom: 8,
    gap: 16,
  },
  gridItem: {
    width: '21%',
    alignItems: 'center',
    marginBottom: 16,
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
  dotsWrap: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    width: 18,
    borderRadius: 4,
  },
  swipeHint: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
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
