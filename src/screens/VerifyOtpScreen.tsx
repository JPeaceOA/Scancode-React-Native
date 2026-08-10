import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { verifyOtp, resendOtp } from '../api';
import type { NavigationProp, RouteProps } from '../types';

interface Props {
  navigation: NavigationProp<'VerifyOtp'>;
  route: RouteProps<'VerifyOtp'>;
}

export default function VerifyOtpScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleVerify() {
    if (otp.trim().length !== 6) {
      setError('Please enter the 6-digit code from your email.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(email, otp.trim());
      // Verified — reset stack so back button can't return here
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setSuccess(null);
    setResending(true);
    try {
      await resendOtp(email);
      setSuccess('A new code has been sent to your email.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not resend code. Try again.');
    } finally {
      setResending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.brand}>ScanCode</Text>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code we sent to{'\n'}
            <Text style={styles.email}>{email}</Text>
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {success && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          )}

          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            placeholder="000000"
            placeholderTextColor="#9CA3AF"
            maxLength={6}
            editable={!loading}
            textAlign="center"
          />

          <TouchableOpacity
            style={[styles.button, (loading || otp.length < 6) && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading || otp.length < 6}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify Email</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendRow}
            onPress={handleResend}
            disabled={resending || loading}
          >
            {resending ? (
              <ActivityIndicator size="small" color="#6C63FF" />
            ) : (
              <>
                <Text style={styles.linkText}>Didn't get the code? </Text>
                <Text style={[styles.linkText, styles.linkAccent]}>Resend</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 48,
  },
  brand: {
    fontSize: 34,
    fontWeight: '800',
    color: '#6C63FF',
    textAlign: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  email: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#DC2626', fontSize: 14 },
  successBox: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successText: { color: '#065F46', fontSize: 14 },
  otpInput: {
    borderWidth: 2,
    borderColor: '#6C63FF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 18,
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginBottom: 20,
    letterSpacing: 12,
  },
  button: {
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  linkText: { fontSize: 14, color: '#6B7280' },
  linkAccent: { color: '#6C63FF', fontWeight: '600' },
});
