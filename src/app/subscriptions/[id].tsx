import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

const SubscriptionDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View>
      <Text> SubscriptionDetails</Text>
    </View>
  );
};

export default SubscriptionDetails;
