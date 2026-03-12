// Create Support Ticket Page
// Form to submit a new support ticket

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import supportService from '@/services/supportApi';
import { platformAlertSimple } from '@/utils/platformAlert';
import { Colors, Spacing, Gradients, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';

const CATEGORIES = [
  { id: 'order', label: 'Order', icon: 'cube-outline' },
  { id: 'payment', label: 'Payment', icon: 'card-outline' },
  { id: 'product', label: 'Product', icon: 'pricetag-outline' },
  { id: 'account', label: 'Account', icon: 'person-outline' },
  { id: 'technical', label: 'Technical', icon: 'code-outline' },
  { id: 'delivery', label: 'Delivery', icon: 'bicycle-outline' },
  { id: 'refund', label: 'Refund', icon: 'return-down-back-outline' },
  { id: 'other', label: 'Other', icon: 'help-circle-outline' },
] as const;

const PRIORITIES = [
  { id: 'low', label: 'Low', color: Colors.success, icon: 'arrow-down' },
  { id: 'medium', label: 'Medium', color: Colors.warning, icon: 'remove' },
  { id: 'high', label: 'High', color: '#E65100', icon: 'arrow-up' },
] as const;

function generateIdempotencyKey(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export default function CreateTicketPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    category?: string;
    subject?: string;
    relatedOrderId?: string;
  }>();

  const [subject, setSubject] = useState(params.subject || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(params.category || null);
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey] = useState(() => generateIdempotencyKey());

  const isValid = subject.trim().length >= 5 && selectedCategory && message.trim().length >= 10;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      const response = await supportService.createTicket({
        subject: subject.trim(),
        category: selectedCategory as any,
        priority: selectedPriority as any,
        message: message.trim(),
        idempotencyKey,
        ...(params.relatedOrderId ? {
          relatedEntity: { type: 'order' as const, id: params.relatedOrderId },
        } : {}),
      });

      if (response.success && response.data?.ticket) {
        platformAlertSimple('Success', 'Your support ticket has been created.');
        router.replace(`/support/ticket/${response.data.ticket._id}` as any);
      } else {
        platformAlertSimple('Error', 'Failed to create ticket. Please try again.');
      }
    } catch (error) {
      platformAlertSimple('Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent />

        {/* Header */}
        <LinearGradient colors={Gradients.nileBlue} style={styles.header}>
          <View style={styles.headerContent}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </Pressable>
            <ThemedText style={styles.headerTitle}>New Ticket</ThemedText>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Subject */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>Subject *</ThemedText>
            <TextInput
              style={styles.textInput}
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief description of your issue"
              placeholderTextColor={Colors.gray[400]}
              maxLength={200}
            />
            <ThemedText style={styles.charCount}>{subject.length}/200</ThemedText>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>Category *</ThemedText>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map(cat => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    selectedCategory === cat.id && styles.categoryCardSelected,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={22}
                    color={selectedCategory === cat.id ? Colors.secondary[600] : Colors.gray[500]}
                  />
                  <ThemedText
                    style={[
                      styles.categoryLabel,
                      selectedCategory === cat.id && styles.categoryLabelSelected,
                    ]}
                  >
                    {cat.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Priority */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>Priority</ThemedText>
            <View style={styles.priorityRow}>
              {PRIORITIES.map(pri => (
                <Pressable
                  key={pri.id}
                  style={[
                    styles.priorityCard,
                    selectedPriority === pri.id && { borderColor: pri.color, backgroundColor: `${pri.color}10` },
                  ]}
                  onPress={() => setSelectedPriority(pri.id)}
                >
                  <Ionicons
                    name={pri.icon as any}
                    size={18}
                    color={selectedPriority === pri.id ? pri.color : Colors.gray[400]}
                  />
                  <ThemedText
                    style={[
                      styles.priorityLabel,
                      selectedPriority === pri.id && { color: pri.color, fontWeight: '600' },
                    ]}
                  >
                    {pri.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Message */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>Describe your issue *</ThemedText>
            <TextInput
              style={styles.textArea}
              value={message}
              onChangeText={setMessage}
              placeholder="Please provide details about your issue. Include any relevant order IDs, screenshots, or error messages..."
              placeholderTextColor={Colors.gray[400]}
              multiline
              maxLength={5000}
              textAlignVertical="top"
            />
            <ThemedText style={styles.charCount}>{message.length}/5000</ThemedText>
          </View>

          {/* Submit Button */}
          <Pressable
            style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="#FFF" />
                <ThemedText style={styles.submitButtonText}>Submit Ticket</ThemedText>
              </>
            )}
          </Pressable>

          {/* Help Text */}
          <View style={styles.helpCard}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.info} />
            <ThemedText style={styles.helpText}>
              Our team typically responds within 24 hours. For urgent issues, please select "High" priority.
            </ThemedText>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 40,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginRight: 40,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text?.primary || '#1a1a2e',
    ...Shadows.subtle,
  },
  textArea: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text?.primary || '#1a1a2e',
    minHeight: 140,
    ...Shadows.subtle,
  },
  charCount: {
    fontSize: 11,
    color: Colors.gray[400],
    textAlign: 'right',
    marginTop: 4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '23%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.subtle,
  },
  categoryCardSelected: {
    borderColor: Colors.secondary[600],
    backgroundColor: Colors.secondary[50] || '#f0f7ff',
  },
  categoryLabel: {
    fontSize: 11,
    color: Colors.gray[500],
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: Colors.secondary[600],
    fontWeight: '600',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.subtle,
  },
  priorityLabel: {
    fontSize: 13,
    color: Colors.gray[500],
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary[600],
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${Colors.info}15`,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  helpText: {
    fontSize: 12,
    color: Colors.gray[600],
    flex: 1,
    lineHeight: 18,
  },
});
