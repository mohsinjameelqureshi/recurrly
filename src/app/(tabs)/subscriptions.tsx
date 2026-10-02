import { styled } from "nativewind";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView as RNSafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import SubscriptionCard from "../../../components/SubscriptionCard";
import { HOME_SUBSCRIPTIONS } from "../../../constants/data";
import { colors } from "../../../constants/theme";

const SafeAreaView = styled(RNSafeAreaView);

export default function SubscriptionsScreen() {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const query = search.trim().toLowerCase();
  const subscriptions = useMemo(
    () =>
      HOME_SUBSCRIPTIONS.filter((subscription) =>
        [subscription.name, subscription.category, subscription.plan].some(
          (value) => value?.toLowerCase().includes(query),
        ),
      ),
    [query],
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top}
      >
        <View className="px-5 pb-4 pt-5">
          {!keyboardVisible && (
            <>
              <Text
                accessibilityRole="header"
                className="text-3xl font-sans-bold text-primary"
              >
                Subscriptions
              </Text>
              <Text className="mt-2 text-base font-sans-regular text-muted-foreground">
                All your subscriptions in one place.
              </Text>
            </>
          )}
          <View
            className="flex-row items-center rounded-2xl border border-border bg-card"
            style={{ marginTop: keyboardVisible ? 0 : 24 }}
          >
            <TextInput
              value={search}
              onChangeText={(value) => {
                setSearch(value);
                setExpandedId(null);
              }}
              placeholder="Search by name, category, or plan"
              placeholderTextColor={colors.mutedForeground}
              accessibilityLabel="Search subscriptions"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              className="min-h-14 min-w-0 flex-1 px-4 py-4 text-base font-sans-regular text-primary"
            />
            {search.length > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => {
                  setSearch("");
                  setExpandedId(null);
                }}
                className="min-h-12 min-w-12 items-center justify-center px-3"
              >
                <Text className="font-sans-semibold text-primary">Clear</Text>
              </Pressable>
            )}
          </View>
          <Text
            accessibilityLiveRegion="polite"
            className="mt-4 text-sm font-sans-medium text-muted-foreground"
          >
            {subscriptions.length}{" "}
            {subscriptions.length === 1 ? "subscription" : "subscriptions"}
          </Text>
        </View>
        <FlatList
          className="flex-1"
          data={subscriptions}
          keyExtractor={(item) => item.id}
          extraData={expandedId}
          renderItem={({ item }) => (
            <SubscriptionCard
              {...item}
              expanded={expandedId === item.id}
              onPress={() =>
                setExpandedId((current) =>
                  current === item.id ? null : item.id,
                )
              }
            />
          )}
          ItemSeparatorComponent={() => <View className="h-4" />}
          contentContainerClassName="px-5"
          contentContainerStyle={{ paddingBottom: keyboardVisible ? 20 : 112 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center px-4 py-12">
              <Text className="text-lg font-sans-semibold text-primary">
                {query ? "No matching subscriptions" : "No subscriptions yet"}
              </Text>
              <Text className="mt-2 text-center font-sans-regular text-muted-foreground">
                {query
                  ? "Try another name, category, or plan."
                  : "Your subscriptions will appear here."}
              </Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
