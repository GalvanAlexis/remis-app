import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register-choice" />
      <Stack.Screen name="register-cliente" />
      <Stack.Screen name="register-chofer" />
    </Stack>
  );
}
