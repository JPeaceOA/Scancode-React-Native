import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface ErrorBannerProps {
  message: string | null;
  type?: 'error' | 'success' | 'warning' | 'info';
  onDismiss?: () => void;
}

export default function ErrorBanner({
  message,
  type = 'error',
  onDismiss,
}: ErrorBannerProps) {
  if (!message) return null;

  const isSuccess = type === 'success';
  const isWarning = type === 'warning';
  const isInfo = type === 'info';

  const boxStyle = [
    styles.box,
    isSuccess && styles.successBox,
    isWarning && styles.warningBox,
    isInfo && styles.infoBox,
  ];

  const textStyle = [
    styles.text,
    isSuccess && styles.successText,
    isWarning && styles.warningText,
    isInfo && styles.infoText,
  ];

  return (
    <View style={boxStyle}>
      <Text style={textStyle}>{message}</Text>
      {onDismiss ? (
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={textStyle}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  successBox: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  infoBox: {
    backgroundColor: '#E0E7FF',
    borderColor: '#A5B4FC',
  },
  text: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  successText: {
    color: '#065F46',
  },
  warningText: {
    color: '#92400E',
  },
  infoText: {
    color: '#3730A3',
  },
});
