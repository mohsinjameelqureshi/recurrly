import { styled } from "nativewind";
import { Text, View } from "react-native";
import { useClerk, useUser } from "@clerk/expo";
import { useRef, useState } from "react";
import { AuthButton, AuthMessage } from "@/components/auth/AuthUI";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  async function leave() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await signOut();
    } catch {
      setError("Couldn’t sign out. Check your connection and try again.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="auth-title">Settings</Text>
      <View className="auth-card gap-4">
        <Text className="auth-label">Your account</Text>
        <Text className="auth-helper">
          {user?.primaryEmailAddress?.emailAddress}
        </Text>
        <AuthButton label="Sign out" onPress={() => void leave()} busy={busy} />
        <AuthMessage message={error} />
      </View>
    </SafeAreaView>
  );
};

export default Settings;
