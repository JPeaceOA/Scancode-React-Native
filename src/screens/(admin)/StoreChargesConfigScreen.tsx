import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProps } from '../../types';
import { getStoreConfig, updateStoreConfig } from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StoreChargesConfigScreen() {
  const navigation = useNavigation<NavigationProp<'StoreChargesConfig'>>();
  const route = useRoute<RouteProps<'StoreChargesConfig'>>();
  const { storefrontId } = route.params;

  const [vatRateInput, setVatRateInput] = useState('7.5');
  const [logisticsFeeInput, setLogisticsFeeInput] = useState('2000');
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, [storefrontId]);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      if (storefrontId) {
        const config = await getStoreConfig(storefrontId);
        if (config.vatRate !== undefined && config.vatRate !== null) {
          const pct = config.vatRate > 1 ? config.vatRate : config.vatRate * 100;
          setVatRateInput(pct.toString());
        }
        if (config.deliveryFee !== undefined && config.deliveryFee !== null) {
          setLogisticsFeeInput(config.deliveryFee.toString());
          if (config.deliveryFee === 0) {
            setDeliveryEnabled(false);
          }
        }
      }
    } catch {
      // Use defaults
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const rawVat = parseFloat(vatRateInput.trim());
    const rawDelivery = parseFloat(logisticsFeeInput.trim());

    if (isNaN(rawVat) || rawVat < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid VAT percentage (e.g. 7.5).');
      return;
    }

    if (isNaN(rawDelivery) || rawDelivery < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid logistics/delivery fee amount.');
      return;
    }

    const vatFraction = rawVat > 1 ? rawVat / 100 : rawVat;
    const finalDeliveryFee = deliveryEnabled ? rawDelivery : 0;

    try {
      setIsSaving(true);
      setFeedbackMsg(null);

      if (storefrontId) {
        await updateStoreConfig(storefrontId, {
          vatRate: vatFraction,
          deliveryFee: finalDeliveryFee,
          deliveryEnabled,
        });
      }

      await AsyncStorage.setItem(
        'global_store_rules',
        JSON.stringify({
          vatRate: vatFraction,
          logisticsFee: finalDeliveryFee,
          deliveryEnabled,
        })
      );

      setFeedbackMsg({ type: 'success', text: 'Store charges & VAT settings updated!' });
      setTimeout(() => {
        navigation.goBack();
      }, 1200);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to save store settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading store charges configuration...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerCard}>
          <Text style={styles.headerIcon}>⚙️</Text>
          <Text style={styles.headerTitle}>Store Charges & Tax Settings</Text>
          <Text style={styles.headerSub}>
            Configure VAT rates and delivery/logistics fees applied during customer checkout and receipts.
          </Text>
        </View>

        {feedbackMsg && (
          <View
            style={[
              styles.feedbackBox,
              feedbackMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
            ]}
          >
            <Text
              style={[
                styles.feedbackText,
                feedbackMsg.type === 'success' ? styles.feedbackSuccessText : styles.feedbackErrorText,
              ]}
            >
              {feedbackMsg.text}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Value Added Tax (VAT)</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>VAT Percentage (%)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={vatRateInput}
                onChangeText={setVatRateInput}
                placeholder="7.5"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />
              <Text style={styles.unitText}>%</Text>
            </View>
            <Text style={styles.fieldHelp}>
              Standard VAT rate (e.g. 7.5%). Enter 0 to disable VAT calculation.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.toggleHeaderRow}>
            <View style={styles.toggleLabelContainer}>
              <Text style={styles.sectionTitle}>Delivery / Logistics Fee</Text>
              <Text style={styles.fieldHelp}>
                Enable for delivery orders, or disable for hotels, bars, and dine-in venues.
              </Text>
            </View>
            <Switch
              value={deliveryEnabled}
              onValueChange={setDeliveryEnabled}
              trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
              thumbColor={deliveryEnabled ? '#6C63FF' : '#F3F4F6'}
            />
          </View>

          {deliveryEnabled && (
            <View style={[styles.fieldGroup, { marginTop: 16 }]}>
              <Text style={styles.label}>Default Delivery Fee (₦)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>₦</Text>
                <TextInput
                  style={[styles.input, { paddingLeft: 32 }]}
                  value={logisticsFeeInput}
                  onChangeText={setLogisticsFeeInput}
                  placeholder="2000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                />
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save Store Charges</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#4B5563' },
  scrollContent: { padding: 20 },
  headerCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 16, alignItems: 'center', elevation: 2 },
  headerIcon: { fontSize: 32, marginBottom: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 },
  headerSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
  feedbackBox: { padding: 14, borderRadius: 12, marginBottom: 16 },
  feedbackSuccess: { backgroundColor: '#DEF7EC', borderColor: '#BCF0DA', borderWidth: 1 },
  feedbackError: { backgroundColor: '#FDE8E8', borderColor: '#FBD5D5', borderWidth: 1 },
  feedbackText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  feedbackSuccessText: { color: '#03543F' },
  feedbackErrorText: { color: '#9B1C1C' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 },
  fieldGroup: { marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputWrapper: { position: 'relative', justifyContent: 'center' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827' },
  unitText: { position: 'absolute', right: 14, fontSize: 14, fontWeight: '700', color: '#6B7280' },
  currencyPrefix: { position: 'absolute', left: 14, zIndex: 1, fontSize: 14, fontWeight: '700', color: '#6B7280' },
  fieldHelp: { fontSize: 12, color: '#6B7280', marginTop: 6, lineHeight: 16 },
  toggleHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabelContainer: { flex: 1, marginRight: 12 },
  saveBtn: { backgroundColor: '#6C63FF', borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveBtnDisabled: { backgroundColor: '#9CA3AF' },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
