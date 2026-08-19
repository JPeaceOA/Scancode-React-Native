import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { demoEngine } from './demo/demoEngine';

export const API_BASE = 'http://192.168.1.155:8082';
const TOKEN_KEY = 'scancode_token';

// Global flag to easily enable/disable demo mode across the entire app
export let ENABLE_DEMO_MODE = true;

export function setGlobalDemoMode(enabled: boolean) {
  ENABLE_DEMO_MODE = enabled;
  demoEngine.setDemoModeEnabled(enabled);
}

// Ensure demo engine initializes asynchronously
demoEngine.init().then(() => {
  ENABLE_DEMO_MODE = demoEngine.isDemoModeEnabled();
});

// ─── Token helpers ───────────────────────────────────────────────────────────

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  if (ENABLE_DEMO_MODE) {
    const role = demoEngine.getActiveRole();
    if (role === 'logged_out') return null;
    return role === 'admin' ? 'demo-jwt-token-admin-999' : 'demo-jwt-token-customer-111';
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  if (ENABLE_DEMO_MODE) {
    await demoEngine.setActiveRole('logged_out');
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function saveSecureData(key: string, value: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  requireAuth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      message = err.message ?? err.error ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  roles: string[];
  isPaid: boolean;
}

export interface MeResponse {
  id: number;
  username: string;
  email: string;
  roles: string[];
  isPaid: boolean;
}

export interface StorefrontResponse {
  id: number;
  userId: number;
  businessType: string;
  slug: string;
  publicUrl: string;
  name: string;
  description: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  data: unknown;
  active: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductResponse {
  id: number;
  storefrontId: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  isDelisted: boolean;
  mediaUrls: string[];
  category: string;
  isPopular: boolean;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreConfigResponse {
  id: number | null;
  storefrontId: number;
  vatRate: number;
  deliveryFee: number;
  waiterPhone?: string | null;
  callEntities?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TableVerifyResponse {
  valid: boolean;
  label: string | null;
  tableCode: string | null;
}

export interface OrderResponse {
  id: number;
  storefrontId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  orderItems: string;
  subtotal: number;
  vat: number;
  delivery: number;
  total: number;
  tableCode: string | null;
  tableLabel: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInitResponse {
  authorizationUrl: string;
  reference: string;
}

export interface PaymentVerifyResponse {
  verified: boolean;
  createdSlug: string | null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function login(email: string, password: string, rememberMe = false) {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.login(email);
  }
  return request<AuthResponse>('POST', '/api/auth/login', { email, password, rememberMe }, false);
}

export interface RegisterResponse {
  message: string;
}

export function register(username: string, email: string, password: string) {
  if (ENABLE_DEMO_MODE) {
    return Promise.resolve({ message: 'Registration successful! (Demo Mode)' });
  }
  return request<RegisterResponse>('POST', '/auth/register', { username, email, password }, false);
}

export function verifyOtp(email: string, otp: string) {
  if (ENABLE_DEMO_MODE) {
    return Promise.resolve({ message: 'OTP verified! (Demo Mode)' });
  }
  return request<{ message: string }>('POST', '/auth/verify-otp', { email, otp }, false);
}

export function resendOtp(email: string) {
  if (ENABLE_DEMO_MODE) {
    return Promise.resolve({ message: 'OTP resent! (Demo Mode)' });
  }
  return request<{ message: string }>('POST', '/auth/resend-otp', { email }, false);
}

export function forgotPassword(email: string) {
  if (ENABLE_DEMO_MODE) {
    return Promise.resolve({ message: 'Password reset link sent! (Demo Mode)' });
  }
  return request<{ message: string }>('POST', '/auth/forgot-password', { email }, false);
}

export function getMe() {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.getMe();
  }
  return request<MeResponse>('GET', '/api/auth/me');
}

// ─── Storefronts ─────────────────────────────────────────────────────────────

export interface CreateStorefrontBody {
  businessType: string;
  name: string;
  description: string;
  logoUrl?: string;
  bannerUrl?: string;
  data?: unknown;
}

export function createStorefront(body: CreateStorefrontBody) {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.createStorefront(body);
  }
  return request<StorefrontResponse>('POST', '/api/business/storefronts', body);
}

export function getMyStorefronts() {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.getMyStorefronts();
  }
  return request<StorefrontResponse[]>('GET', '/api/business/storefronts/my');
}

export function getStorefrontBySlug(slug: string) {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.getStorefrontBySlug(slug);
  }
  return request<StorefrontResponse>('GET', `/api/business/storefronts/${encodeURIComponent(slug)}`, undefined, false);
}

export function getProducts(storefrontId: number) {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.getProducts(storefrontId);
  }
  return request<ProductResponse[]>('GET', `/api/storefronts/${storefrontId}/products`, undefined, false);
}

export function getPopularProducts(storefrontId: number) {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.getPopularProducts(storefrontId);
  }
  return request<ProductResponse[]>('GET', `/api/storefronts/${storefrontId}/products/popular`, undefined, false);
}

