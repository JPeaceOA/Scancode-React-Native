import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CalendarDays, HandCoins, Music2, Star, X } from 'lucide-react-native';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createStoreFeedback,
  createStoreRequest,
  createStoreTip,
  createWaiterCall,
  getStoreConfig,
  type StoreRequestType,
} from '../api';

type ToolPopup = 'assistance' | 'request' | 'tip' | 'feedback' | 'events';
type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface DayEvent {
  id: string;
  time: string;
  name: string;
  description?: string;
}

export type WeeklyEvents = Partial<Record<DayOfWeek, DayEvent[]>>;

interface StorefrontToolbarProps {
  storefrontId?: number | null;
  tableCode?: string | null;
  vendor?: {
    name?: string;
    bankName?: string;
    accountNumber?: string;
  } | null;
  weeklyEvents?: WeeklyEvents;
}

const DAYS_OF_WEEK: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_CALL_ENTITIES = ['Waiter', 'Bouncer', 'Services'];
const REQUEST_TYPES: StoreRequestType[] = ['SHOUTOUT', 'SONG', 'KARAOKE'];

function getPresetMessages(entity: string): string[] {
  const key = entity.toLowerCase();
  if (key.includes('waiter') || key.includes('server')) {
    return ['Bring the bill', 'Water', 'Extra cutlery', 'Extra napkins', 'Package leftovers', 'Custom message'];
  }
  if (key.includes('bouncer') || key.includes('security')) {
    return ['Need security', 'Unwanted guest', 'Harassment', 'Escort me out', 'Medical emergency', 'Custom message'];
  }
  return ['Call Manager', 'Clean restroom', 'Taxi request', 'Wi-Fi help', 'Custom message'];
}

function money(value: number) {
  return `N${value.toLocaleString()}`;
}

