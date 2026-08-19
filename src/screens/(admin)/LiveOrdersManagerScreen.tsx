import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import type { NavigationProp, RouteProps } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import ErrorBanner from '../../components/ErrorBanner';
import CustomButton from '../../components/CustomButton';
import { playOrderAlarmSound, playStatusChangeSound, getCustomAlarmUri, setCustomAlarmUri, initAudioAlert } from '../../utils/audioAlert';

export interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  options?: string;
}

export interface LiveOrder {
  id: number;
  orderNumber: string;
  tableNumber?: string;
  customerName?: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  items: OrderItem[];
}

interface Props {
  navigation: NavigationProp<'LiveOrdersManager'>;
  route: RouteProps<'LiveOrdersManager'>;
}

const MOCK_INITIAL_ORDERS: LiveOrder[] = [
  {
    id: 101,
    orderNumber: 'ORD-8821',
    tableNumber: 'Table 04',
    customerName: 'Alex Johnson',
    totalAmount: 42.50,
    status: 'PENDING',
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    items: [
      { id: 1, name: 'Truffle Burger Special', quantity: 2, price: 16.00, options: 'Extra Cheese' },
      { id: 2, name: 'Craft IPA Beer', quantity: 2, price: 5.25 },
    ],
  },
  {
    id: 102,
    orderNumber: 'ORD-8822',
    tableNumber: 'Table 12',
    customerName: 'Sarah Smith',
    totalAmount: 18.00,
    status: 'CONFIRMED',
    createdAt: new Date(Date.now() - 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    items: [
      { id: 3, name: 'Margherita Pizza', quantity: 1, price: 14.00 },
      { id: 4, name: 'Sparkling Water', quantity: 1, price: 4.00 },
    ],
  },
  {
    id: 103,
    orderNumber: 'ORD-8820',
    tableNumber: 'Takeout',
    customerName: 'Michael Brown',
    totalAmount: 29.90,
    status: 'REJECTED',
    createdAt: new Date(Date.now() - 30 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    items: [
      { id: 5, name: 'Chef Salad Bowl', quantity: 2, price: 14.95 },
    ],
  },
];

export default function LiveOrdersManagerScreen({ navigation, route }: Props) {
  const storefrontName = route.params?.name || 'Storefront';
  const [orders, setOrders] = useState<LiveOrder[]>(MOCK_INITIAL_ORDERS);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'REJECTED'>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [customToneUri, setCustomToneUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load persisted custom alarm tone on mount
  useEffect(() => {
    initAudioAlert().then(() => {
      setCustomToneUri(getCustomAlarmUri());
    });
  }, []);

  async function handlePickCustomTone() {
    try {
      // Attempt to use expo-document-picker if available
      let DocumentPicker: any = null;
      try {
        DocumentPicker = require('expo-document-picker');
      } catch {
        Alert.alert(
          'Not Available',
          'expo-document-picker is required to pick a custom tone. Run: expo install expo-document-picker',
        );
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const uri = asset.uri;
      await setCustomAlarmUri(uri);
      setCustomToneUri(uri);

      const fileName = asset.name || uri.split('/').pop() || 'custom tone';
      Alert.alert('Custom Tone Set', `"${fileName}" will be used for new order alarms.`);
    } catch (err) {
      Alert.alert('Error', 'Failed to pick audio file. Please try again.');
    }
  }

  async function handleClearCustomTone() {
    await setCustomAlarmUri(null);
    setCustomToneUri(null);
    Alert.alert('Tone Cleared', 'Order alarms will now use the default synthesized tone.');
  }

  function handleSoundToggle() {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    if (nextState) {
      playOrderAlarmSound();
    }
  }

  function handleTriggerTestOrder() {
    if (soundEnabled) {
      playOrderAlarmSound();
    }
    const newId = Date.now();
    const newOrder: LiveOrder = {
      id: newId,
      orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      tableNumber: `Table ${Math.floor(1 + Math.random() * 15)}`,
      customerName: 'Incoming Guest',
      totalAmount: 34.50,
      status: 'PENDING',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: [
        { id: newId + 1, name: 'Chef BBQ Ribs', quantity: 1, price: 26.50 },
        { id: newId + 2, name: 'Fresh Iced Tea', quantity: 2, price: 4.00 },
      ],
    };
    setOrders((prev) => [newOrder, ...prev]);
  }

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not refresh orders.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  function handleUpdateStatus(orderId: number, newStatus: 'CONFIRMED' | 'REJECTED' | 'CANCELLED') {
    const actionLabel =
      newStatus === 'CONFIRMED' ? 'Confirm' : newStatus === 'REJECTED' ? 'Reject' : 'Cancel';

    Alert.alert(
      `${actionLabel} Order`,
      `Are you sure you want to change order #${orderId} to ${newStatus}?`,
      [
        { text: 'Back', style: 'cancel' },
        {
          text: actionLabel,
          style: newStatus === 'CONFIRMED' ? 'default' : 'destructive',
          onPress: () => {
            if (soundEnabled) {
              playStatusChangeSound();
            }
            setOrders((prev) =>
              prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
            );
          },
        },
      ]
    );
  }

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'ALL') return true;
    return o.status === activeTab;
  });

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  function renderOrderCard({ item }: { item: LiveOrder }) {
    const isPending = item.status === 'PENDING';

    return (
      <View style={[styles.card, isPending && styles.pendingCardBorder]}>
        <View style={styles.cardHeader}>
          <View>
            <View style={styles.orderNumberRow}>
              <Text style={styles.orderNumber}>{item.orderNumber}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.orderSub}>
              {item.tableNumber ? `📍 ${item.tableNumber}` : '🛍️ Delivery / Takeout'}
              {item.customerName ? ` • ${item.customerName}` : ''}
            </Text>
          </View>
          <Text style={styles.timeText}>{item.createdAt}</Text>
        </View>

        <View style={styles.itemsList}>
          {item.items.map((it) => (
            <View key={it.id} style={styles.itemRow}>
              <Text style={styles.itemQty}>{it.quantity}x</Text>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{it.name}</Text>
                {it.options ? <Text style={styles.itemOpt}>{it.options}</Text> : null}
              </View>
              <Text style={styles.itemPrice}>${(it.price * it.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>
            Total: <Text style={styles.totalValue}>${item.totalAmount.toFixed(2)}</Text>
          </Text>

          {isPending ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.btnAction, styles.rejectBtn]}
                onPress={() => handleUpdateStatus(item.id, 'REJECTED')}
              >
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnAction, styles.confirmBtn]}
                onPress={() => handleUpdateStatus(item.id, 'CONFIRMED')}
              >
                <Text style={styles.confirmText}>Confirm Order</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => handleUpdateStatus(item.id, 'CANCELLED')}
            >
              <Text style={styles.cancelLinkText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{storefrontName}</Text>
          <Text style={styles.headerSubtitle}>
            {pendingCount > 0
              ? `🔔 ${pendingCount} Pending Order${pendingCount > 1 ? 's' : ''}`
              : 'All orders up to date'}
          </Text>
        </View>

        <View style={styles.headerRightControls}>
          <TouchableOpacity
            style={styles.testSoundBtn}
            onPress={handleTriggerTestOrder}
          >
            <Text style={styles.testSoundText}>⚡ Test Alarm</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.soundBtn, soundEnabled && styles.soundBtnActive]}
            onPress={handleSoundToggle}
          >
            <Text style={styles.soundText}>{soundEnabled ? '🔊 Sound On' : '🔇 Muted'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toneBtn}
            onPress={customToneUri ? handleClearCustomTone : handlePickCustomTone}
            activeOpacity={0.8}
          >
            <Text style={styles.toneBtnText}>
              {customToneUri ? '🎵 Custom ✓' : '🎵 Set Tone'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {(['ALL', 'PENDING', 'CONFIRMED', 'REJECTED'] as const).map((tab) => {
          const active = activeTab === tab;
          const count =
            tab === 'ALL' ? orders.length : orders.filter((o) => o.status === tab).length;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? <ErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOrderCard}
        contentContainerStyle={[styles.list, filteredOrders.length === 0 && styles.listEmpty]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOrders(true)}
            tintColor="#6C63FF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} orders</Text>
            <Text style={styles.emptySubtitle}>
              New incoming customer orders will appear here automatically.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  headerRightControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  testSoundBtn: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  testSoundText: { fontSize: 12, fontWeight: '700', color: '#4F46E5' },
  toneBtn: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  toneBtnText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  soundBtn: { backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  soundBtnActive: { backgroundColor: '#E0E7FF' },
  soundText: { fontSize: 12, fontWeight: '600', color: '#3730A3' },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F3F4F6' },
  tabItemActive: { backgroundColor: '#6C63FF' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  tabTextActive: { color: '#FFFFFF' },
  list: { padding: 16, gap: 12 },
  listEmpty: { flex: 1 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  pendingCardBorder: { borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderNumberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderNumber: { fontSize: 16, fontWeight: '800', color: '#111827' },
  orderSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  timeText: { fontSize: 12, color: '#9CA3AF' },
  itemsList: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F3F4F6', paddingVertical: 8, marginVertical: 8, gap: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemQty: { fontWeight: '700', color: '#6C63FF', width: 28, fontSize: 13 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 14, color: '#111827', fontWeight: '500' },
  itemOpt: { fontSize: 12, color: '#6B7280' },
  itemPrice: { fontSize: 13, fontWeight: '600', color: '#3730A3' },
  cardFooter: { marginTop: 4 },
  totalLabel: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  actionRow: { flexDirection: 'row', gap: 10 },
  btnAction: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  rejectBtn: { backgroundColor: '#FEE2E2' },
  rejectText: { color: '#DC2626', fontWeight: '700', fontSize: 14 },
  confirmBtn: { backgroundColor: '#059669' },
  confirmText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  cancelLink: { alignSelf: 'flex-end' },
  cancelLinkText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#4B5563', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});
