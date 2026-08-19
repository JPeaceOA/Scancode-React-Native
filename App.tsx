import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import type { RootStackParamList } from './src/types';
import { demoEngine } from './src/demo/demoEngine';
import { getToken } from './src/api';
import { AppContext, type AppState } from './src/context/AppContext';

// Auth Stack Screens
import SplashScreen from './src/screens/(auth)/SplashScreen';
import LoginScreen from './src/screens/(auth)/LoginScreen';
import ForgotPasswordScreen from './src/screens/(auth)/ForgotPasswordScreen';
import RegisterScreen from './src/screens/(auth)/RegisterScreen';
import VerifyOtpScreen from './src/screens/(auth)/VerifyOtpScreen';

// Customer Storefront & Checkout Screens
import StorefrontScreen from './src/screens/(customer)/StorefrontScreen';
import CheckoutScreen from './src/screens/(customer)/CheckoutScreen';
import CameraQRScannerScreen from './src/screens/(customer)/CameraQRScannerScreen';

// Merchant / Admin Operational Screens
import DashboardScreen from './src/screens/(admin)/DashboardScreen';
import MerchantProfileBankScreen from './src/screens/(admin)/MerchantProfileBankScreen';
import CreateStorefrontScreen from './src/screens/(admin)/CreateStorefrontScreen';
import ActivateQRScreen from './src/screens/(admin)/ActivateQRScreen';
import QRScreen from './src/screens/(admin)/QRScreen';
import StoreChargesConfigScreen from './src/screens/(admin)/StoreChargesConfigScreen';
import LiveOrdersManagerScreen from './src/screens/(admin)/LiveOrdersManagerScreen';
import ToolbarRequestsAdminScreen from './src/screens/(admin)/ToolbarRequestsAdminScreen';

// ==========================================
// 1. NAVIGATOR DEFINITIONS
// ==========================================
const AuthStack = createNativeStackNavigator<RootStackParamList>();
const AdminStack = createNativeStackNavigator<RootStackParamList>();
const CustomerStack = createNativeStackNavigator<RootStackParamList>();

// Shared Configuration Defaults
const hiddenHeader: NativeStackNavigationOptions = { headerShown: false };
const newStorefrontOptions: NativeStackNavigationOptions = { title: 'New Storefront', headerBackTitle: 'Back' };
const checkoutOptions: NativeStackNavigationOptions = { title: 'Checkout', headerBackTitle: 'Back' };

const sharedScreenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: '#ffffff' },
  headerTintColor: '#6C63FF',
  headerTitleStyle: { fontWeight: '700' },
  contentStyle: { backgroundColor: '#F3F4F6' },
};

// ==========================================
// 2. SUB-STACK DESIGNATED FLOWS
// ==========================================

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={sharedScreenOptions}>
      <AuthStack.Screen name="Login" component={LoginScreen} options={hiddenHeader} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={hiddenHeader} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={hiddenHeader} />
      <AuthStack.Screen name="VerifyOtp" component={VerifyOtpScreen} options={hiddenHeader} />
      {/* Splash kept for backward compatibility but auth routing is handled in App */}
      <AuthStack.Screen name="Splash" component={SplashScreen} options={hiddenHeader} />
    </AuthStack.Navigator>
  );
}

