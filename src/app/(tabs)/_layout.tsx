import clsx from "clsx";
import { Tabs } from "expo-router";
import { Image, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tabs } from "../../../constants/data";
import { colors, components } from "../../../constants/theme";
import { SubscriptionsProvider } from "@/context/SubscriptionsContext";

const tabbar = components.tabBar;

const TabLayout = () => {
  const insets = useSafeAreaInsets();
  const Tabicon = ({ focused, icon }: TabIconProps) => {
    return (
      <View className="tabs-icon">
        <View className={clsx("tabs-pill", focused && "tabs-active")}>
          <Image
            source={icon}
            resizeMode="contain"
            className="tabs-glyph"
          ></Image>
        </View>
      </View>
    );
  };

  return (
    <SubscriptionsProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          // Completely disables the Android ripple / click highlight
          tabBarButton: (props) => {
            // Destructure out the conflicting ref so TS is happy
            const { ref, ...restProps } = props as any;
            return <Pressable {...restProps} android_ripple={null} />;
          },
          tabBarStyle: {
            position: "absolute",
            bottom: Math.max(insets.bottom, tabbar.horizontalInset),
            height: tabbar.height,
            marginHorizontal: tabbar.horizontalInset,
            borderRadius: tabbar.radius,
            backgroundColor: colors.primary,
            borderTopWidth: 0,
            elevation: 0,
          },
          tabBarItemStyle: {
            paddingVertical: tabbar.height / 2 - tabbar.iconFrame / 1.6,
          },
          tabBarIconStyle: {
            width: tabbar.iconFrame,
            height: tabbar.iconFrame,
            alignItems: "center",
          },
        }}
      >
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ focused }) => (
                <Tabicon focused={focused} icon={tab.icon} />
              ),
            }}
          />
        ))}
      </Tabs>
    </SubscriptionsProvider>
  );
};

export default TabLayout;
