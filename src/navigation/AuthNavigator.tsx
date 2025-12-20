import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types';

// Import Auth Views
import LoginView from '../views/LoginView';
import SignUpView from '../views/SignUpView';
import ForgotPasswordView from '../views/ForgotPasswordView';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginView}
        options={{ 
          title: 'Sign In',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="SignUp" 
        component={SignUpView}
        options={{ 
          title: 'Create Account',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordView}
        options={{ 
          title: 'Reset Password',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;