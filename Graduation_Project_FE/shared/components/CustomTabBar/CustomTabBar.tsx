import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.tabBarContainer}>
      <View
        style={[
          styles.tabBar,
          {
            height: 50 + (insets.bottom || 12),
            paddingBottom: insets.bottom || 12,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          // Skip rendering the redirect index route on the bottom menu
          if (route.name === "index") {
            return null;
          }

          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

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

          // Define icons based on route names
          let iconName: keyof typeof Ionicons.glyphMap = "help-circle-outline";
          if (route.name === "home/index") {
            iconName = isFocused ? "home" : "home-outline";
          } else if (route.name === "wallet/index") {
            iconName = isFocused ? "wallet" : "wallet-outline";
          } else if (route.name === "funds/index") {
            iconName = isFocused ? "briefcase" : "briefcase-outline";
          } else if (route.name === "more/index") {
            iconName = isFocused ? "menu" : "menu-outline";
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={iconName}
                size={22}
                color={isFocused ? Colors.primary : Colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? Colors.primary : Colors.textMuted },
                ]}
              >
                {label as string}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: Colors.transparent,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
});
