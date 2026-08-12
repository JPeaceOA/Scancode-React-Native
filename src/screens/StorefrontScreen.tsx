
import React, { useState, useEffect, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    Pressable
} from 'react-native';
import { Heart, Search, ShoppingCart } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import StorefrontToolbar, { type WeeklyEvents } from '../components/StorefrontToolbar';
import {
    getProducts,
    getStoreConfig,
    getStorefrontBySlug,
    type ProductResponse,
    type StorefrontResponse,
} from '../api';

// import { api, ProductResponse, StorefrontResponse } from '../api';
// import {
//   getBusinessProfile,
//   getStoreProducts,
//   saveCheckoutOrder,
//   StoreProduct,
//   CustomCategory,
// } from '../lib/storeData';

export interface Vendor {
    name: string;
    description: string;
    phone: string;
    email: string;
    bankName: string;
    accountNumber: string;
    images: string[];
    logoUrl?: string;
    bannerUrl?: string;
    estimatedDeliveryTime?: string;
}


export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    isDelisted: boolean;
    media: string[];
    category: string;
    isPopular?: boolean;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    imageUrl?: string;
}

export interface CartItem {
    id: string;
    name: string;
    price: number;
    qty: number;
}

type RootStackParamList = {
    StorefrontScreen: { slug: string; table?: string; tableCode?: string };
    CheckoutScreen: { slug: string; table?: string; cart: CartItem[] };
};

type StorefrontScreenRouteProp = RouteProp<RootStackParamList, 'StorefrontScreen'>;


const SAMPLE_CATEGORIES: Category[] = [
    { id: 'all', name: 'All', icon: '📋' },
    { id: 'meals', name: 'Meals', icon: '🍱' },
    { id: 'new', name: 'new', icon: '🥬' },
    { id: 'general', name: 'General', icon: '📦' }
];

