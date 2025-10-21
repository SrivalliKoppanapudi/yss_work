import { Stack } from 'expo-router';
import Colors from '../../../constant/Colors';

export default function JobsSelectionLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.WHITE },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen
                name="AdminDashboard"
                options={{
                    title: 'Admin Dashboard',
                }}
            />
            <Stack.Screen
                name="ApplicationDetails"
                options={{
                    title: 'Application Details',
                }}
            />
        </Stack>
    );
} 