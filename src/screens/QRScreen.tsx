import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  ScrollView,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import type { NavigationProp, RouteProps } from '../types';

interface Props {
  navigation: NavigationProp<'QR'>;
  route: RouteProps<'QR'>;
}

export default function QRScreen({ route }: Props) {
  const { slug, name } = route.params;
  const storeUrl = `https://scancode.ng/store/${slug}`;

  async function handleShare() {
    try {
      await Share.share({
        message: `Check out ${name} on ScanCode: ${storeUrl}`,
        url: storeUrl,
        title: name,
      });
    } catch {
      // user dismissed
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={styles.bg}>
      <View style={styles.card}>
        <Text style={styles.storeName}>{name}</Text>
        <Text style={styles.storeUrl} numberOfLines={1}>
          {storeUrl}
        </Text>

        <View style={styles.qrContainer}>
          <QRCode
            value={storeUrl}
            size={220}
            color="#111827"
            backgroundColor="#ffffff"
            ecl="M"
          />
        </View>

        <Text style={styles.hint}>
          Scan this code to visit your storefront page
        </Text>
      </View>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
        <Text style={styles.shareBtnText}>Share Link</Text>
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Your store link</Text>
        <Text style={styles.infoUrl} selectable>{storeUrl}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { padding: 20, paddingBottom: 40, alignItems: 'center' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  storeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  storeUrl: {
    fontSize: 12,
    color: '#6C63FF',
    marginBottom: 24,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  hint: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  shareBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  shareBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  infoTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  infoUrl: { fontSize: 14, color: '#6C63FF', lineHeight: 20 },
});
