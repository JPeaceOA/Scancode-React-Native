import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NavigationProp, RouteProps } from '../../types';
import CustomButton from '../../components/CustomButton';
import ErrorBanner from '../../components/ErrorBanner';

let CameraView: any = null;
let useCameraPermissions: any = null;
try {
  const expoCam = require('expo-camera');
  CameraView = expoCam.CameraView;
  useCameraPermissions = expoCam.useCameraPermissions;
} catch {
  // Fallback if expo-camera is unavailable
}

interface Props {
  navigation: NavigationProp<'CameraQRScanner'>;
  route: RouteProps<'CameraQRScanner'>;
}

export default function CameraQRScannerScreen({ navigation, route }: Props) {
  const cameraHook = useCameraPermissions ? useCameraPermissions() : [null, () => {}];
  const permission = cameraHook[0];
  const requestPermission = cameraHook[1];

  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (useCameraPermissions && !permission) {
      requestPermission();
    }
  }, [permission]);

  function processQrData(data: string) {
    if (scanned) return;
    setScanned(true);

    try {
      let slug = '';
      let tableCode = '';

      if (data.includes('http') || data.includes('/store/')) {
        const urlParts = data.split('/store/');
        if (urlParts.length > 1) {
          const pathAndQuery = urlParts[1].split('?');
          slug = pathAndQuery[0].replace(/\/$/, '');
          const query = pathAndQuery[1];
          if (query && query.includes('table=')) {
            tableCode = new URLSearchParams(query).get('table') || '';
          }
        }
      } else if (data.includes(':')) {
        const parts = data.split(':');
        slug = parts[0].trim();
        tableCode = parts[1].trim();
      } else {
        slug = data.trim();
      }

      if (!slug) {
        throw new Error('Invalid QR code format. Could not detect a valid storefront.');
      }

      Alert.alert(
        'QR Code Scanned!',
        `Store: ${slug}${tableCode ? ` | Table: ${tableCode}` : ''}`,
        [
          {
            text: 'Open Menu',
            onPress: () => {
              navigation.navigate('Storefront', { slug, tableCode });
            },
          },
          {
            text: 'Scan Again',
            style: 'cancel',
            onPress: () => setScanned(false),
          },
        ]
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unrecognized QR code.';
      setError(msg);
      setTimeout(() => setScanned(false), 2500);
    }
  }

  function handleManualSubmit() {
    if (!manualCode.trim()) {
      setError('Please enter a store code or slug.');
      return;
    }
    const cleanCode = manualCode.trim();
    navigation.navigate('Storefront', { slug: cleanCode });
  }

  function handleTestMockScan() {
    processQrData('https://scancode.app/store/sample-bistro?table=Table08');
  }

  const renderCameraViewfinder = () => {
    if (CameraView && permission?.granted) {
      return (
        <CameraView
          style={StyleSheet.absoluteFill}
          enableTorch={torch}
          onBarcodeScanned={scanned ? undefined : ({ data }: { data: string }) => processQrData(data)}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        >
          <View style={styles.overlay}>
            <View style={styles.targetFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.instructionText}>
              Align physical table QR code inside the frame
            </Text>
          </View>
        </CameraView>
      );
    }

    return (
      <View style={[StyleSheet.absoluteFill, styles.simulatedViewfinder]}>
        <View style={styles.targetFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.instructionText}>
          {permission && !permission.granted
            ? 'Camera permission denied'
            : 'Camera Viewfinder Active (Simulator Mode)'}
        </Text>
        <TouchableOpacity style={styles.mockScanBtn} onPress={handleTestMockScan}>
          <Text style={styles.mockScanText}>⚡ Simulate QR Scan (Sample Bistro)</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>{renderCameraViewfinder()}</View>

      <View style={styles.controlsPanel}>
        {error ? <ErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.torchBtn, torch && styles.torchBtnActive]}
            onPress={() => setTorch(!torch)}
          >
            <Text style={[styles.torchText, torch && styles.torchTextActive]}>
              {torch ? '🔦 Flash On' : '💡 Flash Off'}
            </Text>
          </TouchableOpacity>

          {scanned && (
            <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
              <Text style={styles.rescanText}>Tap to Scan Again</Text>
            </TouchableOpacity>
          )}

          {permission && !permission.granted && (
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permText}>Grant Camera</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.manualCard}>
          <Text style={styles.manualTitle}>Or Enter Store Code Manually</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.manualInput}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="e.g. sample-bistro"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.goBtn} onPress={handleManualSubmit}>
              <Text style={styles.goBtnText}>Go</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  cameraContainer: { flex: 2, position: 'relative' },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', alignItems: 'center', justifyContent: 'center' },
  simulatedViewfinder: { backgroundColor: '#1E1B4B', alignItems: 'center', justifyContent: 'center' },
  targetFrame: { width: 240, height: 240, position: 'relative', justifyContent: 'space-between' },
  corner: { position: 'absolute', width: 32, height: 32, borderColor: '#6C63FF' },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  mockScanBtn: { marginTop: 18, backgroundColor: '#6C63FF', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  mockScanText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  controlsPanel: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 },
  torchBtn: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  torchBtnActive: { backgroundColor: '#FEF3C7' },
  torchText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  torchTextActive: { color: '#92400E' },
  rescanBtn: { backgroundColor: '#6C63FF', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  rescanText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  permBtn: { backgroundColor: '#EF4444', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  permText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  manualCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  manualTitle: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 8 },
  manualInput: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#111827' },
  goBtn: { backgroundColor: '#6C63FF', borderRadius: 8, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' },
  goBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
