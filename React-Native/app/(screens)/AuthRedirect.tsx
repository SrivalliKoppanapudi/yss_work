// app/(screens)/AuthRedirect.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../Context/auth';
import { supabase } from '../../lib/Superbase';
import Colors from '../../constant/Colors';

const AuthRedirect = () => {
    const router = useRouter();
    const { session, isLoading } = useAuth();

    useEffect(() => {
        console.log('[AuthRedirect] effect start', {
            isLoading,
            hasUser: !!session?.user,
            userId: session?.user?.id,
        });
        if (isLoading) {
            console.log('[AuthRedirect] auth is loading; waiting');
            return;
        }
        if (!session?.user) {
            console.log('[AuthRedirect] no session user; navigating to SignIn');
            router.replace('/auth/SignIn');
            return;
        }

        const checkProfileStatus = async () => {
            try {
                // Fetch the user's profile to check the gamified_completed flag
                const { data, error } = await supabase
                    .from('profiles')
                    .select('gamified_completed')
                    .eq('id', session.user.id)
                    .single();

                if (error && error.code !== 'PGRST116') { 
                    console.error('[AuthRedirect] profile check error', error);
                    throw error;
                }

                console.log('[AuthRedirect] profile check result', {
                    gamified_completed: data?.gamified_completed,
                });
                if (data?.gamified_completed) {
                    console.log('[AuthRedirect] going to Home');
                    router.replace('/(screens)/Home');
                } else {
                    console.log('[AuthRedirect] going to GamifiedOnboarding');
                    router.replace('/(screens)/GamifiedOnboarding');
                }
            } catch (err) {
                console.error('[AuthRedirect] Error checking profile status; fallback to Home', err);
                router.replace('/(screens)/Home');
            }
        };

        checkProfileStatus();

        // Safety fallback: if for any reason navigation didn't occur, push Home after timeout
        const safety = setTimeout(() => {
            console.warn('[AuthRedirect] safety timeout reached; pushing Home');
            router.replace('/(screens)/Home');
        }, 6000);

        return () => clearTimeout(safety);
    }, [session, isLoading, router]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={Colors.PRIMARY} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
    },
});

export default AuthRedirect;