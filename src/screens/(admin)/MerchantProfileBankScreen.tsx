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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '../../types';
import { getBusinessProfileData, saveBusinessProfileData } from '../../api';

export default function MerchantProfileBankScreen() {
  const navigation = useNavigation<NavigationProp<'MerchantProfileBank'>>();

  const [businessName, setBusinessName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await getBusinessProfileData();
      if (data.name) setBusinessName(data.name);
      if (data.bankName) setBankName(data.bankName);
      if (data.accountName) setAccountName(data.accountName);
      if (data.accountNumber) setAccountNumber(data.accountNumber);
    } catch {
      // ignore parse or load errors
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      Alert.alert('Required Fields', 'Please fill in your Bank Name, Account Name, and Account Number.');
      return;
    }

    try {
      setIsSaving(true);
      setFeedbackMsg(null);
      await saveBusinessProfileData({
        name: businessName.trim(),
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
      });
      setFeedbackMsg({ type: 'success', text: 'Business bank details saved successfully!' });
      setTimeout(() => {
        navigation.goBack();
      }, 1200);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to save profile details.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#126B33" />
        <Text style={styles.loadingText}>Loading profile details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.infoBanner}>
          <Text style={styles.infoIcon}>🏦</Text>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Payment Account Details</Text>
            <Text style={styles.infoSub}>
              These bank details are displayed to customers on your storefront toolbar when they send tips or custom service requests.
            </Text>
          </View>
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
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Business Name</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="e.g. Ocean Breeze Restaurant"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Bank Name *</Text>
            <TextInput
              style={styles.input}
              value={bankName}
              onChangeText={setBankName}
              placeholder="e.g. Access Bank, GTBank, Zenith"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Account Name *</Text>
            <TextInput
              style={styles.input}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="e.g. Ocean Breeze Enterprise"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Account Number *</Text>
            <TextInput
              style={styles.input}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="e.g. 0123456789"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>
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
            <Text style={styles.saveBtnText}>Save Account Details</Text>
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
  infoBanner: { flexDirection: 'row', backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16, alignItems: 'flex-start' },
  infoIcon: { fontSize: 24, marginRight: 12 },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#065F46', marginBottom: 2 },
  infoSub: { fontSize: 12, color: '#047857', lineHeight: 18 },
  feedbackBox: { padding: 14, borderRadius: 12, marginBottom: 16 },
  feedbackSuccess: { backgroundColor: '#DEF7EC', borderColor: '#BCF0DA', borderWidth: 1 },
  feedbackError: { backgroundColor: '#FDE8E8', borderColor: '#FBD5D5', borderWidth: 1 },
  feedbackText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  feedbackSuccessText: { color: '#03543F' },
  feedbackErrorText: { color: '#9B1C1C' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827' },
  saveBtn: { backgroundColor: '#6C63FF', borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { backgroundColor: '#9CA3AF' },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