export function trackProductView(storefrontId: number, productId: number) {
  if (ENABLE_DEMO_MODE) {
    return Promise.resolve();
  }
  return request<void>('POST', `/api/storefronts/${storefrontId}/products/${productId}/view`, undefined, false);
}

export function getStoreConfig(storefrontId: number) {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.getStoreConfig(storefrontId);
  }
  return request<StoreConfigResponse>('GET', `/api/storefronts/${storefrontId}/config`, undefined, false);
}

export function verifyStoreTable(storefrontId: number, code: string) {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.verifyStoreTable(storefrontId, code);
  }
  return request<TableVerifyResponse>(
    'GET',
    `/api/storefronts/${storefrontId}/tables/verify?code=${encodeURIComponent(code)}`,
    undefined,
    false,
  );
}

export interface CreateOrderBody {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: { id: string; name: string; qty: number; price: number }[];
  subtotal: number;
  vat: number;
  delivery: number;
  total: number;
  tableCode?: string;
}

export function createOrder(storefrontId: number, body: CreateOrderBody) {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.createOrder(storefrontId, body);
  }
  return request<OrderResponse>('POST', `/api/storefronts/${storefrontId}/orders`, body, false);
}

export function getOrders(storefrontId?: number) {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.getOrders(storefrontId);
  }
  return request<OrderResponse[]>('GET', storefrontId ? `/api/storefronts/${storefrontId}/orders` : '/api/orders');
}

export interface WaiterCallBody {
  tableNumber: string;
  callTarget: string;
  message?: string;
}

export function createWaiterCall(storefrontId: number, body: WaiterCallBody) {
  if (ENABLE_DEMO_MODE) {
    return Promise.resolve({ id: Date.now() });
  }
  return request<{ id: number }>('POST', `/api/storefronts/${storefrontId}/waiter-calls`, body, false);
}

export type StoreRequestType = 'SHOUTOUT' | 'SONG' | 'KARAOKE';

export function createStoreRequest(storefrontId: number, body: {
  requestType: StoreRequestType;
  details: string;
  amount: number;
}) {
  if (ENABLE_DEMO_MODE) {
    return Promise.resolve({ id: Date.now() });
  }
  return request<{ id: number }>('POST', `/api/storefronts/${storefrontId}/requests`, body, false);
}

export function createStoreTip(storefrontId: number, body: {
  recipient: string;
  customRecipient?: string | null;
  amount: number;
}) {
  if (ENABLE_DEMO_MODE) {
    return Promise.resolve({ id: Date.now() });
  }
  return request<{ id: number }>('POST', `/api/storefronts/${storefrontId}/tips`, body, false);
}

export function createStoreFeedback(storefrontId: number, body: {
  rating: number;
  description: string;
}) {
  if (ENABLE_DEMO_MODE) {
    return Promise.resolve({ id: Date.now() });
  }
  return request<{ id: number }>('POST', `/api/storefronts/${storefrontId}/feedbacks`, body, false);
}

// ─── Payments ────────────────────────────────────────────────────────────────

export type PaymentPurpose = 'STOREFRONT_CREATION' | 'EVENT_CREATION';

