import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  Register: undefined;
  VerifyOtp: { email: string };
  Dashboard: undefined;
  CreateStorefront: undefined;
  Storefront: { slug: string; name?: string; tableCode?: string };
  Checkout: { slug: string; storefrontId: number; cart: any[]; table?: string };
  ActivateQR: { storefrontId: number; slug: string; name: string };
  QR: { slug: string; name: string };
  MerchantProfileBank: { storefrontId?: number; name?: string; slug?: string } | undefined;
  StoreChargesConfig: { storefrontId: number; name?: string; slug?: string };
  CameraQRScanner: { storefrontId?: number; slug?: string } | undefined;
  LiveOrdersManager: { storefrontId?: number; slug?: string; name?: string } | undefined;
  ToolbarRequestsAdmin: { storefrontId: number; name?: string; slug?: string };
};

export type NavigationProp<T extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, T>;

export type RouteProps<T extends keyof RootStackParamList> = RouteProp<RootStackParamList, T>;
