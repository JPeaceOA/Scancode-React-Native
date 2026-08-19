// =========================================================================
// DEV TEST & DEMO CONTROL PANEL
// TO REMOVE AFTER TESTING: Simply delete this file or remove <DevTestBanner /> from DashboardScreen.tsx
// =========================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { demoEngine } from '../demo/demoEngine';

interface Props {
  onRoleChange?: (role: 'admin' | 'customer' | 'logged_out') => void;
}

export default function DevTestBanner({ onRoleChange }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isDemo, setIsDemo] = useState(demoEngine.isDemoModeEnabled());
  const [activeRole, setActiveRole] = useState<'admin' | 'customer' | 'logged_out'>(
    demoEngine.getActiveRole(),
  );

  useEffect(() => {
    setIsDemo(demoEngine.isDemoModeEnabled());
    setActiveRole(demoEngine.getActiveRole());
  }, []);

  async function toggleDemoMode() {
    const next = !isDemo;
    setIsDemo(next);
    await demoEngine.setDemoModeEnabled(next);
    Alert.alert(
      'Demo Mode Toggled',
      next
        ? 'Demo Mode is now ACTIVE. Requests will return local mock data.'
        : 'Demo Mode is now OFF. Requests will hit the live API server (http://192.168.1.155:8082).',
    );
  }

  async function switchRole(role: 'admin' | 'customer' | 'logged_out') {
    setActiveRole(role);
    await demoEngine.setActiveRole(role);
    if (onRoleChange) {
      onRoleChange(role);
    }
  }

  async function handleResetData() {
    await demoEngine.resetDemoState();
    Alert.alert('Reset Complete', 'Demo data has been restored to default values.');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.badge}>DEMO CONTROL PANEL</Text>
        <TouchableOpacity style={styles.modeToggle} onPress={toggleDemoMode}>
          <Text style={styles.modeToggleText}>
            Mode: <Text style={{ fontWeight: '900', color: isDemo ? '#34D399' : '#F87171' }}>{isDemo ? 'DEMO (MOCK)' : 'LIVE API'}</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Active Role Switcher:</Text>
      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleBtn, activeRole === 'admin' && styles.roleBtnActive]}
          onPress={() => switchRole('admin')}
        >
          <Text style={[styles.roleBtnText, activeRole === 'admin' && styles.roleBtnTextActive]}>
            👔 Admin
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleBtn, activeRole === 'customer' && styles.roleBtnActive]}
          onPress={() => switchRole('customer')}
        >
          <Text style={[styles.roleBtnText, activeRole === 'customer' && styles.roleBtnTextActive]}>
            🛒 Customer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleBtn, activeRole === 'logged_out' && styles.roleBtnActive]}
          onPress={() => switchRole('logged_out')}
        >
          <Text style={[styles.roleBtnText, activeRole === 'logged_out' && styles.roleBtnTextActive]}>
            🔒 Logged Out
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Quick Test Actions:</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btn, styles.cameraBtn]}
          onPress={() => navigation.navigate('CameraQRScanner')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>📷 Scanner</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.ordersBtn]}
          onPress={() => navigation.navigate('LiveOrdersManager', { storefrontId: 1, name: 'Lagos Grill' })}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>🔔 Live Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.storeBtn]}
          onPress={() => navigation.navigate('Storefront', { slug: 'lagos-grill', name: 'Lagos Grill' })}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>🛍️ Storefront</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.resetBtn]}
          onPress={handleResetData}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>🔄 Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1B4B',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modeToggle: {
    backgroundColor: '#312E81',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modeToggleText: {
    color: '#E0E7FF',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionLabel: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  roleBtn: {
    flex: 1,
    backgroundColor: '#312E81',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  roleBtnActive: {
    backgroundColor: '#6C63FF',
  },
  roleBtnText: {
    color: '#C7D2FE',
    fontSize: 11,
    fontWeight: '600',
  },
  roleBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  cameraBtn: {
    backgroundColor: '#4F46E5',
  },
  ordersBtn: {
    backgroundColor: '#059669',
  },
  storeBtn: {
    backgroundColor: '#D97706',
  },
  resetBtn: {
    backgroundColor: '#DC2626',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
