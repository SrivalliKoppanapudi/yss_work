// import { Stack } from 'expo-router';
// import { useEffect } from 'react';
// import { useFonts } from 'expo-font';
// import * as SplashScreen from 'expo-splash-screen';
// import { ReduxProvider } from '../store/provider';
// import { SafeAreaView } from 'react-native';
// import { Provider as PaperProvider } from 'react-native-paper';

// export default function RootLayout() {
  // const [loaded, error] = useFonts({
  //   SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  // });

//   useEffect(() => {
//     if (error) throw error;
//   }, [error]);

//   useEffect(() => {
//     if (loaded) {
//       SplashScreen.hideAsync();
//     }
//   }, [loaded]);

//   if (!loaded) {
//     return null;
//   }

//   return (
//     <ReduxProvider>
//       <PaperProvider>
//         <Stack screenOptions={{ headerShown: false }} />
//       </PaperProvider>
//     </ReduxProvider>
//   );
// }



// import { Stack } from 'expo-router';
// import { useEffect } from 'react';
// import { useFonts } from 'expo-font';
// import * as SplashScreen from 'expo-splash-screen';
// import { ReduxProvider } from '../store/provider';
// import { Provider as PaperProvider } from 'react-native-paper';
// import { AuthProvider } from '../Context/auth'; // Import AuthProvider

// export default function RootLayout() {
//   const [loaded, error] = useFonts({
//     SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
//   });

//   useEffect(() => {
//     if (error) throw error;
//   }, [error]);

//   useEffect(() => {
//     if (loaded) {
//       SplashScreen.hideAsync();
//     }
//   }, [loaded]);

//   if (!loaded) {
//     return null;
//   }

//   return (
//     <AuthProvider> 
//       <ReduxProvider>
//         <PaperProvider>
//           <Stack screenOptions={{ headerShown: false }} />
//         </PaperProvider>
//       </ReduxProvider>
//     </AuthProvider>
//   );
// }

import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { ReduxProvider } from '../store/provider';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from '../Context/auth';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Alert } from 'react-native';

const STRIPE_PUBLISHABLE_KEY = "pk_test_51Rc6KDIOanast2wyLeulAlEERfEtunv3TP53nT50C4LWQkscGdKWDiiHagovzZJTjVT8yO2cBvbMRR8kT830gK0U00xHEcPvb5"; 

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);



  if (!loaded) {
    return null;
  }

  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
    >
      <AuthProvider>
        <ReduxProvider>
          <PaperProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </PaperProvider>
        </ReduxProvider>
      </AuthProvider>
    </StripeProvider>
  );
}