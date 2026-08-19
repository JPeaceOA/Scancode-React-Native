import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createOrder, getStoreConfig, getStorefrontBySlug, type OrderResponse, type StorefrontResponse } from '../../api';
import type { CartItem } from './StorefrontScreen';
import type { NavigationProp, RouteProps } from '../../types';

interface Props {
  navigation: NavigationProp<'Checkout'>;
  route: RouteProps<'Checkout'>;
}

export default function CheckoutScreen({ navigation, route }: Props) {
  const { slug, storefrontId: initialStorefrontId, cart: initialCart, table } = route.params;

  const [cart] = useState<CartItem[]>(initialCart || []);
  const [storefrontId, setStorefrontId] = useState<number | null>(initialStorefrontId || null);
  const [vendor, setVendor] = useState<{ name: string; bankName?: string; accountNumber?: string } | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [tableCode, setTableCode] = useState(table || '');

  const [vatRate, setVatRate] = useState(0.075);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<OrderResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStorefrontData() {
      try {
        setIsLoadingConfig(true);

        let activeStoreId = storefrontId;
        if (!activeStoreId) {
          const sf = await getStorefrontBySlug(slug);
          activeStoreId = sf.id;
          if (isMounted) {
            setStorefrontId(sf.id);
            setVendor({
              name: sf.name,
              bankName: (sf.data as any)?.bankName,
              accountNumber: (sf.data as any)?.accountNumber,
            });
          }
        } else {
          const sf = await getStorefrontBySlug(slug);
          if (isMounted) {
            setVendor({
              name: sf.name,
              bankName: (sf.data as any)?.bankName,
              accountNumber: (sf.data as any)?.accountNumber,
            });
          }
        }

        if (activeStoreId) {
          const config = await getStoreConfig(activeStoreId).catch(() => null);
          if (isMounted && config) {
            setVatRate(config.vatRate ?? 0.075);
            setDeliveryFee(config.deliveryFee ?? 0);
          }
        }
      } catch (err) {
        // Fall back to defaults
      } finally {
        if (isMounted) setIsLoadingConfig(false);
      }
    }

    loadStorefrontData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const vat = Math.round(subtotal * vatRate);
  const total = subtotal + vat + deliveryFee;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Your cart has no items.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      Alert.alert('Required Fields', 'Please enter your name and phone number.');
      return;
    }

    if (!storefrontId) {
      Alert.alert('Error', 'Storefront ID not available. Please try again.');
      return;
    }

    try {
      setIsSubmitting(true);
      const order = await createOrder(storefrontId, {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        items: cart.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
        subtotal,
        vat,
        delivery: deliveryFee,
        total,
        tableCode: tableCode.trim() || undefined,
      });

      setPlacedOrder(order);
    } catch (err: unknown) {
      Alert.alert(
        'Order Failed',
        err instanceof Error ? err.message : 'Could not place order. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const bankName = vendor?.bankName || 'Access Bank PLC';
  const accountNumber = vendor?.accountNumber || '0123456789';
  const accountName = vendor?.name || 'Store Management';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollPadding}>
          {placedOrder ? (
            <View style={styles.successWrapper}>
              <View style={styles.successIconBadge}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Order Placed Successfully!</Text>
              <Text style={styles.successSub}>
                Order #{placedOrder.id} is registered as <Text style={styles.statusBadge}>PENDING PAYMENT</Text>
              </Text>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Payment Due</Text>
                <Text style={styles.grandTotalText}>₦{placedOrder.total.toLocaleString()}</Text>

                <View style={styles.divider} />

                <Text style={styles.bankInstruction}>
                  Please transfer the exact total amount to the store account below:
                </Text>

                <View style={styles.bankBox}>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>Bank Name:</Text>
                    <Text style={styles.bankValue}>{bankName}</Text>
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>Account Number:</Text>
                    <Text style={styles.bankValueBold}>{accountNumber}</Text>
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>Account Name:</Text>
                    <Text style={styles.bankValue}>{accountName}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate('Storefront', { slug })}
              >
                <Text style={styles.primaryBtnText}>Return to Storefront</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>Order Summary</Text>

              <View style={styles.card}>
                {cart.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemSub}>₦{item.price.toLocaleString()} × {item.qty}</Text>
                    </View>
                    <Text style={styles.itemTotal}>₦{(item.price * item.qty).toLocaleString()}</Text>
                  </View>
                ))}

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>₦{subtotal.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>VAT ({(vatRate * 100).toFixed(1)}%)</Text>
                  <Text style={styles.summaryValue}>₦{vat.toLocaleString()}</Text>
                </View>
                {deliveryFee > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery Fee</Text>
                    <Text style={styles.summaryValue}>₦{deliveryFee.toLocaleString()}</Text>
                  </View>
                )}

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>₦{total.toLocaleString()}</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Customer Details</Text>

              <View style={styles.card}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="e.g. John Doe"
                  placeholderTextColor="#9CA3AF"
                  editable={!isSubmitting}
                />

                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  keyboardType="phone-pad"
                  placeholder="e.g. 08012345678"
                  placeholderTextColor="#9CA3AF"
                  editable={!isSubmitting}
                />

                <Text style={styles.label}>Email Address (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={customerEmail}
                  onChangeText={setCustomerEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                  editable={!isSubmitting}
                />

                <Text style={styles.label}>Table / Room Code (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={tableCode}
                  onChangeText={setTableCode}
                  placeholder="e.g. T-04"
                  placeholderTextColor="#9CA3AF"
                  editable={!isSubmitting}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, isSubmitting && styles.btnDisabled]}
                onPress={handlePlaceOrder}
                disabled={isSubmitting || isLoadingConfig}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Confirm & Pay ₦{total.toLocaleString()}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollPadding: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  itemSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 14, color: '#4B5563' },
  summaryValue: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#6C63FF' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB' },
  primaryBtn: { backgroundColor: '#6C63FF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  successWrapper: { alignItems: 'center', paddingVertical: 24 },
  successIconBadge: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  successIconText: { fontSize: 32, color: '#059669', fontWeight: 'bold' },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 6 },
  successSub: { fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 24 },
  statusBadge: { fontWeight: '700', color: '#D97706' },
  cardTitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  grandTotalText: { fontSize: 28, fontWeight: '800', color: '#6C63FF', textAlign: 'center', marginTop: 4 },
  bankInstruction: { fontSize: 13, color: '#4B5563', marginBottom: 12, lineHeight: 18 },
  bankBox: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12, gap: 6 },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bankLabel: { fontSize: 13, color: '#6B7280' },
  bankValue: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  bankValueBold: { fontSize: 14, fontWeight: '800', color: '#111827' },
});
