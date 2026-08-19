import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import type { NavigationProp, RouteProps } from '../../types';
import ErrorBanner from '../../components/ErrorBanner';
import {
  getStorefrontWaiterCalls,
  getStorefrontRequests,
  getStorefrontTips,
  acknowledgeWaiterCall,
  acknowledgeStoreRequest,
  acknowledgeTip,
  type WaiterCallRecord,
  type StoreRequestRecord,
  type TipRecord,
} from '../../api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'WAITER_CALLS' | 'REQUESTS' | 'TIPS';

interface Props {
  navigation: NavigationProp<'ToolbarRequestsAdmin'>;
  route: RouteProps<'ToolbarRequestsAdmin'>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatMoney(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

function requestTypeLabel(type: StoreRequestRecord['requestType']): string {
  switch (type) {
    case 'SHOUTOUT': return '📢 Shoutout';
    case 'SONG':     return '🎵 Song';
    case 'KARAOKE':  return '🎤 Karaoke';
  }
}

function recipientLabel(tip: TipRecord): string {
  if (tip.recipient === 'OTHER' && tip.customRecipient) return tip.customRecipient;
  return tip.recipient.charAt(0) + tip.recipient.slice(1).toLowerCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: 'PENDING' | 'ACKNOWLEDGED' }) {
  const isPending = status === 'PENDING';
  return (
    <View style={[styles.pill, isPending ? styles.pillPending : styles.pillAck]}>
      <Text style={[styles.pillText, isPending ? styles.pillTextPending : styles.pillTextAck]}>
        {isPending ? '🔔 Pending' : '✓ Acknowledged'}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ToolbarRequestsAdminScreen({ route }: Props) {
  const { storefrontId, name } = route.params;
  const storefrontName = name || 'Storefront';

  const [activeTab, setActiveTab] = useState<Tab>('WAITER_CALLS');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [waiterCalls, setWaiterCalls] = useState<WaiterCallRecord[]>([]);
  const [requests, setRequests] = useState<StoreRequestRecord[]>([]);
  const [tips, setTips] = useState<TipRecord[]>([]);

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const loadAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [calls, reqs, tipData] = await Promise.all([
        getStorefrontWaiterCalls(storefrontId),
        getStorefrontRequests(storefrontId),
        getStorefrontTips(storefrontId),
      ]);
      setWaiterCalls(calls);
      setRequests(reqs);
      setTips(tipData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load activity.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storefrontId]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  // ─── Acknowledge Handlers ───────────────────────────────────────────────────

  const handleAckCall = (item: WaiterCallRecord) => {
    if (item.status === 'ACKNOWLEDGED') return;
    Alert.alert(
      'Acknowledge Call',
      `Mark the call from ${item.tableNumber} as acknowledged?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Acknowledge',
          onPress: async () => {
            try {
              await acknowledgeWaiterCall(storefrontId, item.id);
              setWaiterCalls((prev) =>
                prev.map((c) => c.id === item.id ? { ...c, status: 'ACKNOWLEDGED' } : c)
              );
            } catch {
              Alert.alert('Error', 'Failed to acknowledge. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleAckRequest = (item: StoreRequestRecord) => {
    if (item.status === 'ACKNOWLEDGED') return;
    Alert.alert(
      'Acknowledge Request',
      `Mark this ${item.requestType.toLowerCase()} request as acknowledged?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Acknowledge',
          onPress: async () => {
            try {
              await acknowledgeStoreRequest(storefrontId, item.id);
              setRequests((prev) =>
                prev.map((r) => r.id === item.id ? { ...r, status: 'ACKNOWLEDGED' } : r)
              );
            } catch {
              Alert.alert('Error', 'Failed to acknowledge. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleAckTip = (item: TipRecord) => {
    if (item.status === 'ACKNOWLEDGED') return;
    Alert.alert(
      'Acknowledge Tip',
      `Confirm receipt of ${formatMoney(item.amount)} tip for ${recipientLabel(item)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Receipt',
          onPress: async () => {
            try {
              await acknowledgeTip(storefrontId, item.id);
              setTips((prev) =>
                prev.map((t) => t.id === item.id ? { ...t, status: 'ACKNOWLEDGED' } : t)
              );
            } catch {
              Alert.alert('Error', 'Failed to acknowledge. Please try again.');
            }
          },
        },
      ]
    );
  };

  // ─── Badge Counts ───────────────────────────────────────────────────────────

  const pendingCalls    = waiterCalls.filter((c) => c.status === 'PENDING').length;
  const pendingRequests = requests.filter((r) => r.status === 'PENDING').length;
  const pendingTips     = tips.filter((t) => t.status === 'PENDING').length;

  const TAB_CONFIG: { key: Tab; label: string; emoji: string; count: number }[] = [
    { key: 'WAITER_CALLS', label: 'Calls',    emoji: '🔔', count: pendingCalls },
    { key: 'REQUESTS',     label: 'Requests', emoji: '🎵', count: pendingRequests },
    { key: 'TIPS',         label: 'Tips',     emoji: '💸', count: pendingTips },
  ];

  // ─── Render Functions ───────────────────────────────────────────────────────

  const renderCallCard = ({ item }: { item: WaiterCallRecord }) => (
    <View style={[styles.card, item.status === 'PENDING' && styles.cardPending]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardTitle}>📍 {item.tableNumber}</Text>
          <Text style={styles.cardSubtitle}>{item.callTarget}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          <StatusPill status={item.status} />
        </View>
      </View>

      <Text style={styles.cardBody}>{item.message}</Text>

      {item.status === 'PENDING' && (
        <TouchableOpacity
          style={styles.ackBtn}
          onPress={() => handleAckCall(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.ackBtnText}>✓ Mark as Acknowledged</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderRequestCard = ({ item }: { item: StoreRequestRecord }) => (
    <View style={[styles.card, item.status === 'PENDING' && styles.cardPending]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardTitle}>{requestTypeLabel(item.requestType)}</Text>
          {item.amount > 0 && (
            <Text style={styles.amountChip}>{formatMoney(item.amount)}</Text>
          )}
        </View>
        <View style={styles.cardHeaderRight}>
          <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          <StatusPill status={item.status} />
        </View>
      </View>

      <Text style={styles.cardBody}>{item.details}</Text>

      {item.status === 'PENDING' && (
        <TouchableOpacity
          style={styles.ackBtn}
          onPress={() => handleAckRequest(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.ackBtnText}>✓ Mark as Acknowledged</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTipCard = ({ item }: { item: TipRecord }) => (
    <View style={[styles.card, item.status === 'PENDING' && styles.cardPending]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardTitle}>💸 {formatMoney(item.amount)}</Text>
          <Text style={styles.cardSubtitle}>For: {recipientLabel(item)}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          <StatusPill status={item.status} />
        </View>
      </View>

      {item.status === 'PENDING' && (
        <TouchableOpacity
          style={[styles.ackBtn, styles.ackBtnTip]}
          onPress={() => handleAckTip(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.ackBtnText}>✓ Confirm Tip Received</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const currentData =
    activeTab === 'WAITER_CALLS' ? waiterCalls :
    activeTab === 'REQUESTS' ? requests : tips;

  const renderItem = ({ item }: { item: WaiterCallRecord | StoreRequestRecord | TipRecord }) => {
    if (activeTab === 'WAITER_CALLS') return renderCallCard({ item: item as WaiterCallRecord });
    if (activeTab === 'REQUESTS')     return renderRequestCard({ item: item as StoreRequestRecord });
    return renderTipCard({ item: item as TipRecord });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{storefrontName}</Text>
          <Text style={styles.headerSubtitle}>
            {pendingCalls + pendingRequests + pendingTips > 0
              ? `${pendingCalls + pendingRequests + pendingTips} pending item(s) need attention`
              : 'All activity acknowledged ✓'}
          </Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TAB_CONFIG.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.emoji} {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading activity...</Text>
        </View>
      ) : (
        <FlatList
          data={currentData as any[]}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={renderItem as any}
          contentContainerStyle={[
            styles.list,
            currentData.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadAll(true)}
              tintColor="#6C63FF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>
                {activeTab === 'WAITER_CALLS' ? '🔔' : activeTab === 'REQUESTS' ? '🎵' : '💸'}
              </Text>
              <Text style={styles.emptyTitle}>No {activeTab === 'WAITER_CALLS' ? 'calls' : activeTab === 'REQUESTS' ? 'requests' : 'tips'} yet</Text>
              <Text style={styles.emptySubtitle}>
                Customer activity from the Storefront Toolbar will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },

  // Header
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

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  tabItemActive: { backgroundColor: '#6C63FF' },
  tabLabel: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
  tabLabelActive: { color: '#FFFFFF' },
  tabBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },

  // List
  list: { padding: 16, gap: 12 },
  listEmpty: { flex: 1 },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
  },
  cardPending: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: { flex: 1, gap: 3 },
  cardHeaderRight: { alignItems: 'flex-end', gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  cardSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  cardBody: { fontSize: 14, color: '#374151', lineHeight: 20 },
  timeText: { fontSize: 11, color: '#9CA3AF' },

  amountChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    color: '#059669',
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },

  // Status pills
  pill: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  pillPending: { backgroundColor: '#FEF3C7' },
  pillAck: { backgroundColor: '#D1FAE5' },
  pillText: { fontSize: 11, fontWeight: '700' },
  pillTextPending: { color: '#92400E' },
  pillTextAck: { color: '#065F46' },

  // Acknowledge button
  ackBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ackBtnTip: { backgroundColor: '#059669' },
  ackBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  // States
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 10, fontSize: 14, color: '#6B7280' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 19 },
});
