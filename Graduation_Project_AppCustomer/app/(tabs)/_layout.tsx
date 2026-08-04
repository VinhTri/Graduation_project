import { Tabs } from "expo-router";
import { CustomTabBar } from "../../shared/components";
import { useTheme, useLanguage } from "../../shared/contexts/ThemeLanguageContext";

export default function TabsLayout() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <Tabs
      detachInactiveScreens={false}
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: "fade",
        sceneStyle: {
          backgroundColor: theme.bg,
        },
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
          title: t('homeTab'),
        }}
      />
      <Tabs.Screen
        name="wallet/index"
        options={{
          title: t('walletTab'),
        }}
      />
      <Tabs.Screen
        name="funds/index"
        options={{
          title: t('fundsTab'),
        }}
      />
      <Tabs.Screen
        name="notebook/index"
        options={{
          title: t('notebookTab'),
        }}
      />
      <Tabs.Screen
        name="more/index"
        options={{
          title: t('moreTab'),
        }}
      />
    </Tabs>
  );
}
