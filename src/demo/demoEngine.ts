import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEMO_ACCOUNTS,
  DEMO_BUSINESS_PROFILE,
  DEMO_STOREFRONTS,
  DEMO_STORE_CONFIGS,
  DEMO_PRODUCTS,
  DEMO_INITIAL_ORDERS,
  DEMO_WAITER_CALLS,
  DEMO_STORE_REQUESTS,
  DEMO_TIPS,
  type DemoWaiterCall,
  type DemoStoreRequest,
  type DemoTip,
} from './mockData';
import type {
  AuthResponse,
  MeResponse,
  StorefrontResponse,
  ProductResponse,
  StoreConfigResponse,
  OrderResponse,
  CreateStorefrontBody,
  CreateOrderBody,
  UpdateStoreConfigBody,
  BusinessProfileData,
  TableVerifyResponse,
} from '../api';

const KEYS = {
  DEMO_MODE: 'scancode_demo_mode_enabled',
  ACTIVE_ROLE: 'scancode_demo_active_role',
  STOREFRONTS: 'scancode_demo_storefronts',
  PRODUCTS: 'scancode_demo_products',
  STORE_CONFIGS: 'scancode_demo_store_configs',
  ORDERS: 'scancode_demo_orders',
  PROFILE: 'scancode_demo_business_profile',
};

class DemoEngine {
  private demoModeEnabled: boolean = true;
  private activeRole: 'admin' | 'customer' | 'logged_out' = 'admin';
  private storefronts: StorefrontResponse[] = [...DEMO_STOREFRONTS];
  private products: Record<number, ProductResponse[]> = JSON.parse(JSON.stringify(DEMO_PRODUCTS));
  private configs: Record<number, StoreConfigResponse> = JSON.parse(JSON.stringify(DEMO_STORE_CONFIGS));
  private orders: OrderResponse[] = [...DEMO_INITIAL_ORDERS];
  private businessProfile: BusinessProfileData = { ...DEMO_BUSINESS_PROFILE };
  private waiterCalls: DemoWaiterCall[] = JSON.parse(JSON.stringify(DEMO_WAITER_CALLS));
  private storeRequests: DemoStoreRequest[] = JSON.parse(JSON.stringify(DEMO_STORE_REQUESTS));
  private tips: DemoTip[] = JSON.parse(JSON.stringify(DEMO_TIPS));
  private initialized: boolean = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const mode = await AsyncStorage.getItem(KEYS.DEMO_MODE);
      if (mode !== null) {
        this.demoModeEnabled = JSON.parse(mode);
      }

      const role = await AsyncStorage.getItem(KEYS.ACTIVE_ROLE);
      if (role !== null && (role === 'admin' || role === 'customer' || role === 'logged_out')) {
        this.activeRole = role as 'admin' | 'customer' | 'logged_out';
      }

      const stores = await AsyncStorage.getItem(KEYS.STOREFRONTS);
      if (stores) this.storefronts = JSON.parse(stores);

      const prods = await AsyncStorage.getItem(KEYS.PRODUCTS);
      if (prods) this.products = JSON.parse(prods);

      const cfgs = await AsyncStorage.getItem(KEYS.STORE_CONFIGS);
      if (cfgs) this.configs = JSON.parse(cfgs);

      const ords = await AsyncStorage.getItem(KEYS.ORDERS);
      if (ords) this.orders = JSON.parse(ords);

