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
import type { NavigationProp, RouteProps } from '../../types';

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
      });
    } catch {
      // ignore
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.storeName}>{name}</Text>
          <Text style={styles.storeSlug}>/store/{slug}</Text>

          <View style={styles.qrBox}>
            <QRCode value={storeUrl} size={200} backgroundColor="#ffffff" color="#111827" />
          </View>

          <Text style={styles.instructionText}>
            Customers can scan this code with their smartphone camera to view your digital menu and place orders.
          </Text>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={styles.shareBtnText}>Share Storefront Link</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 20, justifyContent: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', elevation: 2 },
  storeName: { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 4 },
  storeSlug: { fontSize: 14, color: '#6C63FF', fontWeight: '600', marginBottom: 24 },
  qrBox: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
  instructionText: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18, marginBottom: 24 },
  shareBtn: { backgroundColor: '#6C63FF', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, width: '100%', alignItems: 'center' },
  shareBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