export function initializePayment(purpose: PaymentPurpose, slug: string) {
  if (ENABLE_DEMO_MODE) {
    return Promise.resolve({
      authorizationUrl: 'https://demo.paystack.co/pay/demo-ref-123',
      reference: `demo-ref-${Date.now()}`,
    });
  }
  return request<PaymentInitResponse>('POST', '/api/payments/initialize', {
    purpose,
    payload: JSON.stringify({ slug }),
  });
}

export function verifyPayment(reference: string) {
  if (ENABLE_DEMO_MODE) {
    return Promise.resolve({
      verified: true,
      createdSlug: 'lagos-grill',
    });
  }
  return request<PaymentVerifyResponse>('POST', '/api/payments/verify', { reference });
}

export interface UpdateStoreConfigBody {
  vatRate?: number;
  deliveryFee?: number;
  deliveryEnabled?: boolean;
}

export function updateStoreConfig(storefrontId: number, body: UpdateStoreConfigBody) {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.updateStoreConfig(storefrontId, body);
  }
  return request<StoreConfigResponse>('PUT', `/api/storefronts/${storefrontId}/config`, body);
}

export interface BusinessProfileData {
  name?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
}

export async function saveBusinessProfileData(data: BusinessProfileData): Promise<void> {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.saveBusinessProfileData(data);
  }
  const existing = await AsyncStorage.getItem('global_business_profile');
  const parsed = existing ? JSON.parse(existing) : {};
  const updated = { ...parsed, ...data };
  await AsyncStorage.setItem('global_business_profile', JSON.stringify(updated));
}

export async function getBusinessProfileData(): Promise<BusinessProfileData> {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.getBusinessProfileData();
  }
  const existing = await AsyncStorage.getItem('global_business_profile');
  return existing ? JSON.parse(existing) : {};
}

// ─── Toolbar Activity (Admin) ──────────────────────────────────────────

export interface WaiterCallRecord {
  id: number;
  storefrontId: number;
  tableNumber: string;
  callTarget: string;
  message: string;
  status: 'PENDING' | 'ACKNOWLEDGED';
  createdAt: string;
}

export interface StoreRequestRecord {
  id: number;
  storefrontId: number;
  requestType: 'SHOUTOUT' | 'SONG' | 'KARAOKE';
  details: string;
  amount: number;
  status: 'PENDING' | 'ACKNOWLEDGED';
  createdAt: string;
}

export interface TipRecord {
  id: number;
  storefrontId: number;
  recipient: string;
  customRecipient: string | null;
  amount: number;
  status: 'PENDING' | 'ACKNOWLEDGED';
  createdAt: string;
}

export function getStorefrontWaiterCalls(storefrontId: number): Promise<WaiterCallRecord[]> {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.getWaiterCalls(storefrontId) as Promise<WaiterCallRecord[]>;
  }
  return request<WaiterCallRecord[]>('GET', `/api/storefronts/${storefrontId}/waiter-calls`);
}

export function getStorefrontRequests(storefrontId: number): Promise<StoreRequestRecord[]> {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.getStoreRequests(storefrontId) as Promise<StoreRequestRecord[]>;
  }
  return request<StoreRequestRecord[]>('GET', `/api/storefronts/${storefrontId}/requests`);
}

export function getStorefrontTips(storefrontId: number): Promise<TipRecord[]> {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.getTips(storefrontId) as Promise<TipRecord[]>;
  }
  return request<TipRecord[]>('GET', `/api/storefronts/${storefrontId}/tips`);
}

export function acknowledgeWaiterCall(storefrontId: number, callId: number): Promise<void> {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.acknowledgeWaiterCall(callId);
  }
  return request<void>('PATCH', `/api/storefronts/${storefrontId}/waiter-calls/${callId}/acknowledge`);
}

export function acknowledgeStoreRequest(storefrontId: number, requestId: number): Promise<void> {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.acknowledgeStoreRequest(requestId);
  }
  return request<void>('PATCH', `/api/storefronts/${storefrontId}/requests/${requestId}/acknowledge`);
}

export function acknowledgeTip(storefrontId: number, tipId: number): Promise<void> {
  if (ENABLE_DEMO_MODE) {
    return demoEngine.acknowledgeTip(tipId);
  }
  return request<void>('PATCH', `/api/storefronts/${storefrontId}/tips/${tipId}/acknowledge`);
}
