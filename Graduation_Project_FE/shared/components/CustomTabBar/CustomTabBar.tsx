import React, { useEffect, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { PASTEL_PALETTE } from "../../constants/PastelPalette";

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  "home/index": { active: "home", inactive: "home-outline" },
  "wallet/index": { active: "wallet", inactive: "wallet-outline" },
  "funds/index": { active: "briefcase", inactive: "briefcase-outline" },
  "notebook/index": { active: "book", inactive: "book-outline" },
  "more/index": { active: "person", inactive: "person-outline" },
};

const SPRING = { damping: 20, stiffness: 220, mass: 0.8 };

function TabItem({
  label,
  iconName,
  isFocused,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
}: {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
}) {
  const scale = useSharedValue(isFocused ? 1 : 0.92);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0.92, SPRING);
  }, [isFocused, scale]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.iconWrap, animatedIconStyle]}>
        <Ionicons
          name={iconName}
          size={22}
          color={isFocused ? PASTEL_PALETTE.accentDeep : PASTEL_PALETTE.textMuted}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const barWidth = useSharedValue(0);
  const indicatorX = useSharedValue(0);

  const visibleRoutes = useMemo(
    () => state.routes.filter((route) => route.name !== "index"),
    [state.routes]
  );

  const activeRouteKey = state.routes[state.index]?.key;
  const activeIndex = Math.max(
    0,
    visibleRoutes.findIndex((route) => route.key === activeRouteKey)
  );

  const tabCount = visibleRoutes.length || 1;

  useEffect(() => {
    if (barWidth.value <= 0) return;
    const slotWidth = barWidth.value / tabCount;
    indicatorX.value = withSpring(activeIndex * slotWidth, SPRING);
  }, [activeIndex, barWidth, indicatorX, tabCount]);

  const indicatorStyle = useAnimatedStyle(() => {
    const slotWidth = barWidth.value / tabCount;
    return {
      width: Math.max(slotWidth - 8, 0),
      transform: [{ translateX: indicatorX.value + 4 }],
    };
  });

  const onBarLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    barWidth.value = width;
    const slotWidth = width / tabCount;
    indicatorX.value = withSpring(activeIndex * slotWidth, SPRING);
  };

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.tabBarShadow}>
        <View style={styles.tabBar} onLayout={onBarLayout}>
          <Animated.View style={[styles.activePill, indicatorStyle]} pointerEvents="none" />

          {visibleRoutes.map((route) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                  ? options.title
                  : route.name;

            const isFocused = route.key === activeRouteKey;
            const icons = TAB_ICONS[route.name];
            const iconName = icons
              ? isFocused
                ? icons.active
                : icons.inactive
              : "help-circle-outline";

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            return (
              <TabItem
                key={route.key}
                label={label as string}
                iconName={iconName}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  tabBarShadow: {
    borderRadius: 28,
    backgroundColor: PASTEL_PALETTE.white,
    shadowColor: PASTEL_PALETTE.lavender,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 12,
    borderWidth: 1,
    borderColor: PASTEL_PALETTE.border,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 28,
    overflow: "hidden",
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 62,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
  },
  activePill: {
    position: "absolute",
    top: 6,
    bottom: 6,
    borderRadius: 20,
    backgroundColor: PASTEL_PALETTE.accentSoft,
    borderWidth: 1,
    borderColor: "#FBCFE8",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    zIndex: 1,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: PASTEL_PALETTE.accentDeep,
  },
  tabLabelInactive: {
    color: PASTEL_PALETTE.textMuted,
  },
});
