import { Stack } from 'expo-router';
import React from 'react';

export default function BookModuleLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="details" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="reader" />
      <Stack.Screen name="AddBookScreen" /> 
      <Stack.Screen name="OrderTrackingScreen" />
      <Stack.Screen name="DeliveryShelfScreen" />
      <Stack.Screen name="AdminOrdersScreen" />
    </Stack>
  );
}