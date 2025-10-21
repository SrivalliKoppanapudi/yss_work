// import React from 'react';
// import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
// import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
// import LearningCourses from './LearningCourses';
// import MicroLearning from './MicroLearning_section/MicroLearning';
// import CreateCourse from './Courses_Section/CreateCourse';
// import Colors from "../../constant/Colors";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import BooksMainScreen from './books'; 

// const Tab = createMaterialTopTabNavigator();

// function LearningTabs() {
//   return (
//     <Tab.Navigator
//      id={undefined} // Add a unique ID
//       screenOptions={{
//         tabBarStyle: {
//           backgroundColor: '#ffffff',
//         },
//         tabBarLabelStyle: {
//           fontSize: 12,
//           fontWeight: 'bold',
//           textTransform: 'capitalize',
//         },
//         tabBarIndicatorStyle: {
//           backgroundColor: Colors.PRIMARY,
//           height: 3,
//         },
//         tabBarActiveTintColor: Colors.PRIMARY,
//         tabBarInactiveTintColor: Colors.GRAY,
//       }}
//     >
//       <Tab.Screen name="Courses" component={LearningCourses} />
//       {/* The new "Books" tab is added here */}
//       <Tab.Screen name="Books" component={BooksMainScreen} />
//       <Tab.Screen name="Micro-Learning" component={MicroLearning} /> 
//       <Tab.Screen name="Create-Course" component={CreateCourse} />
//     </Tab.Navigator>
//   );
// }

// export default function Learning() { 
//   const router = useRouter();
//   return (
//     <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
//       <View style={styles.header}>
//         <TouchableOpacity
//           onPress={() => router.canGoBack() ? router.back() : router.replace('/(screens)/Home')}
//           style={styles.backButton}
//         >
//           <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Learning</Text> 
//       </View>
//       <LearningTabs />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center", 
//     padding: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: Colors.PRIMARY,
//   },
//   backButton: {
//     position: "absolute",
//     left: 15,
//     top: 15, 
//     zIndex: 1, 
//   },
// });
// app/(screens)/Learning.tsx
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import LearningCourses from './LearningCourses';
import MicroLearning from './MicroLearning_section/MicroLearning';
import CreateCourse from './Courses_Section/CreateCourse';
import Colors from "../../constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import BooksMainScreen from './books';
import { useAuth } from '../../Context/auth'; 
// Import the new screens
import WorkshopScreen from './Workshop/index';
import WebinarScreen from './Webinar/webinar';

const Tab = createMaterialTopTabNavigator();

function LearningTabs() {
  const { permissionCheck } = useAuth();
  
  return (
    <Tab.Navigator
     id={undefined} // Add a unique ID
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#ffffff',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
          textTransform: 'capitalize',
        },
        tabBarIndicatorStyle: {
          backgroundColor: Colors.PRIMARY,
          height: 3,
        },
        tabBarActiveTintColor: Colors.PRIMARY,
        tabBarInactiveTintColor: Colors.GRAY,
        tabBarScrollEnabled: true, // Enable scrolling for tabs
        tabBarItemStyle: { width: 'auto', paddingHorizontal: 12 }, // Adjust tab width for better spacing
      }}
    >
      <Tab.Screen name="Courses" component={LearningCourses} />
      <Tab.Screen name="Books" component={BooksMainScreen} />
      <Tab.Screen name="Webinars" component={WebinarScreen} />
      <Tab.Screen name="Workshops" component={WorkshopScreen} />
      <Tab.Screen name="Micro-Learning" component={MicroLearning} /> 
      {permissionCheck?.canCreateCourses() && (
        <Tab.Screen name="Create-Course" component={CreateCourse} />
      )}
      
    </Tab.Navigator>
  );
}

export default function Learning() { 
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(screens)/Home')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learning</Text> 
      </View>
      <LearningTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", 
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.PRIMARY,
  },
  backButton: {
    position: "absolute",
    left: 15,
    top: 15, 
    zIndex: 1, 
  },
});