export default function StorefrontToolbar({
  storefrontId,
  tableCode,
  vendor,
  weeklyEvents,
}: StorefrontToolbarProps) {
  const [activePopup, setActivePopup] = useState<ToolPopup | null>(null);
  const [callEntities, setCallEntities] = useState(DEFAULT_CALL_ENTITIES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const [tableNumber, setTableNumber] = useState(tableCode ?? '');
  const [callTarget, setCallTarget] = useState(DEFAULT_CALL_ENTITIES[0]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const [requestType, setRequestType] = useState<StoreRequestType>('SHOUTOUT');
  const [requestDetails, setRequestDetails] = useState('');
  const [requestAmount, setRequestAmount] = useState(5000);

  const [tipRecipient, setTipRecipient] = useState('Waiter');
  const [customTipRecipient, setCustomTipRecipient] = useState('');
  const [tipAmount, setTipAmount] = useState(100);

  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    setTableNumber(tableCode ?? '');
  }, [tableCode]);

  useEffect(() => {
    if (!storefrontId) return;

    let isMounted = true;
    getStoreConfig(storefrontId)
      .then((config) => {
        if (!isMounted || !config.callEntities?.length) return;
        setCallEntities(config.callEntities);
        setCallTarget(config.callEntities[0]);
      })
      .catch(() => {
        // Defaults keep the toolbar usable while config is unavailable.
      });

    return () => {
      isMounted = false;
    };
  }, [storefrontId]);

  const currentPresetMessages = useMemo(() => getPresetMessages(callTarget), [callTarget]);
  const totalEvents = DAYS_OF_WEEK.reduce((total, day) => total + (weeklyEvents?.[day]?.length ?? 0), 0);

  const handleCopyAccount = () => {
    if (!vendor?.accountNumber) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator?.clipboard) {
      navigator.clipboard.writeText(vendor.accountNumber);
    } else {
      Clipboard.setString(vendor.accountNumber);
    }
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const requireStorefront = () => {
    if (storefrontId) return true;
    Alert.alert('Store is still loading', 'Please try again once the storefront has finished loading.');
    return false;
  };

  const closePopup = () => {
    setActivePopup(null);
    setIsSubmitting(false);
  };

  const showSuccess = (message: string) => {
    Alert.alert('Sent', message);
    closePopup();
  };

  const submitAssistance = async () => {
    if (!requireStorefront()) return;
    if (!tableNumber.trim()) {
      Alert.alert('Table required', 'Please enter your table or room number.');
      return;
    }
    if (!selectedPreset) {
      Alert.alert('Select request', 'Please choose what you need.');
      return;
    }
    if (selectedPreset === 'Custom message' && !customMessage.trim()) {
      Alert.alert('Message required', 'Please enter your custom message.');
      return;
    }

    const message = selectedPreset === 'Custom message' ? customMessage.trim() : selectedPreset;

    try {
      setIsSubmitting(true);
      await createWaiterCall(storefrontId!, {
        tableNumber: tableNumber.trim(),
        callTarget,
        message,
      });
      setSelectedPreset('');
      setCustomMessage('');
      showSuccess(`Your call to ${callTarget} has been sent.`);
    } catch {
      Alert.alert('Request failed', 'Unable to notify staff right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRequest = async () => {
    if (!requireStorefront()) return;
    if (!requestDetails.trim()) {
      Alert.alert('Details required', 'Please describe your request.');
      return;
    }
    if (requestType !== 'KARAOKE' && requestAmount < 5000) {
      Alert.alert('Minimum amount', 'Paid requests (Shoutout & Song) must be at least N5,000.');
      setRequestAmount(5000);
      return;
    }

    try {
      setIsSubmitting(true);
      await createStoreRequest(storefrontId!, {
        requestType,
        details: requestDetails.trim(),
        amount: requestType === 'KARAOKE' ? 0 : requestAmount,
      });
      setRequestDetails('');
      setRequestAmount(5000);
      showSuccess('Your request has been submitted.');
    } catch {
      Alert.alert('Request failed', 'Unable to submit this request right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitTip = async () => {
    if (!requireStorefront()) return;
    const recipient = tipRecipient === 'Other' ? customTipRecipient.trim() : tipRecipient;
    if (!recipient) {
      Alert.alert('Recipient required', 'Please choose or enter who you are tipping.');
      return;
    }
    if (tipAmount < 100) {
      Alert.alert('Minimum tip', 'Tips must be at least N100.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createStoreTip(storefrontId!, {
        recipient: tipRecipient.toUpperCase(),
        customRecipient: tipRecipient === 'Other' ? recipient : null,
        amount: tipAmount,
      });
      setTipRecipient('Waiter');
      setCustomTipRecipient('');
      setTipAmount(100);
      showSuccess(`Your ${money(tipAmount)} tip has been sent.`);
    } catch {
      Alert.alert('Tip failed', 'Unable to submit this tip right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitFeedback = async () => {
    if (!requireStorefront()) return;

    try {
      setIsSubmitting(true);
      await createStoreFeedback(storefrontId!, {
        rating,
        description: feedbackText.trim(),
      });
      setRating(5);
      setFeedbackText('');
      showSuccess('Thank you for rating your experience.');
    } catch {
      Alert.alert('Feedback failed', 'Unable to submit feedback right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toolbarItems: { key: ToolPopup; label: string; Icon: React.ElementType }[] = [
    { key: 'assistance', label: 'Assist', Icon: Bell },
    { key: 'request', label: 'Request', Icon: Music2 },
    { key: 'tip', label: 'Tip', Icon: HandCoins },
    { key: 'feedback', label: 'Feedback', Icon: Star },
    { key: 'events', label: 'Events', Icon: CalendarDays },
  ];

  return (
    <>
      <View style={styles.toolbar}>
        {toolbarItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.toolButton}
            activeOpacity={0.75}
            onPress={() => setActivePopup(item.key)}
            accessibilityLabel={item.label}
          >
            <View style={styles.toolIconCircle}>
              <item.Icon size={18} color="#065F46" strokeWidth={2.2} />
            </View>
            <Text style={styles.toolLabel} numberOfLines={1}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        visible={activePopup !== null}
        animationType="slide"
        transparent
        onRequestClose={closePopup}
      >
        <Pressable style={styles.backdrop} onPress={closePopup}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.dragIndicator} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activePopup === 'assistance' && 'Call for Assistance'}
                {activePopup === 'request' && 'Make a Request'}
                {activePopup === 'tip' && 'Send a Tip'}
                {activePopup === 'feedback' && 'Rate Your Experience'}
                {activePopup === 'events' && 'This Week Events'}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={closePopup}>
                <X size={20} color="#6B7280" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              {activePopup === 'assistance' && (
                <>
                  <Text style={styles.label}>Table or room number</Text>
                  <TextInput
                    style={styles.input}
                    value={tableNumber}
                    onChangeText={setTableNumber}
                    placeholder="Enter table or room number"
                    placeholderTextColor="#9CA3AF"
                  />

                  <Text style={styles.label}>Who should we call?</Text>
                  <View style={styles.optionGrid}>
                    {callEntities.map((entity) => (
                      <TouchableOpacity
                        key={entity}
                        style={[styles.optionChip, callTarget === entity && styles.optionChipActive]}
                        onPress={() => {
                          setCallTarget(entity);
                          setSelectedPreset('');
                        }}
                      >
                        <Text style={[styles.optionText, callTarget === entity && styles.optionTextActive]}>{entity}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>What do you need?</Text>
                  <View style={styles.optionGrid}>
                    {currentPresetMessages.map((preset) => (
                      <TouchableOpacity
                        key={preset}
                        style={[styles.optionChip, selectedPreset === preset && styles.optionChipActive]}
                        onPress={() => setSelectedPreset(preset)}
                      >
                        <Text style={[styles.optionText, selectedPreset === preset && styles.optionTextActive]}>{preset}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {selectedPreset === 'Custom message' && (
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={customMessage}
                      onChangeText={setCustomMessage}
                      placeholder="Type your message"
                      placeholderTextColor="#9CA3AF"
                      multiline
                    />
                  )}

                  <SubmitButton label="Send Assistance Request" loading={isSubmitting} onPress={submitAssistance} />
                </>
              )}

              {activePopup === 'request' && (
                <>
                  <Text style={styles.label}>Request type</Text>
                  <View style={styles.optionGrid}>
                    {REQUEST_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.optionChip, requestType === type && styles.optionChipActive]}
                        onPress={() => setRequestType(type)}
                      >
                        <Text style={[styles.optionText, requestType === type && styles.optionTextActive]}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Details</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={requestDetails}
                    onChangeText={setRequestDetails}
                    placeholder="Song, shoutout, karaoke details..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                  />

                  {requestType !== 'KARAOKE' && (
                    <>
                      <Text style={styles.label}>Amount</Text>
                      <TextInput
                        style={styles.input}
                        value={String(requestAmount)}
                        onChangeText={(value) => {
                          const num = Number(value.replace(/\D/g, '')) || 0;
                          setRequestAmount(Math.max(num, 0));
                        }}
                        keyboardType="numeric"
                      />
                      <Text style={styles.minAmountHint}>Minimum ₦5,000</Text>
                    </>
                  )}

                  <SubmitButton label="Submit Request" loading={isSubmitting} onPress={submitRequest} />
                </>
              )}

              {activePopup === 'tip' && (
                <>
                  <Text style={styles.label}>Who are you tipping?</Text>
                  <View style={styles.optionGrid}>
                    {['Waiter', 'Bouncer', 'Services', 'Other'].map((recipient) => (
                      <TouchableOpacity
                        key={recipient}
                        style={[styles.optionChip, tipRecipient === recipient && styles.optionChipActive]}
                        onPress={() => setTipRecipient(recipient)}
                      >
                        <Text style={[styles.optionText, tipRecipient === recipient && styles.optionTextActive]}>{recipient}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {tipRecipient === 'Other' && (
                    <TextInput
                      style={styles.input}
                      value={customTipRecipient}
                      onChangeText={setCustomTipRecipient}
                      placeholder="Recipient name or role"
                      placeholderTextColor="#9CA3AF"
                    />
                  )}

                  <Text style={styles.label}>Amount</Text>
                  <TextInput
                    style={styles.input}
                    value={String(tipAmount)}
                    onChangeText={(value) => setTipAmount(Number(value.replace(/\D/g, '')) || 0)}
                    keyboardType="numeric"
                  />
                  <View style={styles.optionGrid}>
                    {[100, 200, 500, 1000].map((amount) => (
                      <TouchableOpacity
                        key={amount}
                        style={styles.optionChip}
                        onPress={() => setTipAmount((current) => current + amount)}
                      >
                        <Text style={styles.optionText}>+{money(amount)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {!!vendor?.bankName && !!vendor?.accountNumber && (
                    <View style={styles.bankBox}>
                      <Text style={styles.bankTitle}>Payment account</Text>
                      <Text style={styles.bankText}>{vendor.bankName}</Text>
                      <Text style={styles.bankText}>{vendor.name}</Text>
                      <TouchableOpacity
                        onPress={handleCopyAccount}
                        activeOpacity={0.65}
                        style={styles.bankNumberRow}
                      >
                        <Text style={styles.bankNumber}>{vendor.accountNumber}</Text>
                        <Text style={styles.copyHint}>
                          {copiedAccount ? '✓ Copied!' : 'Tap to copy'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <SubmitButton label="Submit Tip" loading={isSubmitting} onPress={submitTip} />
                </>
              )}

              {activePopup === 'feedback' && (
                <>
                  <Text style={styles.label}>Stars rating</Text>
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => setRating(star)}>
                        <Text style={[styles.starText, star <= rating && styles.starTextActive]}>*</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Describe your experience</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={feedbackText}
                    onChangeText={setFeedbackText}
                    placeholder="How was the food, service, and vibe?"
                    placeholderTextColor="#9CA3AF"
                    multiline
                  />

                  <SubmitButton label="Submit Rating" loading={isSubmitting} onPress={submitFeedback} />
                </>
              )}

              {activePopup === 'events' && (
                <>
                  {totalEvents === 0 ? (
                    <View style={styles.emptyBox}>
                      <Text style={styles.emptyTitle}>No events yet</Text>
                      <Text style={styles.emptyText}>Events will appear here when the venue publishes a weekly schedule.</Text>
                    </View>
                  ) : (
                    DAYS_OF_WEEK.map((day) => {
                      const events = weeklyEvents?.[day] ?? [];
                      if (events.length === 0) return null;
                      return (
                        <View key={day} style={styles.dayBox}>
                          <Text style={styles.dayTitle}>{day}</Text>
                          {events.map((event) => (
                            <View key={event.id} style={styles.eventRow}>
                              <Text style={styles.eventTime}>{event.time}</Text>
                              <View style={styles.eventInfo}>
                                <Text style={styles.eventName}>{event.name}</Text>
                                {!!event.description && <Text style={styles.eventDescription}>{event.description}</Text>}
                              </View>
                            </View>
                          ))}
                        </View>
                      );
                    })
                  )}
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function SubmitButton({
  label,
  loading,
  onPress,
}: {
  label: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.submitButton} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 8,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  toolButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  toolIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
  },
  toolIconText: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '800',
  },
  toolLabel: {
    color: '#4B5563',
    fontSize: 10,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 34,
    maxHeight: '84%',
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '800',
  },
  modalBody: {
    paddingBottom: 12,
  },
  label: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    color: '#111827',
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 96,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  optionChipActive: {
    backgroundColor: '#065F46',
    borderColor: '#065F46',
  },
  optionText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#065F46',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  bankBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    gap: 3,
  },
  bankTitle: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bankText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  bankNumber: {
    color: '#065F46',
    fontSize: 16,
    fontWeight: '900',
  },
  bankNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  copyHint: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  minAmountHint: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 14,
  },
  starText: {
    color: '#D1D5DB',
    fontSize: 32,
    fontWeight: '900',
  },
  starTextActive: {
    color: '#F59E0B',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  dayBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  dayTitle: {
    backgroundColor: '#F9FAFB',
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eventRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  eventTime: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '900',
    minWidth: 54,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
  },
  eventDescription: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
});
