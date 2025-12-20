import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

// Import Views
import { HomeView, ProfileView, SettingsView, NotificationView } from '../views';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeView}
        options={{ title: 'SecureCast Home' }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileView}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsView}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationView}
        options={{ title: 'Notifications' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;