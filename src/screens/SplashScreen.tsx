import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { getToken } from '../api';
import type { NavigationProp } from '../types';

interface Props {
  navigation: NavigationProp<'Splash'>;
}

export default function SplashScreen({ navigation }: Props) {
  // For testing
  //   navigation.replace('QR', { slug: "test", name: "QR Test" });
  // }, [navigation]); 
  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      try {
        const token = await getToken();
        if (cancelled) return;
        if (token) {
          navigation.replace('Dashboard');
        } else {
          navigation.replace('Login');
        }
      } catch {
        if (!cancelled) navigation.replace('Login');
      }
    }

    checkAuth();
    return () => { cancelled = true; };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>ScanCode</Text>
      <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6C63FF',
    letterSpacing: 1,
  },
});
