import { Stack } from 'expo-router';
import React from 'react';

export default function WebinarLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="webinar" />
      <Stack.Screen name="CreateWebinarScreen" />
      <Stack.Screen name="WebinarDetailScreen" />
      <Stack.Screen name="WebinarRegistrationScreen" />
      <Stack.Screen name="RegistrationSuccessScreen" />
    </Stack>
  );
} 