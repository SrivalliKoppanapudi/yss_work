import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useNavigation, useRouter } from 'expo-router';
import Colors from '../../../constant/Colors';
import { PlusCircle, Truck } from 'lucide-react-native';
import { ShowForBookCreation, ShowForBookManagement } from '../../../component/RoleBasedUI'; 

import BrowseBooksScreen from './BrowseBooksScreen';
import EbookShelfScreen from './EbookShelfScreen';
import DeliveryShelfScreen from './DeliveryShelfScreen';

const Tab = createMaterialTopTabNavigator();

const CustomHeader = () => {
    const router = useRouter();
    const navigation = useNavigation();

    return (
        <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Books</Text>
            <View style={styles.headerActions}>
                <ShowForBookCreation>
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => router.push('/(screens)/books/AddBookScreen')}
                    >
                        <PlusCircle size={24} color={Colors.PRIMARY} />
                    </TouchableOpacity>
                </ShowForBookCreation>

                <ShowForBookManagement>
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => router.push('/(screens)/books/AdminOrdersScreen')}
                    >
                        <Truck size={24} color={Colors.PRIMARY} />
                    </TouchableOpacity>
                </ShowForBookManagement>
            </View>
        </View>
    );
}

export default function BooksMainScreen() {
  return (
    <View style={styles.container}>
      <CustomHeader />
      <Tab.Navigator
      id={undefined}
        screenOptions={{
          tabBarActiveTintColor: Colors.PRIMARY,
          tabBarInactiveTintColor: Colors.GRAY,
          tabBarIndicatorStyle: {
            backgroundColor: Colors.PRIMARY,
            height: 3,
          },
          tabBarLabelStyle: {
            fontSize: 14,
            textTransform: 'capitalize',
            fontWeight: '600',
          },
          tabBarStyle: {
            backgroundColor: Colors.WHITE,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          },
        }}
      >
        <Tab.Screen name="Browse" component={BrowseBooksScreen} />
        <Tab.Screen name="EbooksShelf" component={EbookShelfScreen} options={{ title: 'E-books Shelf' }} />
        <Tab.Screen name="DeliveryShelf" component={DeliveryShelfScreen} options={{ title: 'Delivery Shelf' }}/>
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.BLACK,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});