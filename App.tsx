import { useCallback, useEffect, useRef, useState } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { usePushToken } from './src/hooks/usePushToken';
import TabNavigator from './src/navigation/TabNavigator';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ErrorBoundary from './src/components/ErrorBoundary';

const ONBOARDING_KEY = '@bootwatch_onboarded';

const WEB_DOCUMENT_TITLE =
  Constants.expoConfig?.name ?? Constants.expoConfig?.slug ?? 'BootWatch';

function RootNavigator() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  usePushToken();

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => setHasOnboarded(val === 'true'));
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setHasOnboarded(true);
  }, []);

  if (loading || hasOnboarded === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!hasOnboarded) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return user ? <TabNavigator /> : <AuthScreen />;
}

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.screen === 'Feed') {
        navigationRef.current?.navigate('Feed');
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer
            ref={navigationRef}
            documentTitle={{
              formatter: (options, route) =>
                options?.title ?? route?.name ?? WEB_DOCUMENT_TITLE,
            }}
          >
            <RootNavigator />
            <ThemedStatusBar />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}
