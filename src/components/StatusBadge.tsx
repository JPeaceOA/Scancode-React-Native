import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type StatusType =
  | 'PUBLISHED'
  | 'LOCKED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'DELIVERED'
  | string;

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const normalized = status.toUpperCase();

  let bgStyle = styles.pendingBg;
  let textStyle = styles.pendingText;

  switch (normalized) {
    case 'PUBLISHED':
    case 'CONFIRMED':
    case 'DELIVERED':
      bgStyle = styles.successBg;
      textStyle = styles.successText;
      break;
    case 'LOCKED':
    case 'PENDING':
    case 'PENDING_ACK':
      bgStyle = styles.warningBg;
      textStyle = styles.warningText;
      break;
    case 'REJECTED':
    case 'CANCELLED':
      bgStyle = styles.dangerBg;
      textStyle = styles.dangerText;
      break;
    default:
      break;
  }

  const displayLabel = label || status;

  return (
    <View style={[styles.badge, bgStyle]}>
      <Text style={[styles.text, textStyle]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  successBg: { backgroundColor: '#D1FAE5' },
  successText: { color: '#065F46' },
  warningBg: { backgroundColor: '#FEF3C7' },
  warningText: { color: '#92400E' },
  dangerBg: { backgroundColor: '#FEE2E2' },
  dangerText: { color: '#991B1B' },
  pendingBg: { backgroundColor: '#E0E7FF' },
  pendingText: { color: '#3730A3' },
});
