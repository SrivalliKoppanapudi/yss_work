import { Stack } from 'expo-router';
import React from 'react';

export default function WorkshopLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="CreateWorkshopScreen" />
      <Stack.Screen name="WorkshopDetailsScreen" />
      <Stack.Screen name="PaymentProcessScreen" />
      <Stack.Screen name="RegistrationSuccessScreen" />
    </Stack>
  );
}