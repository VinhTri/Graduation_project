import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Alert,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../../shared/constants/Colors';
import { useCategoryContext } from '../../../shared/contexts/CategoryContext';
import { AddCategoryModal } from '../components/AddCategoryModal';
import { AddGroupModal } from '../components/AddGroupModal';
import { styles, PALETTE } from './CategoriesScreen.styles';
import { ConfirmModal } from '../../../shared/components';
import { MAX_CATEGORY_GROUPS, MAX_ITEMS_PER_GROUP } from '../constants/categoryLimits';

const SETUP_STEPS = [
  {
    step: '1',
    title: 'Tạo nhóm',
    description: 'Nhấn "Tạo nhóm" ở góc trên để tạo nhóm cha (VD: Sinh hoạt, Du lịch...). Tối đa 6 nhóm, mỗi nhóm một màu riêng.',
    icon: 'layers-outline' as const,
  },
  {
    step: '2',
    title: 'Thêm danh mục',
    description: 'Trong mỗi nhóm, nhấn "Tạo danh mục" để thêm danh mục con (tối đa 4, màu không trùng). Danh mục không thể sửa — muốn đổi thì xóa và tạo lại.',
    icon: 'grid-outline' as const,
  },
  {
    step: '3',
    title: 'Phân loại giao dịch',
    description: 'Dùng danh mục khi rút tiền hoặc xem báo cáo chi tiêu theo nhóm và danh mục.',
    icon: 'pie-chart-outline' as const,
  },
];

import { useLanguage, useTheme } from '../../../shared/contexts/ThemeLanguageContext';

