import "@/global.css";
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack initialRouteName="signIn" screenOptions={{ headerShown: false }} />;
}
