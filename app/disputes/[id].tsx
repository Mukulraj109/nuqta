import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import disputeApi, { Dispute } from '@/services/disputeApi';
import { CachedImage } from '@/components/ui/CachedImage';
import { platformAlert } from '@/utils/platformAlert';

const STATUS_COLORS: Record<string, string> = {
  open: '#EF4444',
  under_review: '#F59E0B',
  escalated: '#8B5CF6',
  resolved_refund: '#10B981',
  resolved_reject: '#3B82F6',
  auto_resolved: '#6366F1',
  closed: '#6B7280',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  under_review: 'Under Review',
  escalated: 'Escalated',
  resolved_refund: 'Refunded',
  resolved_reject: 'Rejected',
  auto_resolved: 'Auto-Resolved',
  closed: 'Closed',
};

const REASON_LABELS: Record<string, string> = {
  item_not_received: 'Item Not Received',
  wrong_item: 'Wrong Item',
  damaged_item: 'Damaged Item',
  quality_issue: 'Quality Issue',
  unauthorized_charge: 'Unauthorized Charge',
  double_charge: 'Double Charge',
  service_not_rendered: 'Service Not Rendered',
  other: 'Other',
};

export default function DisputeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, authLoading } = useAuth();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || authLoading || !isAuthenticated) return;
    loadDispute();
  }, [id, isAuthenticated, authLoading]);

  const loadDispute = async () => {
    setLoading(true);
    try {
      const response = await disputeApi.getDispute(id!);
      if (response.success && response.data) {
        setDispute(response.data as any);
      }
    } catch (err) {
      console.error('Failed to load dispute:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!dispute) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
        <Text style={styles.errorText}>Dispute not found</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[dispute.status] || '#6B7280';
  const isOpen = ['open', 'under_review', 'escalated'].includes(dispute.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.disputeNumber}>{dispute.disputeNumber}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor + '18' }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {STATUS_LABELS[dispute.status] || dispute.status}
          </Text>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <InfoRow label="Reason" value={REASON_LABELS[dispute.reason] || dispute.reason} />
        <InfoRow label="Amount" value={`${dispute.amount} coins`} />
        <InfoRow label="Order" value={dispute.targetRef} />
        <InfoRow label="Created" value={new Date(dispute.createdAt).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
        })} />
        <InfoRow label="Auto-Resolve By" value={new Date(dispute.autoResolveAt).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
        })} />
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.descText}>{dispute.description}</Text>
      </View>

      {/* Evidence */}
      {dispute.evidence.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evidence ({dispute.evidence.length})</Text>
          {dispute.evidence.map((e, i) => (
            <View key={i} style={styles.evidenceItem}>
              <Text style={styles.evidenceType}>
                {e.submitterType === 'user' ? 'You' : e.submitterType} — {new Date(e.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={styles.evidenceDesc}>{e.description}</Text>
              {e.attachments.length > 0 && (
                <View style={styles.attachmentRow}>
                  {e.attachments.map((url, j) => (
                    <CachedImage key={j} source={{ uri: url }} style={styles.attachmentThumb} />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Merchant Response */}
      {dispute.merchantResponse && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Merchant Response</Text>
          <View style={styles.merchantCard}>
            <Text style={styles.descText}>{dispute.merchantResponse.response}</Text>
            {dispute.merchantResponse.attachments.length > 0 && (
              <View style={styles.attachmentRow}>
                {dispute.merchantResponse.attachments.map((url, j) => (
                  <CachedImage key={j} source={{ uri: url }} style={styles.attachmentThumb} />
                ))}
              </View>
            )}
            <Text style={styles.dateText}>
              {new Date(dispute.merchantResponse.respondedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      )}

      {/* Resolution */}
      {dispute.resolution && (
        <View style={[styles.section, styles.resolutionCard, {
          backgroundColor: dispute.resolution.decision === 'reject' ? '#FEE2E2' : '#D1FAE5',
        }]}>
          <Text style={styles.sectionTitle}>Resolution</Text>
          <InfoRow label="Decision" value={dispute.resolution.decision.replace(/_/g, ' ').toUpperCase()} />
          <InfoRow label="Amount" value={`${dispute.resolution.amount} coins`} />
          <InfoRow label="Reason" value={dispute.resolution.reason} />
          <InfoRow label="Resolved" value={new Date(dispute.resolution.resolvedAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })} />
        </View>
      )}

      {/* Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        {dispute.timeline.map((t, i) => (
          <View key={i} style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: i === 0 ? '#7C3AED' : '#D1D5DB' }]} />
            {i < dispute.timeline.length - 1 && <View style={styles.timelineLine} />}
            <View style={styles.timelineContent}>
              <Text style={styles.timelineAction}>{t.action.replace(/_/g, ' ')}</Text>
              {t.details && <Text style={styles.timelineDetails}>{t.details}</Text>}
              <Text style={styles.timelineTime}>
                {t.performerType} — {new Date(t.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Add Evidence Button */}
      {isOpen && (
        <TouchableOpacity
          style={styles.addEvidenceBtn}
          onPress={() => router.push(`/disputes/create?addEvidence=true&disputeId=${dispute._id}`)}
        >
          <Ionicons name="attach-outline" size={18} color="#fff" />
          <Text style={styles.addEvidenceBtnText}>Add Evidence</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', gap: 8 },
  errorText: { fontSize: 14, color: '#6B7280' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  disputeNumber: { fontSize: 18, fontWeight: '700', color: '#111827' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },

  infoCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    }),
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 13, color: '#6B7280' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#111827', maxWidth: '55%', textAlign: 'right' },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 },
  descText: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
  dateText: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },

  evidenceItem: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  evidenceType: { fontSize: 11, color: '#9CA3AF', marginBottom: 4, textTransform: 'capitalize' },
  evidenceDesc: { fontSize: 13, color: '#374151' },
  attachmentRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  attachmentThumb: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#F3F4F6' },

  merchantCard: { backgroundColor: '#FFF7ED', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FED7AA' },

  resolutionCard: { borderRadius: 14, padding: 14 },

  timelineItem: { flexDirection: 'row', marginBottom: 4, minHeight: 40 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: 12, zIndex: 1 },
  timelineLine: {
    position: 'absolute', left: 4, top: 14, bottom: -4, width: 2, backgroundColor: '#E5E7EB',
  },
  timelineContent: { flex: 1, paddingBottom: 12 },
  timelineAction: { fontSize: 13, fontWeight: '600', color: '#111827', textTransform: 'capitalize' },
  timelineDetails: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  timelineTime: { fontSize: 11, color: '#9CA3AF', marginTop: 2, textTransform: 'capitalize' },

  addEvidenceBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#7C3AED', borderRadius: 12,
    paddingVertical: 14, marginTop: 8,
  },
  addEvidenceBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