type StorefrontData = {
    phone?: string;
    email?: string;
    bankName?: string;
    accountNumber?: string;
    images?: string[];
    estimatedDeliveryTime?: string;
    weeklyEvents?: WeeklyEvents;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStorefrontData(data: unknown): StorefrontData {
    if (!isRecord(data)) return {};
    return {
        phone: typeof data.phone === 'string' ? data.phone : undefined,
        email: typeof data.email === 'string' ? data.email : undefined,
        bankName: typeof data.bankName === 'string' ? data.bankName : undefined,
        accountNumber: typeof data.accountNumber === 'string' ? data.accountNumber : undefined,
        images: Array.isArray(data.images) ? data.images.filter((item): item is string => typeof item === 'string') : undefined,
        estimatedDeliveryTime: typeof data.estimatedDeliveryTime === 'string' ? data.estimatedDeliveryTime : undefined,
        weeklyEvents: isRecord(data.weeklyEvents) ? data.weeklyEvents as WeeklyEvents : undefined,
    };
}

function mapProduct(product: ProductResponse): Product {
    return {
        id: String(product.id),
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        isDelisted: product.isDelisted,
        media: product.mediaUrls ?? [],
        category: product.category || 'General',
        isPopular: product.isPopular,
    };
}

function getCategoryIcon(category: string) {
    return category.trim().slice(0, 1).toUpperCase() || '#';
}
// remove when ready
const DUMMY_VENDOR: Vendor = {
    name: "ScanCode Lounge & Bistro",
    description: "Premium dining, craft drinks & instant table service.",
    phone: "+234 801 234 5678",
    email: "orders@scancodelounge.ng",
    bankName: "GTBank PLC",
    accountNumber: "0123456789",
    images: [],
    estimatedDeliveryTime: "20-30 minutes",
};

const DUMMY_WEEKLY_EVENTS: WeeklyEvents = {
    Friday: [
        { id: 'ev-1', time: '8:00 PM', name: 'Afrobeats & DJ Night', description: 'Live DJ set by DJ Spin & cocktail specials.' },
    ],
    Saturday: [
        { id: 'ev-2', time: '7:00 PM', name: 'Karaoke & Open Mic', description: 'Request songs via ScanCode toolbar and sing your heart out!' },
    ],
    Sunday: [
        { id: 'ev-3', time: '1:00 PM', name: 'Sunday BBQ Brunch', description: 'Unlimited grilled meats & acoustic live session.' },
    ],
};

const DUMMY_PRODUCTS: Product[] = [
    {
        id: 'p-1',
        name: 'Classic Cheeseburger',
        description: 'Flame-grilled beef patty, melted cheddar, lettuce, pickles & secret sauce.',
        price: 4500,
        stock: 15,
        isDelisted: false,
        media: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80'],
        category: 'Meals',
        isPopular: true,
    },
    {
        id: 'p-2',
        name: 'Smokey Jollof Rice & Chicken',
        description: 'Authentic Nigerian firewood Jollof served with fried plantain & grilled chicken.',
        price: 5200,
        stock: 20,
        isDelisted: false,
        media: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'],
        category: 'Meals',
        isPopular: true,
    },
    {
        id: 'p-3',
        name: 'Crispy Golden Fries',
        description: 'Hand-cut seasoned potato fries served with garlic mayo dip.',
        price: 1800,
        stock: 30,
        isDelisted: false,
        media: ['https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80'],
        category: 'Sides',
        isPopular: false,
    },
    {
        id: 'p-4',
        name: 'Tropical Citrus Mojito',
        description: 'Refreshing blend of fresh mint, lime, passion fruit & sparkling soda.',
        price: 2500,
        stock: 50,
        isDelisted: false,
        media: ['https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80'],
        category: 'Drinks',
        isPopular: true,
    },
    {
        id: 'p-5',
        name: 'Triple Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten center, served with vanilla bean ice cream.',
        price: 3000,
        stock: 10,
        isDelisted: false,
        media: ['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80'],
        category: 'Desserts',
        isPopular: false,
    },
];
// remove above when ready

export default function StorefrontScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<StorefrontScreenRouteProp>();

    const rawSlug = route.params?.slug;
    const slug = rawSlug && rawSlug.trim() ? rawSlug.trim() : 'demo';
    const scannedTableCode = (route.params?.table ?? route.params?.tableCode) as string | undefined;

    const [storefront, setStorefront] = useState<StorefrontResponse | null>(null);
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartModalVisible, setIsCartModalVisible] = useState(false);
    const [isFavoritesModalVisible, setIsFavoritesModalVisible] = useState(false);
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [weeklyEvents, setWeeklyEvents] = useState<WeeklyEvents>({});
    const [vatRate, setVatRate] = useState<number>(0.075);
    const [deliveryFee, setDeliveryFee] = useState<number>(2000);
    const [isDeliveryEnabled, setIsDeliveryEnabled] = useState<boolean>(true);

    const applyDummyData = () => { //remove when ready
        setStorefront({
            id: 999,
            userId: 1,
            businessType: 'RESTAURANT',
            slug: 'demo',
            publicUrl: 'http://localhost/store/demo',
            name: DUMMY_VENDOR.name,
            description: DUMMY_VENDOR.description,
            logoUrl: null,
            bannerUrl: null,
            data: DUMMY_VENDOR,
            active: true,
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        setVendor(DUMMY_VENDOR);
        setProducts(DUMMY_PRODUCTS);
        setWeeklyEvents(DUMMY_WEEKLY_EVENTS);
        setVatRate(0.075);
        setDeliveryFee(2000);
        setIsDeliveryEnabled(true);
    };

    useEffect(() => {
        const fetchVendor = async () => {
            try {
                setIsLoading(true);
                setError(null);

                if (slug === 'demo') {
                    applyDummyData();
                    return;
                }

                const storefrontData = await getStorefrontBySlug(slug);
                const customData = parseStorefrontData(storefrontData.data);

                setStorefront(storefrontData);
                setVendor({
                    name: storefrontData.name,
                    description: storefrontData.description,
                    phone: customData.phone ?? DUMMY_VENDOR.phone,
                    email: customData.email ?? DUMMY_VENDOR.email,
                    bankName: customData.bankName ?? DUMMY_VENDOR.bankName,
                    accountNumber: customData.accountNumber ?? DUMMY_VENDOR.accountNumber,
                    images: customData.images ?? [],
                    logoUrl: storefrontData.logoUrl ?? undefined,
                    bannerUrl: storefrontData.bannerUrl ?? undefined,
                    estimatedDeliveryTime: customData.estimatedDeliveryTime ?? DUMMY_VENDOR.estimatedDeliveryTime,
                });
                setWeeklyEvents(customData.weeklyEvents && Object.keys(customData.weeklyEvents).length > 0 ? customData.weeklyEvents : DUMMY_WEEKLY_EVENTS);

                const [productData, configData] = await Promise.all([
                    getProducts(storefrontData.id),
                    getStoreConfig(storefrontData.id).catch(() => null),
                ]);
                // remove above when ready

                const mapped = productData.filter((product) => !product.isDelisted).map(mapProduct);
                setProducts(mapped.length > 0 ? mapped : DUMMY_PRODUCTS);

                if (configData) {
                    setVatRate(configData.vatRate ?? 0.075);
                    setDeliveryFee(configData.deliveryFee ?? 2000);
                    setIsDeliveryEnabled(true);
                }
            } catch (err) {
                // Fallback to rich demo dummy data if API fails or backend offline
                applyDummyData();
            } finally {
                setIsLoading(false);
            }
        };
        fetchVendor();
    }, [slug]);

    const addToCart = (product: Product) => {
        const existingItem = cart.find((item) => item.id === product.id);
        const currentQty = existingItem ? existingItem.qty : 0;
        if (currentQty + 1 > product.stock) {
            Alert.alert("Limit Reached", `Only ${product.stock} items available in stock.`);
            return;
        }
        setCart((prevCart) => {
            if (existingItem) {
                return prevCart.map((item) =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                );
            }
            return [...prevCart, { id: product.id, name: product.name, price: product.price, qty: 1 }];
        });
    };

    const toggleFavorite = (product: Product) => {
        setFavoriteIds((prev) => {
            if (prev.includes(product.id)) {
                return prev.filter((id) => id !== product.id);
            }
            return [...prev, product.id];
        });
    };

    const handleUpdateCartQty = (id: string, delta: number) => {
        setCart((prev) => {
            return prev.map((item) => {
                if (item.id !== id) return item;
                const newQty = item.qty + delta;

                // If quantity drops to or below zero, clean remove it from the list
                if (newQty <= 0) return null;

                // Check structural stock boundaries if available on target products
                const productRef = products.find(p => p.id === id);
                if (productRef && newQty > productRef.stock) {
                    Alert.alert("Limit Reached", `Only ${productRef.stock} items available in stock.`);
                    return item;
                }

                return { ...item, qty: newQty };
            }).filter(Boolean) as CartItem[];
        });
    };
    const handleRemoveCartItem = (id: string) => {
        setCart((prev) => prev.filter((item) => item.id !== id));
    };

    const filteredProducts = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        return products.filter((product) => {
            const matchesCategory =
                !activeCategory ||
                product.category.toLowerCase() === activeCategory.toLowerCase();
            const matchesSearch =
                !normalizedSearch ||
                product.name.toLowerCase().includes(normalizedSearch) ||
                product.description.toLowerCase().includes(normalizedSearch) ||
                product.category.toLowerCase().includes(normalizedSearch);

            return matchesCategory && matchesSearch;
        });
    }, [products, activeCategory, searchQuery]);

    const favoriteProducts = useMemo(() => {
        return products.filter((product) => favoriteIds.includes(product.id));
    }, [products, favoriteIds]);

    const categories = useMemo<Category[]>(() => {
        const categoryNames = Array.from(new Set(products.map((product) => product.category).filter(Boolean)));
        return categoryNames.map((category) => ({
            id: category.toLowerCase().replace(/\s+/g, '-'),
            name: category,
            icon: getCategoryIcon(category),
        }));
    }, [products]);

    const handleCategoryPress = (category: string) => {
        setActiveCategory((current) => current === category ? null : category);
    };

    const clearCategorySelection = () => {
        setActiveCategory(null);
    };

    const financialSummary = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const appliedDelivery = isDeliveryEnabled && subtotal > 0 ? deliveryFee : 0;
        const appliedVat = subtotal * vatRate;
        const grandTotal = subtotal + appliedDelivery + appliedVat;

        return {
            subtotal,
            appliedDelivery,
            appliedVat,
            grandTotal,
            totalQty: cart.reduce((total, item) => total + item.qty, 0)
        };
    }, [cart, vatRate, deliveryFee, isDeliveryEnabled]);

    const getCartCount = () => {
        return cart.reduce((total, item) => total + item.qty, 0);
    };

    if (isLoading) {
        return (
            <View style={styles.skeleton}>
                <ActivityIndicator size="large" color="#6C63FF" />
            </View>
        );
    }
    if (error) {
        return (
            <View style={styles.skeleton}>
                <Text style={styles.errorText}>{error || "Store Details Missing"}</Text>
            </View>
        );
    }

    // FIX: Make sure the CartSummaryWidget is called inside your JSX return array, NOT declared as a function inside it.
    return (
        <SafeAreaView style={styles.container}>
            {/* 1. Global Brand & Logo Centered Container */}
            <View style={styles.brandContainer}>
                {/* Fallback circle using logoUrl if provided, else using a stylized circular container */}
                <View style={styles.logoCircle}>
                    {vendor?.logoUrl ? (
                        <Image source={{ uri: vendor.logoUrl }} style={styles.logoImage} />
                    ) : (
                        <View style={styles.logoInnerFallback}>
                            <Text style={styles.logoIconText}>|=|</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.vendorName}>{vendor?.name || "The Test"}</Text>
                <Text style={styles.brandingSubtext}>...by ScanCode.ng</Text>
                {scannedTableCode && (
                    <View style={styles.tableBadge}>
                        <Text style={styles.tableBadgeText}>📍 Table: {scannedTableCode}</Text>
                    </View>
                )}
            </View>

            {/* 2. Search & Favorites Action Row Component */}
            <View style={styles.searchRowContainer}>
                <View style={styles.searchBarWrapper}>
                    <Search size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
                    <TextInput
                        style={styles.searchInputField}
                        placeholder="Search for dishes..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />

                    <TouchableOpacity
                        style={styles.headerIconButton}
                        activeOpacity={0.7}
                        onPress={() => setIsCartModalVisible(true)}
                        accessibilityLabel="Open cart"
                    >
                        <ShoppingCart size={20} color="#065F46" strokeWidth={2} />
                        {financialSummary.totalQty > 0 && (
                            <View style={styles.headerCountBadge}>
                                <Text style={styles.headerCountBadgeText}>{financialSummary.totalQty}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.headerIconButton}
                        activeOpacity={0.7}
                        onPress={() => setIsFavoritesModalVisible(true)}
                        accessibilityLabel="Open favorites"
                    >
                        <Heart
                            size={20}
                            color={favoriteIds.length > 0 ? '#EF4444' : '#6B7280'}
                            fill={favoriteIds.length > 0 ? '#EF4444' : 'none'}
                            strokeWidth={2}
                        />
                        {favoriteIds.length > 0 && (
                            <View style={styles.headerCountBadge}>
                                <Text style={styles.headerCountBadgeText}>{favoriteIds.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* 3. Section Title: Categories Grid Header */}
            <Text style={styles.sectionHeadingTitle}>Categories</Text>

            {/* 4. Category Square Display Blocks Carousel Layout */}
            <View style={styles.categoryScrollWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollPadding}>
                    {categories.length > 0 ? categories.map((cat) => {
                        const isSelected = activeCategory === cat.name;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                style={[styles.categorySquareCard, isSelected && styles.activeSquareCard]}
                                activeOpacity={0.8}
                                onPress={() => handleCategoryPress(cat.name)}
                            >
                                <View style={styles.squareIconBox}>
                                    <Text style={styles.squareBoxIconSymbol}>{cat.icon}</Text>
                                </View>
                                <Text style={[styles.squareCardLabel, isSelected && styles.activeSquareCardLabel]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    }) : (
                        <View style={styles.emptyCategoriesBox}>
                            <Text style={styles.emptyStateText}>Categories will appear when products are added.</Text>
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* 5. Dynamic Contextual List Heading */}
            <Text style={styles.sectionHeadingTitle}>
                {activeCategory ? `${activeCategory} Products` : 'All Products'}
            </Text>

            {/* Main Content Window Area */}
            <ScrollView
                style={styles.menuList}
                contentContainerStyle={styles.scrollPadding}
            >
                {/* Menu Items Loop */}
                {filteredProducts.map((item) => (
                    <View key={item.id} style={styles.productCard}>
                        {/* Image Placeholder with fallback graphic support */}
                        <View style={styles.imgPlaceholder}>
                            {item.media[0] ? (
                                <Image source={{ uri: item.media[0] }} style={styles.productImage} />
                            ) : (
                                <Text style={styles.placeholderIcon}>📦</Text>
                            )}
                        </View>
                        <View style={styles.productDetails}>
                            <View style={styles.cardHeaderRow}>
                                <Text style={styles.productName}>{item.name}</Text>
                                {/* Form Sync: Badges render if 'Mark as Featured/Popular' checkbox was checked
                                {item.isPopular && (
                                    <View style={styles.popularBadge}>
                                        <Text style={styles.popularBadgeText}>⭐ Popular</Text>
                                    </View>
                                )} */}
                            </View>
                            <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
                            <View style={styles.cardRow}>
                                <Text style={styles.productPrice}>₦{item.price.toLocaleString()}</Text>
                                <View style={styles.cardActions}>
                                    <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                                        <Text style={styles.addBtnText}> + </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.favoriteCardButton,
                                            favoriteIds.includes(item.id) && styles.favoriteCardButtonActive
                                        ]}
                                        onPress={() => toggleFavorite(item)}
                                        activeOpacity={0.75}
                                        accessibilityLabel={`${favoriteIds.includes(item.id) ? 'Remove from' : 'Add to'} favorites`}
                                    >
                                        <Heart
                                            size={16}
                                            color={favoriteIds.includes(item.id) ? '#EF4444' : '#9CA3AF'}
                                            fill={favoriteIds.includes(item.id) ? '#EF4444' : 'none'}
                                            strokeWidth={2}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                ))}
                {filteredProducts.length === 0 && (
                    <View style={styles.emptyStateBox}>
                        <Text style={styles.emptyStateTitle}>No products found</Text>
                        <Text style={styles.emptyStateText}>Try another search or category.</Text>
                    </View>
                )}
            </ScrollView>

            <Modal
                visible={isFavoritesModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsFavoritesModalVisible(false)}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setIsFavoritesModalVisible(false)}
                >
                    <Pressable style={styles.modalContentSheet} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.dragIndicator} />

                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalHeadingTitle}>Favorites</Text>
                            <TouchableOpacity onPress={() => setIsFavoritesModalVisible(false)} style={styles.closeHitboxBtn}>
                                <Text style={styles.closeHitboxText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {favoriteProducts.length > 0 ? (
                            <ScrollView style={styles.cartItemsScroll} showsVerticalScrollIndicator={false}>
                                {favoriteProducts.map((item) => (
                                    <View key={item.id} style={styles.favoriteItemRow}>
                                        <View style={styles.cartItemInfoBlock}>
                                            <Text style={styles.cartItemName}>{item.name}</Text>
                                            <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
                                            <Text style={styles.cartItemPrice}>₦{item.price.toLocaleString()}</Text>
                                        </View>

                                        <View style={styles.favoriteModalActions}>
                                            <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                                                <Text style={styles.addBtnText}> + </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.favoriteCardButton, styles.favoriteCardButtonActive]}
                                                onPress={() => toggleFavorite(item)}
                                                activeOpacity={0.75}
                                                accessibilityLabel="Remove from favorites"
                                            >
                                                <Heart
                                                    size={16}
                                                    color="#EF4444"
                                                    fill="#EF4444"
                                                    strokeWidth={2}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        ) : (
                            <View style={styles.emptyStateBox}>
                                <Text style={styles.emptyStateTitle}>No favorites yet</Text>
                                <Text style={styles.emptyStateText}>Tap the heart on any item to save it here.</Text>
                            </View>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Floating Checkout Summary Bar (Updated to use your exact mathematical engine values) */}
            {financialSummary.totalQty > 0 && (
                <TouchableOpacity
                    style={styles.cartBar}
                    activeOpacity={0.9}
                    onPress={() => setIsCartModalVisible(true)}>
                    <View style={styles.cartBarLeft}>
                        <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>{financialSummary.totalQty}</Text>
                        </View>
                        <Text style={styles.cartBarText}>Cart</Text>
                    </View>
                    <Text style={styles.cartBarText}>Proceed • ₦{financialSummary.grandTotal.toLocaleString()}</Text>
                </TouchableOpacity>
            )}
            <Modal
                visible={isCartModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsCartModalVisible(false)}
            >
                {/* Click-away Overlay Backdrop */}
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setIsCartModalVisible(false)} // 👈 MINIMISES POPUP ON OUTSIDE CLICK
                >
                    {/* Modal Sheet Content Window Panel */}
                    <Pressable style={styles.modalContentSheet} onPress={(e) => e.stopPropagation()}>

                        {/* Top decorative drag accent layout handle */}
                        <View style={styles.dragIndicator} />

                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalHeadingTitle}>Review Cart</Text>
                            <TouchableOpacity onPress={() => setIsCartModalVisible(false)} style={styles.closeHitboxBtn}>
                                <Text style={styles.closeHitboxText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Scrollable Itemised Cart Item Records List */}
                        <ScrollView style={styles.cartItemsScroll} showsVerticalScrollIndicator={false}>
                            {cart.map((item) => (
                                <View key={item.id} style={styles.cartItemRow}>
                                    <View style={styles.cartItemInfoBlock}>
                                        <Text style={styles.cartItemName}>{item.name}</Text>
                                        <Text style={styles.cartItemPrice}>₦{(item.price * item.qty).toLocaleString()}</Text>
                                    </View>

                                    {/* Interactive Counter Stepper Controllers */}
                                    <View style={styles.quantityControlWrapper}>
                                        {/* Decrease Button */}
                                        <TouchableOpacity
                                            style={styles.qtyActionButton}
                                            onPress={() => handleUpdateCartQty(item.id, -1)}
                                        >
                                            <Text style={styles.qtyActionBtnText}>-</Text>
                                        </TouchableOpacity>

                                        <Text style={styles.qtyDisplayCountText}>{item.qty}</Text>

                                        {/* Increase Button */}
                                        <TouchableOpacity
                                            style={styles.qtyActionButton}
                                            onPress={() => handleUpdateCartQty(item.id, 1)}
                                        >
                                            <Text style={styles.qtyActionBtnText}>+</Text>
                                        </TouchableOpacity>

                                        {/* Delete Trash Icon Button */}
                                        <TouchableOpacity
                                            style={styles.qtyActionButton}
                                            onPress={() => handleRemoveCartItem(item.id)}
                                        >
                                            <Text style={styles.trashPurgeBtnText}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}

                            {/* Bill Details Summary Breakdowns Card */}
                            <View style={styles.popupBillingBox}>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Subtotal</Text>
                                    <Text style={styles.summaryValue}>₦{financialSummary.subtotal.toLocaleString()}</Text>
                                </View>

                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>VAT ({vatRate * 100}%)</Text>
                                    <Text style={styles.summaryValue}>₦{financialSummary.appliedVat.toLocaleString()}</Text>
                                </View>

                                {isDeliveryEnabled && (
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Logistics / Delivery Fee</Text>
                                        <Text style={styles.summaryValue}>₦{financialSummary.appliedDelivery.toLocaleString()}</Text>
                                    </View>
                                )}

                                <View style={styles.dividerLine} />

                                <View style={[styles.summaryRow, styles.totalRow]}>
                                    <Text style={styles.totalLabel}>Total Amount</Text>
                                    <Text style={styles.totalValue}>₦{financialSummary.grandTotal.toLocaleString()}</Text>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Master Checkout Trigger Button Action */}
                        <TouchableOpacity
                            style={[styles.modalCheckoutBtn, cart.length === 0 && styles.modalCheckoutBtnDisabled]}
                            disabled={cart.length === 0}
                            onPress={() => {
                                setIsCartModalVisible(false); // Clean minimize toggle
                                navigation.navigate('Checkout', { slug, storefrontId: storefront?.id || 0, table: scannedTableCode, cart });
                            }}
                        >
                            <Text style={styles.modalCheckoutBtnText}>Confirm & Proceed to Checkout</Text>
                        </TouchableOpacity>

                    </Pressable>
                </Pressable>
            </Modal>

            {/* Bottom Toolbar Popup Component (Assistance, Requests, Tips, Feedback, Events) */}
            <StorefrontToolbar
                storefrontId={storefront?.id}
                tableCode={scannedTableCode}
                vendor={vendor}
                weeklyEvents={weeklyEvents}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // container: {
    //     flex: 1,
    //     backgroundColor: '#FAFAFA',
    // },
    skeleton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '500',
    },
    header: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    vendorDesc: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    tableBadge: {
        backgroundColor: '#FEF3C7',
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
        marginTop: 10,
    },
    tableBadgeText: {
        color: '#D97706',
        fontSize: 12,
        fontWeight: '600',
    },
    categoryContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    categoryScroll: {
        paddingHorizontal: 16,
    },
    categoryPill: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activeCategoryPill: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FDE68A',
    },
    categoryText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500',
    },
    activeCategoryText: {
        color: '#B45309',
        fontWeight: '600',
    },
    menuList: {
        flex: 1,
    },
    productCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        flexDirection: 'row',
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    imgPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        resizeMode: 'cover',
    },
    placeholderIcon: {
        fontSize: 28,
    },
    productDetails: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'space-between',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
    },
    popularBadge: {
        backgroundColor: '#ECFDF5',
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 4,
    },
    popularBadgeText: {
        color: '#059669',
        fontSize: 10,
        fontWeight: 'bold',
    },
    productDesc: {
        fontSize: 12,
        color: '#9CA3AF',
        marginVertical: 4,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 12,
    },
    productPrice: {
        fontSize: 15,
        fontWeight: '700',
        color: '#6C63FF',
    },
    addBtn: {
        backgroundColor: '#6C63FF',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 50,

    },
    addBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    favoriteCardButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    favoriteCardButtonActive: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FCA5A5',
    },
    favoriteCardButtonText: {
        color: '#9CA3AF',
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 22,
    },
    favoriteCardButtonTextActive: {
        color: '#EF4444',
    },
    // Bill Details Summary Card Layouts
    summaryContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#4B5563',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937',
    },
    dividerLine: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 10,
    },
    totalRow: {
        paddingVertical: 4,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#6C63FF',
    },
    // Floating Basket Summary Bar Styles
    cartBar: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        backgroundColor: '#111827',
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        elevation: 4,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    cartBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    countBadge: {
        backgroundColor: '#6C63FF',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginRight: 8,
    },
    countBadgeText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    cartBarText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // Clean flat white canvas matching the screenshot
    },
    // Top Brand Section Layouts
    brandContainer: {
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    logoCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#111827',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 8,
    },
    logoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    logoInnerFallback: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoIconText: {
        fontSize: 24,
    },
    vendorName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    brandingSubtext: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    // Search Action Layout Mechanics
    searchRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginVertical: 12,
    },
    searchBarWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 25, // Perfectly pill-shaped outline
        paddingLeft: 16,
        paddingRight: 6,
        height: 46,
    },
    searchIconSymbol: {
        fontSize: 16,
        color: '#9CA3AF',
        marginRight: 8,
    },
    searchInputField: {
        flex: 1,
        fontSize: 14,
        color: '#1F2937',
        paddingVertical: 0, // Strips default native padding boundaries
    },
    headerIconButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
        position: 'relative',
    },
    headerButtonIconText: {
        fontSize: 15,
    },
    headerCountBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#6C63FF',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    headerCountBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
    // Category Elements Styles Structural Arrays
    sectionHeadingTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        paddingHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
    },
    categoryScrollWrapper: {
        backgroundColor: '#FFFFFF',
    },
    categoryScrollPadding: {
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    categorySquareCard: {
        width: 76,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 8,
        alignItems: 'center',
        marginRight: 10,
    },
    activeSquareCard: {
        borderColor: '#6C63FF', // Highlighting state outline adjustments
        backgroundColor: '#F5F3FF',
    },
    squareIconBox: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    squareBoxIconSymbol: {
        fontSize: 22,
    },
    squareCardLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: '#4B5563',
        textAlign: 'center',
    },
    activeSquareCardLabel: {
        color: '#6C63FF',
        fontWeight: '600',
    },
    // Core Scrolling Grid Paddings Override
    scrollPadding: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 110,
    },
    emptyCategoriesBox: {
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    emptyStateBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    emptyStateTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 6,
    },
    emptyStateText: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContentSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 40,
        maxHeight: '80%', // Accommodates the scrollable item list safely
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalHeadingTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    closeHitboxBtn: {
        padding: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 14,
    },
    closeHitboxText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6B7280',
    },
    cartItemsScroll: {
        marginVertical: 8,
    },
    cartItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    favoriteItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    favoriteModalActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cartItemInfoBlock: {
        flex: 1,
        marginRight: 12,
    },
    cartItemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    cartItemPrice: {
        fontSize: 13,
        color: '#6C63FF',
        fontWeight: '700',
        marginTop: 2,
    },
    quantityControlWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    qtyActionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyActionBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    qtyDisplayCountText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginHorizontal: 12,
        minWidth: 16,
        textAlign: 'center',
    },
    trashPurgeButton: {
        marginLeft: 12,
        padding: 6,
    },
    trashPurgeBtnText: {
        fontSize: 16,
    },
    popupBillingBox: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        padding: 16,
        marginTop: 16,
        marginBottom: 24,
    },
    modalCheckoutBtn: {
        backgroundColor: '#6C63FF',
        borderRadius: 12,
        paddingVertical: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCheckoutBtnDisabled: {
        backgroundColor: '#D1D5DB',
    },
    modalCheckoutBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

