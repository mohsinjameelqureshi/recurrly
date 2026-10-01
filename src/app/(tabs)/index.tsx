import "@/global.css";
import { useUser } from "@clerk/expo";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useState } from "react";
import { FlatList, Image, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { posthog } from "@/config/posthog";
import ListHeading from "../../../components/ListHeading";
import SubscriptionCard from "../../../components/SubscriptionCard";
import UpcomingSubscriptionCard from "../../../components/UpcomingSubscriptionCard";
import {
  HOME_BALANCE,
  HOME_SUBSCRIPTIONS,
  UPCOMING_SUBSCRIPTIONS,
} from "../../../constants/data";
import { icons } from "../../../constants/icon";
import images from "../../../constants/images";
import { formatCurrency } from "../../../lib/utils";

const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
  const { user } = useUser();

  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={HOME_SUBSCRIPTIONS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() =>
              setExpandedSubscriptionId((currentId) => {
                const expanded = currentId !== item.id;
                posthog?.capture("subscription_details_toggled", {
                  subscription_id: item.id,
                  expanded,
                });
                return expanded ? item.id : null;
              })
            }
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-5 pb-28"
        ListHeaderComponent={
          <>
            {/* Header */}
            <View className="home-header">
              <View className="home-user">
                <Image
                  source={
                    user?.hasImage ? { uri: user.imageUrl } : images.avatar
                  }
                  className="home-avatar"
                  accessibilityLabel="Profile photo"
                />
                <Text className="home-user-name">
                  {user?.firstName?.trim() || "Welcome back"}
                </Text>
              </View>

              <Image source={icons.add} className="home-add-icon" />
            </View>

            {/* Balance */}
            <View className="home-balance-card">
              <Text className="home-balance-label">Balance</Text>

              <View className="home-balance-row">
                <Text className="home-balance-amount">
                  {formatCurrency(HOME_BALANCE.amount)}
                </Text>

                <Text>
                  {dayjs(HOME_BALANCE.nextRenewalDate).format("MM/DD")}
                </Text>
              </View>
            </View>

            {/* Upcoming */}
            <View>
              <ListHeading title="Upcoming" />

              <FlatList
                data={UPCOMING_SUBSCRIPTIONS}
                renderItem={({ item }) => (
                  <UpcomingSubscriptionCard {...item} />
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={
                  <Text className="home-empty-state">
                    No upcoming renewals yet.
                  </Text>
                }
              />
            </View>

            {/* All subscriptions heading */}
            <View className="mt-4">
              <ListHeading title="All Subscriptions" />
            </View>
          </>
        }
        ListEmptyComponent={
          <Text className="home-empty-state">No subscription yet.</Text>
        }
      />
    </SafeAreaView>
  );
}
