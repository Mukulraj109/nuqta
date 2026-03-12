// FAQ Suggestions Component
// Displays AI-powered FAQ suggestions

import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import type { FAQSuggestion } from '@/types/supportChat.types';

interface FAQSuggestionsProps {
  suggestions: FAQSuggestion[];
  onSelect?: (suggestion: FAQSuggestion) => void;
  onHelpful?: (faqId: string, helpful: boolean) => void;
  onClose?: () => void;
}

export default function FAQSuggestions({
  suggestions,
  onSelect,
  onHelpful,
  onClose,
}: FAQSuggestionsProps) {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleArticlePress = (url?: string) => {
    if (url) {
      try {
        Linking.openURL(url);
      } catch (e) {}
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bulb" size={20} color="#F59E0B" />
          <ThemedText style={styles.title}>Suggested Answers</ThemedText>
        </View>
        {onClose && (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {suggestions.map((suggestion, index) => {
          const isExpanded = expandedIds.has(suggestion.id);

          return (
            <View key={suggestion.id} style={styles.item}>
              <Pressable
                style={styles.itemHeader}
                onPress={() => {
                  toggleExpanded(suggestion.id);
                  onSelect?.(suggestion);
                }}
              >
                <View style={styles.itemHeaderContent}>
                  <View style={styles.questionRow}>
                    <Ionicons
                      name="help-circle-outline"
                      size={18}
                      color="#10B981"
                    />
                    <ThemedText style={styles.question}>
                      {suggestion.question}
                    </ThemedText>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#9CA3AF"
                  />
                </View>
                {suggestion.relevanceScore && suggestion.relevanceScore > 0.7 && (
                  <View style={styles.badge}>
                    <ThemedText style={styles.badgeText}>Highly Relevant</ThemedText>
                  </View>
                )}
              </Pressable>

              {isExpanded && (
                <View style={styles.itemContent}>
                  <ThemedText style={styles.answer}>{suggestion.answer}</ThemedText>

                  {suggestion.articleUrl && (
                    <Pressable
                      style={styles.articleButton}
                      onPress={() => handleArticlePress(suggestion.articleUrl)}
                    >
                      <Ionicons name="document-text-outline" size={16} color="#3B82F6" />
                      <ThemedText style={styles.articleButtonText}>
                        Read full article
                      </ThemedText>
                      <Ionicons name="arrow-forward" size={14} color="#3B82F6" />
                    </Pressable>
                  )}

                  {onHelpful && (
                    <View style={styles.feedback}>
                      <ThemedText style={styles.feedbackLabel}>
                        Was this helpful?
                      </ThemedText>
                      <View style={styles.feedbackButtons}>
                        <Pressable
                          style={[
                            styles.feedbackButton,
                            suggestion.helpful === true && styles.feedbackButtonActive,
                          ]}
                          onPress={() => onHelpful(suggestion.id, true)}
                        >
                          <Ionicons
                            name="thumbs-up"
                            size={16}
                            color={suggestion.helpful === true ? '#10B981' : '#6B7280'}
                          />
                          <ThemedText
                            style={[
                              styles.feedbackButtonText,
                              suggestion.helpful === true && styles.feedbackButtonTextActive,
                            ]}
                          >
                            Yes
                          </ThemedText>
                        </Pressable>

                        <Pressable
                          style={[
                            styles.feedbackButton,
                            suggestion.helpful === false && styles.feedbackButtonActive,
                          ]}
                          onPress={() => onHelpful(suggestion.id, false)}
                        >
                          <Ionicons
                            name="thumbs-down"
                            size={16}
                            color={suggestion.helpful === false ? '#EF4444' : '#6B7280'}
                          />
                          <ThemedText
                            style={[
                              styles.feedbackButtonText,
                              suggestion.helpful === false && styles.feedbackButtonTextActive,
                            ]}
                          >
                            No
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Ionicons name="chatbubbles-outline" size={16} color="#6B7280" />
        <ThemedText style={styles.footerText}>
          Can't find what you need? Continue chatting with an agent
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
  },
  closeButton: {
    padding: 4,
  },
  list: {
    maxHeight: 300,
  },
  item: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  itemHeader: {
    padding: 12,
  },
  itemHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  question: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    lineHeight: 20,
  },
  badge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  itemContent: {
    padding: 12,
    paddingTop: 0,
    gap: 12,
  },
  answer: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  articleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  articleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
    flex: 1,
  },
  feedback: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  feedbackLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  feedbackButtonActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  feedbackButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  feedbackButtonTextActive: {
    color: '#10B981',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
});