      const prof = await AsyncStorage.getItem(KEYS.PROFILE);
      if (prof) this.businessProfile = JSON.parse(prof);
    } catch {
      // Use defaults if storage read fails
    } finally {
      this.initialized = true;
    }
  }

  // Delay simulation helper for realistic UI state testing
  private async simulateLatency(ms: number = 250): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ─── Mode & Role State ────────────────────────────────────────────────────────

  isDemoModeEnabled(): boolean {
    return this.demoModeEnabled;
  }

  async setDemoModeEnabled(enabled: boolean): Promise<void> {
    this.demoModeEnabled = enabled;
    await AsyncStorage.setItem(KEYS.DEMO_MODE, JSON.stringify(enabled));
  }

  getActiveRole(): 'admin' | 'customer' | 'logged_out' {
    return this.activeRole;
  }

  async setActiveRole(role: 'admin' | 'customer' | 'logged_out'): Promise<void> {
    this.activeRole = role;
    await AsyncStorage.setItem(KEYS.ACTIVE_ROLE, role);
  }

  async resetDemoState(): Promise<void> {
    this.storefronts = JSON.parse(JSON.stringify(DEMO_STOREFRONTS));
    this.products = JSON.parse(JSON.stringify(DEMO_PRODUCTS));
    this.configs = JSON.parse(JSON.stringify(DEMO_STORE_CONFIGS));
    this.orders = JSON.parse(JSON.stringify(DEMO_INITIAL_ORDERS));
    this.businessProfile = { ...DEMO_BUSINESS_PROFILE };
    this.waiterCalls = JSON.parse(JSON.stringify(DEMO_WAITER_CALLS));
    this.storeRequests = JSON.parse(JSON.stringify(DEMO_STORE_REQUESTS));
    this.tips = JSON.parse(JSON.stringify(DEMO_TIPS));

    await AsyncStorage.multiRemove([
      KEYS.STOREFRONTS,
      KEYS.PRODUCTS,
      KEYS.STORE_CONFIGS,
      KEYS.ORDERS,
      KEYS.PROFILE,
    ]);
  }

  // ─── Mock API Endpoint Handlers ──────────────────────────────────────────────

  async login(email: string): Promise<AuthResponse> {
    await this.simulateLatency();
    const isCustomer = email.toLowerCase().includes('customer');
    const account = isCustomer ? DEMO_ACCOUNTS.customer : DEMO_ACCOUNTS.admin;
    await this.setActiveRole(isCustomer ? 'customer' : 'admin');
    return {
      token: account.token,
      username: account.username,
      email: account.email,
      roles: account.roles,
      isPaid: account.isPaid,
    };
  }

  async getMe(): Promise<MeResponse> {
    await this.simulateLatency();
    const isCustomer = this.activeRole === 'customer';
    const account = isCustomer ? DEMO_ACCOUNTS.customer : DEMO_ACCOUNTS.admin;
    return {
      id: isCustomer ? 111 : 99,
      username: account.username,
      email: account.email,
      roles: account.roles,
      isPaid: account.isPaid,
    };
  }

  async getMyStorefronts(): Promise<StorefrontResponse[]> {
    await this.simulateLatency();
    return [...this.storefronts];
  }

  async getStorefrontBySlug(slug: string): Promise<StorefrontResponse> {
    await this.simulateLatency();
    const found = this.storefronts.find((s) => s.slug.toLowerCase() === slug.toLowerCase());
    if (found) return found;

    // Dynamic fallback so any entered slug works seamlessly
    const dynamicStore: StorefrontResponse = {
      id: Date.now(),
      userId: 99,
      businessType: 'General Business',
      slug,
      publicUrl: `https://scancode.live/s/${slug}`,
      name: slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      description: `Welcome to ${slug}. Place your orders directly from your table!`,
      logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop',
      data: { theme: 'light', currency: 'NGN' },
      active: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.storefronts.push(dynamicStore);
    await AsyncStorage.setItem(KEYS.STOREFRONTS, JSON.stringify(this.storefronts));
    return dynamicStore;
  }

  async createStorefront(body: CreateStorefrontBody): Promise<StorefrontResponse> {
    await this.simulateLatency();
    const id = Date.now();
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `store-${id}`;
    const newStore: StorefrontResponse = {
      id,
      userId: 99,
      businessType: body.businessType,
      slug,
      publicUrl: `https://scancode.live/s/${slug}`,
      name: body.name,
      description: body.description,
      logoUrl: body.logoUrl || null,
      bannerUrl: body.bannerUrl || null,
      data: body.data || {},
      active: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.storefronts.unshift(newStore);
    await AsyncStorage.setItem(KEYS.STOREFRONTS, JSON.stringify(this.storefronts));
    return newStore;
  }

  async getProducts(storefrontId: number): Promise<ProductResponse[]> {
    await this.simulateLatency();
    return this.products[storefrontId] || DEMO_PRODUCTS[1] || [];
  }

  async getPopularProducts(storefrontId: number): Promise<ProductResponse[]> {
    await this.simulateLatency();
    const all = this.products[storefrontId] || DEMO_PRODUCTS[1] || [];
    return all.filter((p) => p.isPopular);
  }

  async getStoreConfig(storefrontId: number): Promise<StoreConfigResponse> {
    await this.simulateLatency();
    if (this.configs[storefrontId]) return this.configs[storefrontId];
    return {
      id: Date.now(),
      storefrontId,
      vatRate: 7.5,
      deliveryFee: 1500,
      waiterPhone: '+2348012345678',
      callEntities: ['Waiter / Service', 'Manager On Duty', 'Bill Request'],
    };
  }

  async updateStoreConfig(storefrontId: number, body: UpdateStoreConfigBody): Promise<StoreConfigResponse> {
    await this.simulateLatency();
    const existing = await this.getStoreConfig(storefrontId);
    const updated: StoreConfigResponse = {
      ...existing,
      vatRate: body.vatRate !== undefined ? body.vatRate : existing.vatRate,
      deliveryFee: body.deliveryFee !== undefined ? body.deliveryFee : existing.deliveryFee,
      updatedAt: new Date().toISOString(),
    };
    this.configs[storefrontId] = updated;
    await AsyncStorage.setItem(KEYS.STORE_CONFIGS, JSON.stringify(this.configs));
    return updated;
  }

  async verifyStoreTable(storefrontId: number, code: string): Promise<TableVerifyResponse> {
    await this.simulateLatency();
    return {
      valid: true,
      label: `Table ${code.replace(/[^0-9]/g, '') || code}`,
      tableCode: code,
    };
  }

  async createOrder(storefrontId: number, body: CreateOrderBody): Promise<OrderResponse> {
    await this.simulateLatency();
    const newOrder: OrderResponse = {
      id: Date.now(),
      storefrontId,
      customerName: body.customerName || 'Walk-in Customer',
      customerPhone: body.customerPhone || '+2348000000000',
      customerEmail: body.customerEmail || 'customer@example.com',
      orderItems: JSON.stringify(body.items),
      subtotal: body.subtotal,
      vat: body.vat,
      delivery: body.delivery,
      total: body.total,
      tableCode: body.tableCode || null,
      tableLabel: body.tableCode ? `Table ${body.tableCode}` : null,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.orders.unshift(newOrder);
    await AsyncStorage.setItem(KEYS.ORDERS, JSON.stringify(this.orders));
    return newOrder;
  }

  async getOrders(storefrontId?: number): Promise<OrderResponse[]> {
    await this.simulateLatency();
    if (storefrontId) {
      return this.orders.filter((o) => o.storefrontId === storefrontId);
    }
    return [...this.orders];
  }

  async saveBusinessProfileData(data: BusinessProfileData): Promise<void> {
    await this.simulateLatency();
    this.businessProfile = { ...this.businessProfile, ...data };
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(this.businessProfile));
  }

  async getBusinessProfileData(): Promise<BusinessProfileData> {
    await this.simulateLatency();
    return { ...this.businessProfile };
  }

  // ─── Toolbar Activity (Waiter Calls, Requests, Tips) ─────────────────────

  async getWaiterCalls(storefrontId: number): Promise<DemoWaiterCall[]> {
    await this.simulateLatency();
    return this.waiterCalls.filter((c) => c.storefrontId === storefrontId);
  }

  async getStoreRequests(storefrontId: number): Promise<DemoStoreRequest[]> {
    await this.simulateLatency();
    return this.storeRequests.filter((r) => r.storefrontId === storefrontId);
  }

  async getTips(storefrontId: number): Promise<DemoTip[]> {
    await this.simulateLatency();
    return this.tips.filter((t) => t.storefrontId === storefrontId);
  }

  async acknowledgeWaiterCall(id: number): Promise<void> {
    await this.simulateLatency(150);
    const item = this.waiterCalls.find((c) => c.id === id);
    if (item) item.status = 'ACKNOWLEDGED';
  }

  async acknowledgeStoreRequest(id: number): Promise<void> {
    await this.simulateLatency(150);
    const item = this.storeRequests.find((r) => r.id === id);
    if (item) item.status = 'ACKNOWLEDGED';
  }

  async acknowledgeTip(id: number): Promise<void> {
    await this.simulateLatency(150);
    const item = this.tips.find((t) => t.id === id);
    if (item) item.status = 'ACKNOWLEDGED';
  }
}

export const demoEngine = new DemoEngine();
