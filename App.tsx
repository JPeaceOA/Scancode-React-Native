import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { RootStackParamList } from './src/types';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VerifyOtpScreen from './src/screens/VerifyOtpScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CreateStorefrontScreen from './src/screens/CreateStorefrontScreen';
import StorefrontScreen from './src/screens/StorefrontScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import ActivateQRScreen from './src/screens/ActivateQRScreen';
import QRScreen from './src/screens/QRScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const hiddenHeader: NativeStackNavigationOptions = { headerShown: false };
const newStorefrontOptions: NativeStackNavigationOptions = { title: 'New Storefront', headerBackTitle: 'Back' };
const checkoutOptions: NativeStackNavigationOptions = { title: 'Checkout', headerBackTitle: 'Back' };

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName="Storefront"
          screenOptions={{
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: '#6C63FF',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: '#F3F4F6' },
          }}
        >
          <Stack.Screen
            name="Storefront"
            component={StorefrontScreen}
            options={({ route }) => ({
              title: route.params?.name || 'Storefront',
              headerBackTitle: 'Back',
            })}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={checkoutOptions}
          />
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={hiddenHeader} />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={hiddenHeader} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={hiddenHeader} />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={hiddenHeader} />
          <Stack.Screen
            name="VerifyOtp"
            component={VerifyOtpScreen}
            options={hiddenHeader} />
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={hiddenHeader} />
          <Stack.Screen
            name="CreateStorefront"
            component={CreateStorefrontScreen}
            options={newStorefrontOptions}
          />

          <Stack.Screen
            name="ActivateQR"
            component={ActivateQRScreen}
            options={({ route }) => ({
              title: route.params?.name || 'Activate QR',
              headerBackTitle: 'Back',
            })}
          />
          <Stack.Screen
            name="QR"
            component={QRScreen}
            options={({ route }) => ({
              title: `${route.params?.name} - QR`,
              headerBackTitle: 'Back',
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
