import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const API_BASE = 'http://192.168.1.155:8082';
const TOKEN_KEY = 'scancode_token';

// ─── Token helpers ───────────────────────────────────────────────────────────

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function saveSecureData(key: string, value: string) {
  if (Platform.OS === 'web') {
    // Safe browser fallback
    await AsyncStorage.setItem(key, value);
  } else {
    // Safe mobile execution
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
  return request<AuthResponse>('POST', '/api/auth/login', { email, password, rememberMe }, false);
}

export interface RegisterResponse {
  message: string;
}

export function register(username: string, email: string, password: string) {
  return request<RegisterResponse>('POST', '/auth/register', { username, email, password }, false);
}

export function verifyOtp(email: string, otp: string) {
  return request<{ message: string }>('POST', '/auth/verify-otp', { email, otp }, false);
}

export function resendOtp(email: string) {
  return request<{ message: string }>('POST', '/auth/resend-otp', { email }, false);
}

export function forgotPassword(email: string) {
  return request<{ message: string }>('POST', '/auth/forgot-password', { email }, false);
}

export function getMe() {
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
  return request<StorefrontResponse>('POST', '/api/business/storefronts', body);
}

export function getMyStorefronts() {
  return request<StorefrontResponse[]>('GET', '/api/business/storefronts/my');
}

export function getStorefrontBySlug(slug: string) {
  return request<StorefrontResponse>('GET', `/api/business/storefronts/${encodeURIComponent(slug)}`, undefined, false);
}

export function getProducts(storefrontId: number) {
  return request<ProductResponse[]>('GET', `/api/storefronts/${storefrontId}/products`, undefined, false);
}

export function getPopularProducts(storefrontId: number) {
  return request<ProductResponse[]>('GET', `/api/storefronts/${storefrontId}/products/popular`, undefined, false);
}

export function trackProductView(storefrontId: number, productId: number) {
  return request<void>('POST', `/api/storefronts/${storefrontId}/products/${productId}/view`, undefined, false);
}

export function getStoreConfig(storefrontId: number) {
  return request<StoreConfigResponse>('GET', `/api/storefronts/${storefrontId}/config`, undefined, false);
}

export function verifyStoreTable(storefrontId: number, code: string) {
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
  return request<OrderResponse>('POST', `/api/storefronts/${storefrontId}/orders`, body, false);
}

export interface WaiterCallBody {
  tableNumber: string;
  callTarget: string;
  message?: string;
}

export function createWaiterCall(storefrontId: number, body: WaiterCallBody) {
  return request<{ id: number }>('POST', `/api/storefronts/${storefrontId}/waiter-calls`, body, false);
}

export type StoreRequestType = 'SHOUTOUT' | 'SONG' | 'KARAOKE';

export function createStoreRequest(storefrontId: number, body: {
  requestType: StoreRequestType;
  details: string;
  amount: number;
}) {
  return request<{ id: number }>('POST', `/api/storefronts/${storefrontId}/requests`, body, false);
}

export function createStoreTip(storefrontId: number, body: {
  recipient: string;
  customRecipient?: string | null;
  amount: number;
}) {
  return request<{ id: number }>('POST', `/api/storefronts/${storefrontId}/tips`, body, false);
}

export function createStoreFeedback(storefrontId: number, body: {
  rating: number;
  description: string;
}) {
  return request<{ id: number }>('POST', `/api/storefronts/${storefrontId}/feedbacks`, body, false);
}

// ─── Payments ────────────────────────────────────────────────────────────────

export type PaymentPurpose = 'STOREFRONT_CREATION' | 'EVENT_CREATION';

export function initializePayment(purpose: PaymentPurpose, slug: string) {
  return request<PaymentInitResponse>('POST', '/api/payments/initialize', {
    purpose,
    payload: JSON.stringify({ slug }),
  });
}

export function verifyPayment(reference: string) {
  return request<PaymentVerifyResponse>('POST', '/api/payments/verify', { reference });
}


