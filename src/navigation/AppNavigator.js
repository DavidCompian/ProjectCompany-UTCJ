import React, { useState } from 'react';
import { Platform, StyleSheet, Dimensions } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminRegisterScreen from '../screens/AdminRegisterScreen'; 

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const [hasScanned, setHasScanned] = useState(false);
  
  // Detección para habilitar el Escáner en navegadores de celular
  const isMobileView = Dimensions.get('window').width < 768 || Platform.OS !== 'web';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Escanear') {
            iconName = focused ? 'qr-code' : 'qr-code-outline';
          } else if (route.name === 'Proyecto') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: styles.tabBar,
        headerTitle: 'ProjectCompany',
        headerTitleStyle: styles.headerTitle,
        headerStyle: styles.header,
      })}
    >
      {isMobileView && (
        <Tab.Screen name="Escanear">
          {(props) => <ScannerScreen {...props} setHasScanned={setHasScanned} />}
        </Tab.Screen>
      )}

      {hasScanned && (
        <Tab.Screen name="Proyecto">
          {(props) => <ProjectDetailScreen {...props} setHasScanned={setHasScanned} />}
        </Tab.Screen>
      )}

      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="AdminRegister" component={AdminRegisterScreen} />
      <Stack.Screen name="MainApp" component={MainTabs} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontWeight: '800', fontSize: 18, color: '#2196F3' },
  tabBar: { height: 65, paddingBottom: 10, paddingTop: 10, backgroundColor: '#fff' },
});