function AdminNavigator() {
  return (
    <AdminStack.Navigator screenOptions={sharedScreenOptions}>
      <AdminStack.Screen name="Dashboard" component={DashboardScreen} options={hiddenHeader} />
      <AdminStack.Screen
        name="MerchantProfileBank"
        component={MerchantProfileBankScreen}
        options={({ route }) => ({
          title: route.params?.name || 'Merchant Profile Bank',
          headerBackTitle: 'Back',
        })}
      />
      <AdminStack.Screen
        name="CreateStorefront"
        component={CreateStorefrontScreen}
        options={newStorefrontOptions}
      />
      <AdminStack.Screen
        name="ActivateQR"
        component={ActivateQRScreen}
        options={({ route }) => ({
          title: route.params?.name || 'Activate QR',
          headerBackTitle: 'Back',
        })}
      />
      <AdminStack.Screen
        name="QR"
        component={QRScreen}
        options={({ route }) => ({
          title: `${route.params?.name} - QR`,
          headerBackTitle: 'Back',
        })}
      />
      <AdminStack.Screen
        name="StoreChargesConfig"
        component={StoreChargesConfigScreen}
        options={({ route }) => ({
          title: route.params?.name || 'Configure Store',
          headerBackTitle: 'Back',
        })}
      />
      <AdminStack.Screen
        name="LiveOrdersManager"
        component={LiveOrdersManagerScreen}
        options={({ route }) => ({
          title: route.params?.name ? `${route.params.name} - Live Orders` : 'Live Orders Manager',
          headerBackTitle: 'Back',
        })}
      />
      <AdminStack.Screen
        name="ToolbarRequestsAdmin"
        component={ToolbarRequestsAdminScreen}
        options={({ route }) => ({
          title: route.params?.name ? `${route.params.name} - Activity` : 'Activity Feed',
          headerBackTitle: 'Back',
        })}
      />

      {/* Customer Preview & Dev Tool Screens accessible in Admin Context */}
      <AdminStack.Screen
        name="Storefront"
        component={StorefrontScreen}
        options={({ route }) => ({
          title: route.params?.name || 'Storefront',
          headerBackTitle: 'Back',
        })}
      />
      <AdminStack.Screen name="Checkout" component={CheckoutScreen} options={checkoutOptions} />
      <AdminStack.Screen
        name="CameraQRScanner"
        component={CameraQRScannerScreen}
        options={{ title: 'Scan Table QR Code', headerBackTitle: 'Back' }}
      />
    </AdminStack.Navigator>
  );
}

function CustomerNavigator() {
  return (
    <CustomerStack.Navigator screenOptions={sharedScreenOptions}>
      <CustomerStack.Screen
        name="CameraQRScanner"
        component={CameraQRScannerScreen}
        options={{ title: 'Scan Table QR Code', headerBackTitle: 'Back' }}
      />
      <CustomerStack.Screen
        name="Storefront"
        component={StorefrontScreen}
        options={({ route }) => ({
          title: route.params?.name || 'Storefront',
          headerBackTitle: 'Back',
        })}
      />
      <CustomerStack.Screen name="Checkout" component={CheckoutScreen} options={checkoutOptions} />
    </CustomerStack.Navigator>
  );
}

// ==========================================
// 3. LOADING SCREEN
// ==========================================
function BootScreen() {
  return (
    <View style={bootStyles.container}>
      <Text style={bootStyles.brand}>ScanCode</Text>
      <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 24 }} />
    </View>
  );
}

const bootStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 32, fontWeight: '700', color: '#6C63FF', letterSpacing: 1 },
});

// ==========================================
// 4. MAIN CONTAINER & STATE GATEKEEPER
// ==========================================
export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');

  useEffect(() => {
    async function bootstrap() {
      // Initialise demo engine first (loads persisted role from AsyncStorage)
      await demoEngine.init();

      if (demoEngine.isDemoModeEnabled()) {
        // Demo mode: trust the role stored in the demo engine directly
        const role = demoEngine.getActiveRole();
        setAppState(role);
      } else {
        // Live mode: check real JWT token to determine auth state
        try {
          const token = await getToken();
          setAppState(token ? 'admin' : 'logged_out');
        } catch {
          setAppState('logged_out');
        }
      }
    }
    bootstrap();
  }, []);

  return (
    <AppContext.Provider value={{ appState, setAppState }}>
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />

        {appState === 'loading' ? (
          <BootScreen />
        ) : appState === 'logged_out' ? (
          <AuthNavigator />
        ) : appState === 'admin' ? (
          <AdminNavigator />
        ) : (
          <CustomerNavigator />
        )}

      </NavigationContainer>
    </SafeAreaProvider>
    </AppContext.Provider>
  );
}
