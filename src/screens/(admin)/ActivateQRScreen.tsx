import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { initializePayment, verifyPayment } from '../../api';
import type { NavigationProp, RouteProps } from '../../types';

interface Props {
  navigation: NavigationProp<'ActivateQR'>;
  route: RouteProps<'ActivateQR'>;
}

type Step = 'idle' | 'initializing' | 'waiting' | 'verifying' | 'success' | 'error';

export default function ActivateQRScreen({ navigation, route }: Props) {
  const { slug, name } = route.params;
  const [step, setStep] = useState<Step>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txRef, setTxRef] = useState<string | null>(null);

  async function handlePay() {
    setErrorMsg(null);
    setStep('initializing');

    let initRes: { authorizationUrl: string; reference: string };
    try {
      initRes = await initializePayment('STOREFRONT_CREATION', slug);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not initialize payment.';
      setErrorMsg(msg);
      setStep('error');
      return;
    }

    setTxRef(initRes.reference);
    setStep('waiting');

    try {
      const result = await WebBrowser.openAuthSessionAsync(
        initRes.authorizationUrl,
        'scancode://payment-complete',
      );

      if (result.type === 'cancel' || result.type === 'dismiss') {
        setStep('waiting');
        Alert.alert(
          'Payment Pending',
          'Did you complete the payment in the browser?',
          [
            { text: 'No, cancel', style: 'cancel', onPress: () => setStep('idle') },
            { text: 'Yes, verify', onPress: () => handleVerify(initRes.reference) },
          ],
        );
        return;
      }

      await handleVerify(initRes.reference);
    } catch {
      handleVerify(initRes.reference);
    }
  }

  async function handleVerify(reference: string) {
    setStep('verifying');
    setErrorMsg(null);
    try {
      const res: any = await verifyPayment(reference);
      if (res.paid || res.status === 'SUCCESSFUL' || res.status === 'success') {
        setStep('success');
      } else {
        setErrorMsg('Payment verification incomplete. If you paid, try verifying again.');
        setStep('error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification error.';
      setErrorMsg(msg);
      setStep('error');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.badgeText}>QR ACTIVATION</Text>
          <Text style={styles.storeName}>{name}</Text>

          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>One-time Activation Fee</Text>
            <Text style={styles.priceAmount}>₦15,000</Text>
          </View>

          <View style={styles.featureList}>
            <Text style={styles.featureItem}>✓ Unlimited Digital QR Table Codes</Text>
            <Text style={styles.featureItem}>✓ Real-time Order Management</Text>
            <Text style={styles.featureItem}>✓ Paid Customer Requests & Tips</Text>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {step === 'success' ? (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>🎉 QR Code Activated!</Text>
              <Text style={styles.successSub}>Your storefront is now live and published.</Text>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => navigation.navigate('QR', { slug, name })}
              >
                <Text style={styles.btnText}>View QR Code</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.btn, (step === 'initializing' || step === 'verifying') && styles.btnDisabled]}
              onPress={handlePay}
              disabled={step === 'initializing' || step === 'verifying'}
            >
              {step === 'initializing' || step === 'verifying' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.btnText}>
                  {step === 'waiting' ? 'Verify Payment' : 'Pay ₦15,000 with Paystack'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 20, justifyContent: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, elevation: 2 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#6C63FF', letterSpacing: 1, marginBottom: 4 },
  storeName: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 16 },
  priceBox: { backgroundColor: '#F5F3FF', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  priceLabel: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  priceAmount: { fontSize: 28, fontWeight: '800', color: '#6C63FF' },
  featureList: { gap: 8, marginBottom: 20 },
  featureItem: { fontSize: 14, color: '#374151', fontWeight: '500' },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: '#DC2626', fontSize: 13 },
  successBox: { backgroundColor: '#D1FAE5', borderRadius: 12, padding: 16, alignItems: 'center' },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#065F46', marginBottom: 4 },
  successSub: { fontSize: 13, color: '#047857', marginBottom: 12 },
  btn: { backgroundColor: '#6C63FF', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
