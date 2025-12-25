/**
 * SecureCast React Native App with MVVM Architecture
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import NotificationManager from './src/components/notifications/NotificationManager';

// Setup WebRTC for PeerJS
import { setupWebRTC } from './src/utils/webrtcSetup';

// Initialize WebRTC polyfills
setupWebRTC();

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <RootNavigator />
        <NotificationManager />
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
