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
} //uncertain wheter or njot it should  be here

export function register(username: string, email: string, password: string) {
  return request<RegisterResponse>('POST', '/auth/register', { username, email, password }, false);
}

export function verifyOtp(email: string, otp: string) {
  return request<{ message: string }>('POST', '/auth/verify-otp', { email, otp }, false);
}

export function resendOtp(email: string) {
  return request<{ message: string }>('POST', '/auth/resend-otp', { email }, false);
} //115 - 124 Uncertain

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

// ─── H2 Database Admin ────────────────────────────────────────────────────────

export interface QueryResult {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  error: string | null;
  rowCount: number;
}

export function listDbTables(): Promise<string[]> {
  return request<string[]>('GET', '/api/admin/db/tables');
}

export function getTableRows(table: string, limit = 200): Promise<QueryResult> {
  return request<QueryResult>('GET', `/api/admin/db/tables/${table}?limit=${limit}`);
}

export function executeQuery(sql: string): Promise<QueryResult> {
  return request<QueryResult>('POST', '/api/admin/db/query', { sql });
}
