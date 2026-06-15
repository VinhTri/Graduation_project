import { Tabs } from "expo-router";
import { CustomTabBar } from "../../shared/components";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Hide the index redirect route from the tab bar */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="home/index"
        options={{
          title: "Trang chủ",
        }}
      />
      <Tabs.Screen
        name="wallet/index"
        options={{
          title: "Ví",
        }}
      />
      <Tabs.Screen
        name="funds/index"
        options={{
          title: "Quỹ",
        }}
      />
      <Tabs.Screen
        name="more/index"
        options={{
          title: "Tài khoản",
        }}
      />
    </Tabs>
  );
}
