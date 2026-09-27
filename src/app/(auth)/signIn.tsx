import { Link } from "expo-router";
import { Text, View } from "react-native";

const signIn = () => {
  return (
    <View>
      <Text>signIn</Text>
      <Link href="/(auth)/signIn">Create Account</Link>
    </View>
  );
};

export default signIn;
