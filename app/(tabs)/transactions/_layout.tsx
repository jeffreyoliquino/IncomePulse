import { Stack } from 'expo-router';

export default function TransactionsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="income" />
      <Stack.Screen name="expenses" />
      <Stack.Screen name="investments" />
      <Stack.Screen name="funds" />
      <Stack.Screen name="accounts" />
      <Stack.Screen name="all" />
      <Stack.Screen name="financial-obligations" />
    </Stack>
  );
}
