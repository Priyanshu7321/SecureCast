import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import HomeScreenView from '../views/HomeScreenView';
import ConnectionsScreenView from '../views/ConnectionsScreenView';
import ScreenShareView from '../views/ScreenShareView';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Simple emoji-based tab icon component
interface TabIconProps {
  icon: string;
  color: string;
  size: number;
}

const TabIcon: React.FC<TabIconProps> = ({ icon, size }) => (
  <Text style={{ fontSize: size }}>{icon}</Text>
);

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          marginBottom:40
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreenView}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="🏠" color={color} size={size} />
          ),
          headerTitle: 'SecureCast',
        }}
      />
      <Tab.Screen
        name="ConnectionsTab"
        component={ConnectionsScreenView}
        options={{
          title: 'Connections',
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="📱" color={color} size={size} />
          ),
          headerTitle: 'Connected Devices',
        }}
      />
      <Tab.Screen
        name="ScreenShareTab"
        component={ScreenShareView}
        options={{
          title: 'Screen Share',
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="📺" color={color} size={size} />
          ),
          headerTitle: 'Screen Sharing',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;