import React, { useState } from 'react';
import { Image, Platform, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Importamos los iconos

import LoginScreen from '../screens/LoginScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminRegisterScreen from '../screens/AdminRegisterScreen'; 

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function LogoTitle() {
  return (
    <Image
      style={{ width: 30, height: 30, marginLeft: 15 }}
      source={require('../../assets/logo.png')}
      resizeMode="contain"
    />
  );
}

function MainTabs() {
  const [hasScanned, setHasScanned] = useState(false);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Configuración de los iconos
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
        tabBarLabelStyle: styles.tabBarLabel,
        headerLeft: () => <LogoTitle />,
        headerTitle: 'ProjectCompany',
        headerTitleStyle: styles.headerTitle,
        headerStyle: styles.header,
      })}
    >
      {/* 1. ESCANEAR */}
      {Platform.OS !== 'web' && (
        <Tab.Screen name="Escanear">
          {(props) => <ScannerScreen {...props} setHasScanned={setHasScanned} />}
        </Tab.Screen>
      )}

      {/* 2. PROYECTO (Dinámico) */}
      {hasScanned && (
        <Tab.Screen name="Proyecto">
          {(props) => <ProjectDetailScreen {...props} setHasScanned={setHasScanned} />}
        </Tab.Screen>
      )}

      {/* 3. PERFIL */}
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

// ESTILOS PROFESIONALES
const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffff',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontWeight: '800',
    fontSize: 18,
    color: '#2196F3',
    letterSpacing: 0.5,
  },
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    height: Platform.OS === 'ios' ? 88 : 65,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    paddingTop: 10,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
});