import { Stack } from 'expo-router';
import React from 'react';

export default function ProfileModuleLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="EditProfileScreen" />
      <Stack.Screen name="AccountSetting" />
      <Stack.Screen name="AddExperienceScreen" />
      <Stack.Screen name="AddEducationScreen" />
      <Stack.Screen name="PaymentDetailsScreen" />
    </Stack>
  );
}