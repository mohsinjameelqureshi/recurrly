import "@/global.css";
import { Link } from "expo-router";
import { styled } from "nativewind";
import { Text } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-bold text-success">
        Welcome to NativeWind!
      </Text>

      <Link
        href="/onboarding"
        className="mt-4 rounded bg-primary px-4 py-2 text-white"
      >
        Go to onboarding
      </Link>
      <Link
        href="/(auth)/signIn"
        className="mt-4 rounded bg-primary px-4 py-2 text-white"
      >
        Sign In
      </Link>
      <Link
        href="/(auth)/signUp"
        className="mt-4 rounded bg-primary px-4 py-2 text-white"
      >
        Sing Up
      </Link>
    </SafeAreaView>
  );
}