export const CategoriesScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { categories, removeService, removeGroup, loadCategories } = useCategoryContext();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isEn = language === 'en';

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [])
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const [isGroupModalVisible, setGroupModalVisible] = useState(false);
  const [defaultGroupId, setDefaultGroupId] = useState<string | undefined>();
  const [itemToDelete, setItemToDelete] = useState<{ id: string; label: string } | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<{ id: string; title: string; itemCount: number } | null>(null);

  const handleLongPress = (service: { id: string; label: string }) => {
    setItemToDelete({ id: service.id, label: service.label });
  };

  const customGroupCount = categories.filter((g) => !g.isDefault).length;

  const handleCreateGroup = () => {
    if (customGroupCount >= MAX_CATEGORY_GROUPS) {
      Alert.alert(
        'Giới hạn nhóm',
        `Bạn chỉ có thể tạo tối đa ${MAX_CATEGORY_GROUPS} nhóm danh mục.`
      );
      return;
    }
    setGroupModalVisible(true);
  };

  const handleAddCategoryToGroup = (groupId: string, itemCount: number) => {
    if (itemCount >= MAX_ITEMS_PER_GROUP) {
      const group = categories.find((g) => g.id === groupId);
      const names = group?.items?.map((i) => i.label).join(', ') || '';
      Alert.alert(
        'Giới hạn danh mục',
        `Nhóm "${group?.title || ''}" đã đủ ${MAX_ITEMS_PER_GROUP} danh mục${names ? `: ${names}` : ''}.\n\nHãy xóa bớt danh mục trong nhóm này, hoặc thêm vào nhóm khác / tạo nhóm mới.`
      );
      return;
    }
    setDefaultGroupId(groupId);
    setModalVisible(true);
  };

  const canCreateGroup = customGroupCount < MAX_CATEGORY_GROUPS;

  const confirmDelete = async () => {
    if (itemToDelete) {
      await removeService(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const confirmDeleteGroup = async () => {
    if (groupToDelete) {
      try {
        await removeGroup(groupToDelete.id);
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể xóa nhóm danh mục. Vui lòng thử lại.');
      } finally {
        setGroupToDelete(null);
      }
    }
  };

  const renderGroupDeleteAction = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
    group: { id: string; title: string; items: { id: string }[] }
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.88, 1],
      extrapolate: 'clamp',
    });
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.swipeDeleteActionWrap,
          { transform: [{ scale }, { translateX }] },
        ]}
      >
        <RectButton
          style={styles.swipeDeleteButton}
          onPress={() => setGroupToDelete({
            id: group.id,
            title: group.title,
            itemCount: group.items.length,
          })}
        >
          <LinearGradient
            colors={['#FCA5A5', '#EF4444', '#DC2626']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.swipeDeleteGradient}
          >
            <View style={styles.swipeDeleteIconCircle}>
              <Ionicons name="trash" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.swipeDeleteText}>Xóa nhóm</Text>
            {group.items.length > 0 ? (
              <Text style={styles.swipeDeleteSubtext}>
                {group.items.length} danh mục
              </Text>
            ) : null}
          </LinearGradient>
        </RectButton>
      </Animated.View>
    );
  };

  const renderGroupCard = (group: typeof filteredCategories[number]) => {
    const isDefault = !!group.isDefault;

    const cardInner = (
      <View style={[styles.groupCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={[styles.groupHeader, { backgroundColor: theme.isDark ? theme.bgSoft : group.bgColor }]}>
          <View style={styles.groupHeaderLeft}>
            <Ionicons name={group.icon as any} size={20} color={group.color} />
            <Text style={[styles.groupTitle, { color: theme.isDark ? theme.textPrimary : group.color }]}>
              {group.title}
            </Text>
          </View>
          <View style={styles.groupHeaderActions}>
            {isDefault ? (
              <View style={styles.defaultBadge}>
                <Ionicons name="lock-closed" size={11} color={group.color} />
                <Text style={[styles.defaultBadgeText, { color: group.color }]}>Mặc định</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.groupAddCategoryBtn,
                    { borderColor: group.color + '55' },
                    group.items.length >= MAX_ITEMS_PER_GROUP && styles.groupAddCategoryBtnDisabled,
                  ]}
                  onPress={() => handleAddCategoryToGroup(group.id, group.items.length)}
                  activeOpacity={group.items.length >= MAX_ITEMS_PER_GROUP ? 1 : 0.7}
                  disabled={group.items.length >= MAX_ITEMS_PER_GROUP}
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color={group.items.length >= MAX_ITEMS_PER_GROUP ? '#9CA3AF' : group.color}
                  />
                  <Text
                    style={[
                      styles.groupAddCategoryText,
                      { color: group.items.length >= MAX_ITEMS_PER_GROUP ? '#9CA3AF' : group.color },
                    ]}
                  >
                    Tạo danh mục ({group.items.length}/{MAX_ITEMS_PER_GROUP})
                  </Text>
                </TouchableOpacity>
                {group.items.length >= MAX_ITEMS_PER_GROUP && (
                  <Text style={styles.groupLimitHint}>
                    Nhóm đã đủ {MAX_ITEMS_PER_GROUP} danh mục — xóa bớt hoặc tạo nhóm mới
                  </Text>
                )}
              </>
            )}
          </View>
        </View>

        {group.items.length === 0 ? (
          <View style={styles.emptyGroupContainer}>
            <Text style={[styles.emptyGroupText, { color: theme.textMuted }]}>Chưa có danh mục</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {group.items.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.gridItem}
                onLongPress={isDefault ? undefined : () => handleLongPress(service)}
                delayLongPress={300}
                activeOpacity={isDefault ? 1 : 0.7}
              >
                <View style={[styles.iconWrapper, { backgroundColor: theme.isDark ? theme.bgSoft : service.bgColor }]}>
                  <Ionicons name={service.icon as any} size={28} color={service.color} />
                </View>
                <Text style={[styles.itemLabel, { color: theme.textPrimary }]} numberOfLines={2}>
                  {service.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );

    if (isDefault) {
      return (
        <View key={group.id} style={styles.groupSwipeContainer}>
          {cardInner}
        </View>
      );
    }

    return (
      <View key={group.id} style={styles.groupSwipeContainer}>
        <Swipeable
          renderRightActions={(progress, dragX) => renderGroupDeleteAction(progress, dragX, group)}
          overshootRight={false}
          friction={2}
          rightThreshold={36}
        >
          {cardInner}
        </Swipeable>
      </View>
    );
  };

  const filteredCategories = categories.map(group => ({
    ...group,
    items: group.items.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => {
    if (!searchQuery.trim()) return true;
    return group.items.length > 0 || group.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderHeader = () => (
    <View style={styles.headerWrap}>
      <LinearGradient
        colors={[...theme.headerGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerDecorCircleLarge} />
        <View style={styles.headerDecorCircleSmall} />

        <View style={styles.headerTopRow}>
          <View style={styles.leftSection}>
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/home');
                }
              }}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back-outline" size={22} color={theme.isDark ? "#FFFFFF" : "#7C3AED"} />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={[styles.headerTitle, { color: theme.isDark ? "#FFFFFF" : "#5B21B6" }]} numberOfLines={1} ellipsizeMode="tail">
                {t('categories')}
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.isDark ? theme.textSecondary : "#7C3AED" }]} numberOfLines={1} ellipsizeMode="tail">
                {isEn ? 'Manage classification' : 'Quản lý phân loại'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addButton, !canCreateGroup && styles.addButtonDisabled]}
            onPress={handleCreateGroup}
            activeOpacity={0.85}
            disabled={!canCreateGroup}
          >
            <Ionicons name="layers-outline" size={18} color="#FFF" />
            <Text style={styles.addButtonText}>
              {canCreateGroup
                ? (isEn ? `Add Group (${customGroupCount}/${MAX_CATEGORY_GROUPS})` : `Tạo nhóm (${customGroupCount}/${MAX_CATEGORY_GROUPS})`)
                : (isEn ? `Limit ${MAX_CATEGORY_GROUPS}/${MAX_CATEGORY_GROUPS} groups` : `Đủ ${MAX_CATEGORY_GROUPS}/${MAX_CATEGORY_GROUPS} nhóm`)}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerHintBox}>
          <View style={styles.headerHintContent}>
            <View style={styles.headerHintRow}>
              <Ionicons name="hand-left-outline" size={14} color={PALETTE.lavender} />
              <Text style={styles.headerHintText}>{isEn ? 'Press & hold category to delete' : 'Nhấn giữ danh mục để xóa nhé'}</Text>
            </View>
            <View style={styles.headerHintRow}>
              <Ionicons name="arrow-back-outline" size={14} color={PALETTE.lavender} />
              <Text style={styles.headerHintText}>{isEn ? 'Swipe left group to delete' : 'Vuốt trái nhóm cũng xóa được nha'}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      {renderHeader()}
      
      <View style={styles.topActionsContainer}>
        <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Ionicons name="search-outline" size={20} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder={isEn ? "Search..." : "Tìm kiếm"}
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredCategories.length > 0 ? (
          filteredCategories.map((group) => renderGroupCard(group))
        ) : (
          <View style={styles.emptyStateContainer}>
            {searchQuery.trim() ? (
              <>
                <Ionicons name="search-outline" size={48} color={theme.primary} />
                <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>{isEn ? "No categories found" : "Không tìm thấy danh mục nào"}</Text>
              </>
            ) : (
              <>
                <View style={styles.setupHero}>
                  <View style={{
                    width: 72,
                    height: 72,
                    borderRadius: 22,
                    backgroundColor: theme.bgSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 4,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                  }}>
                    <Ionicons name="folder-open-outline" size={36} color={theme.primary} />
                  </View>
                  <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>{isEn ? "Setup expense categories" : "Thiết lập danh mục chi tiêu"}</Text>
                  <Text style={[styles.emptyStateHint, { color: theme.textSecondary }]}>
                    {isEn ? "You don't have any category groups yet. Create groups to organize expenses." : "Bạn chưa có nhóm danh mục nào. Hãy tạo nhóm và thêm danh mục để phân loại giao dịch dễ dàng hơn."}
                  </Text>
                </View>

                <View style={[styles.setupStepsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  {SETUP_STEPS.map((item, index) => (
                    <View
                      key={item.step}
                      style={[
                        styles.setupStepRow,
                        index < SETUP_STEPS.length - 1 && styles.setupStepRowBorder,
                      ]}
                    >
                      <View style={styles.setupStepBadge}>
                        <Text style={styles.setupStepBadgeText}>{item.step}</Text>
                      </View>
                      <View style={styles.setupStepContent}>
                        <View style={styles.setupStepTitleRow}>
                          <Ionicons name={item.icon} size={18} color={theme.primary} />
                          <Text style={[styles.setupStepTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                        </View>
                        <Text style={[styles.setupStepDescription, { color: theme.textSecondary }]}>{item.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {canCreateGroup && (
                  <TouchableOpacity style={styles.setupCtaBtn} onPress={handleCreateGroup}>
                    <Ionicons name="layers-outline" size={18} color={PALETTE.white} />
                    <Text style={styles.setupCtaText}>{isEn ? "Start — Create First Group" : "Bắt đầu — Tạo nhóm đầu tiên"}</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <AddCategoryModal 
        visible={isModalVisible} 
        onClose={() => {
          setModalVisible(false);
          setDefaultGroupId(undefined);
        }} 
        defaultGroupId={defaultGroupId}
      />

      <AddGroupModal
        visible={isGroupModalVisible}
        onClose={() => setGroupModalVisible(false)}
      />

      <ConfirmModal
        visible={!!itemToDelete}
        title="Xóa danh mục"
        message={
          itemToDelete
            ? `Xóa danh mục "${itemToDelete.label}"?\n\nDanh mục sẽ được ẩn khỏi danh sách chọn. Giao dịch cũ vẫn giữ phân loại trong lịch sử và báo cáo (hiển thị "đã xóa"). Muốn dùng lại tên này, hãy tạo danh mục mới sau khi xóa.`
            : ''
        }
        iconName="trash-outline"
        iconColor={Colors.error}
        confirmText="Xóa"
        cancelText="Hủy"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

      <ConfirmModal
        visible={!!groupToDelete}
        title="Xóa nhóm danh mục"
        message={
          groupToDelete
            ? `Bạn có chắc muốn xóa nhóm "${groupToDelete.title}"?\n\nToàn bộ ${groupToDelete.itemCount} danh mục trong nhóm cũng sẽ bị xóa. Giao dịch cũ vẫn giữ phân loại trong lịch sử và báo cáo (hiển thị "đã xóa").`
            : ''
        }
        iconName="layers-outline"
        iconColor={Colors.error}
        confirmText="Xóa nhóm"
        cancelText="Hủy"
        isDestructive={true}
        onConfirm={confirmDeleteGroup}
        onCancel={() => setGroupToDelete(null)}
      />

    </View>
  );
};

export default CategoriesScreen;
