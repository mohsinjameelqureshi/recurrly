import { Link } from "expo-router";
import { Text, View } from "react-native";

const signUp = () => {
  return (
    <View>
      <Text>signUp</Text>
      <Link href="/(auth)/signUp">Sing In</Link>
    </View>
  );
};

export default signUp;
