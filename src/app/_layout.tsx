import "@/global.css";
import { useFonts } from "expo-font";
import { Stack, useGlobalSearchParams, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  ClerkProvider,
  useAuth,
  useClerk,
  useSession,
  useUser,
} from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import {
  Component,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { ActivityIndicator } from "react-native";
import { PostHogProvider } from "posthog-react-native";
import { AuthButton, AuthMessage, AuthShell } from "@/components/auth/AuthUI";
import { posthog } from "@/config/posthog";
import { canEnterApp } from "@/lib/auth";

void SplashScreen.preventAutoHideAsync().catch(() => {});

class AuthBoundary extends Component<
  PropsWithChildren<{ onRetry: () => void }>,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    void SplashScreen.hideAsync();
  }
  render() {
    if (this.state.failed)
      return (
        <AuthShell
          title="Let’s try again"
          subtitle="We couldn’t connect to your account."
        >
          <AuthButton label="Try again" onPress={this.props.onRetry} />
        </AuthShell>
      );
    return this.props.children;
  }
}

function PostHogTracking() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);
  const { isLoaded, user } = useUser();

  useEffect(() => {
    if (!isLoaded || !user || !posthog) return;
    posthog.identify(user.id, {
      $set: {
        email: user.primaryEmailAddress?.emailAddress ?? null,
        name: user.fullName ?? null,
      },
    });
  }, [isLoaded, user]);

  useEffect(() => {
    if (!posthog || previousPathname.current === pathname) return;
    posthog.screen(pathname, {
      previous_screen: previousPathname.current ?? null,
      ...params,
    });
    previousPathname.current = pathname;
  }, [params, pathname]);

  return null;
}

function AuthNavigator({ onRetry }: { onRetry: () => void }) {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const { session } = useSession();
  const clerk = useClerk();
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
      void SplashScreen.hideAsync();
    }, 12000);
    if (isLoaded) {
      clearTimeout(timer);
      void SplashScreen.hideAsync();
    }
    return () => clearTimeout(timer);
  }, [isLoaded]);
  if (!isLoaded)
    return (
      <AuthShell
        title={timedOut ? "Let’s reconnect" : "Welcome to Recurrly"}
        subtitle={
          timedOut
            ? "Check your connection and try again."
            : "Getting your account ready…"
        }
      >
        {timedOut ? (
          <AuthButton label="Try again" onPress={onRetry} />
        ) : (
          <ActivityIndicator />
        )}
      </AuthShell>
    );
  const allowed = canEnterApp(
    isSignedIn,
    session?.status,
    !!session?.currentTask,
  );
  if (isSignedIn && !allowed)
    return (
      <AuthShell
        title="One more step"
        subtitle="Your account requires an additional security step. Sign in again or contact support."
      >
        <AuthButton
          label="Return to sign in"
          onPress={() => {
            void clerk
              .signOut()
              .catch(() => setError("Couldn’t sign out. Please try again."));
          }}
        />
        <AuthMessage message={error} />
      </AuthShell>
    );
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={allowed}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="subscriptions/[id]" />
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!allowed}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [attempt, setAttempt] = useState(0);
  const [fontsLoaded, fontError] = useFonts({
    "sans-regular": require("@/assets/fonts/PlusJakartaSans-Regular.ttf"),
    "sans-bold": require("@/assets/fonts/PlusJakartaSans-Bold.ttf"),
    "sans-medium": require("@/assets/fonts/PlusJakartaSans-Medium.ttf"),
    "sans-semibold": require("@/assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "sans-extrabold": require("@/assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "sans-light": require("@/assets/fonts/PlusJakartaSans-Light.ttf"),
  });

  useEffect(() => {
    if (fontError || !process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY)
      void SplashScreen.hideAsync();
  }, [fontError]);

  if (!fontsLoaded && !fontError) return null;
  const key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key)
    return (
      <AuthShell
        title="We’ll be right back"
        subtitle="Recurrly isn’t configured to connect to accounts yet."
      >
        <AuthMessage message="Please try again after the app configuration is updated." />
      </AuthShell>
    );

  return (
    <AuthBoundary
      key={attempt}
      onRetry={() => setAttempt((value) => value + 1)}
    >
      {posthog ? (
        <PostHogProvider client={posthog}>
          <ClerkProvider publishableKey={key} tokenCache={tokenCache}>
            <PostHogTracking />
            <AuthNavigator onRetry={() => setAttempt((value) => value + 1)} />
          </ClerkProvider>
        </PostHogProvider>
      ) : (
        <ClerkProvider publishableKey={key} tokenCache={tokenCache}>
          <AuthNavigator onRetry={() => setAttempt((value) => value + 1)} />
        </ClerkProvider>
      )}
    </AuthBoundary>
  );
}
