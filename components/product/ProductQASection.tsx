import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useProductQuestions } from '@/hooks/useProductQuestions';
import { ProductQuestion } from '@/services/questionsApi';

/**
 * ProductQASection Component
 *
 * Complete Q&A section for product pages
 * Features:
 * - Display questions and answers
 * - Sort options (recent, popular, unanswered)
 * - Ask question functionality
 * - Answer questions
 * - Vote on helpful answers
 * - Verified purchase badges
 * - Store representative badges
 */

interface ProductQASectionProps {
  productId: string;
  productName: string;
}

export const ProductQASection: React.FC<ProductQASectionProps> = ({ productId, productName }) => {
  const [showAskQuestion, setShowAskQuestion] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState<{ [key: string]: string }>({});
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const {
    questions,
    stats,
    isLoading,
    isRefreshing,
    sortBy,
    hasMore,
    loadMore,
    refresh,
    changeSortBy,
    askQuestion,
    answerQuestion,
    markAnswerHelpful,
  } = useProductQuestions({
    productId,
    autoLoad: true,
  });

  /**
   * Handle ask question
   */
  const handleAskQuestion = async () => {
    if (!questionText.trim()) {
      platformAlertSimple('Error', 'Please enter your question');
      return;
    }

    try {
      await askQuestion(questionText);
      setQuestionText('');
      setShowAskQuestion(false);
      platformAlertSimple('Success', 'Your question has been posted!');
    } catch (error) {
      platformAlertSimple('Error', 'Failed to post question. Please try again.');
    }
  };

  /**
   * Handle answer question
   */
  const handleAnswerQuestion = async (questionId: string) => {
    const answer = answerText[questionId];

    if (!answer?.trim()) {
      platformAlertSimple('Error', 'Please enter your answer');
      return;
    }

    try {
      await answerQuestion(questionId, answer);
      setAnswerText(prev => ({ ...prev, [questionId]: '' }));
      platformAlertSimple('Success', 'Your answer has been posted!');
    } catch (error) {
      platformAlertSimple('Error', 'Failed to post answer. Please try again.');
    }
  };

  /**
   * Toggle question expanded state
   */
  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  /**
   * Render question card
   */
  const renderQuestion = ({ item: question }: { item: ProductQuestion }) => {
    const isExpanded = expandedQuestions.has(question._id);

    return (
      <View style={styles.questionCard}>
        {/* Question Header */}
        <Pressable
          style={styles.questionHeader}
          onPress={() => toggleQuestion(question._id)}
         
        >
          <View style={styles.questionIcon}>
            <Ionicons name="help-circle" size={24} color="#8B5CF6" />
          </View>

          <View style={styles.questionContent}>
            <View style={styles.questionMeta}>
              <ThemedText style={styles.userName}>{question.question.userName}</ThemedText>
              {question.question.isVerifiedPurchase && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <ThemedText style={styles.verifiedText}>Verified Purchase</ThemedText>
                </View>
              )}
            </View>

            <ThemedText style={styles.questionText}>{question.question.text}</ThemedText>

            <View style={styles.questionFooter}>
              <ThemedText style={styles.timeText}>
                {new Date(question.question.askedAt).toLocaleDateString()}
              </ThemedText>
              <ThemedText style={styles.answerCount}>
                {question.answerCount} {question.answerCount === 1 ? 'Answer' : 'Answers'}
              </ThemedText>
            </View>
          </View>

          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
        </Pressable>

        {/* Answers Section */}
        {isExpanded && (
          <View style={styles.answersContainer}>
            {question.answers.length > 0 ? (
              question.answers.map((answer, index) => (
                <View key={index} style={styles.answerCard}>
                  <View style={styles.answerHeader}>
                    <ThemedText style={styles.answerUserName}>{answer.userName}</ThemedText>
                    {answer.isStoreRepresentative && (
                      <View style={[styles.badge, styles.storeBadge]}>
                        <Ionicons name="storefront" size={12} color="#8B5CF6" />
                        <ThemedText style={styles.badgeText}>Store</ThemedText>
                      </View>
                    )}
                    {answer.isVerifiedPurchase && (
                      <View style={[styles.badge, styles.verifiedAnswerBadge]}>
                        <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                        <ThemedText style={[styles.badgeText, { color: '#10B981' }]}>
                          Verified
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  <ThemedText style={styles.answerText}>{answer.text}</ThemedText>

                  <View style={styles.answerFooter}>
                    <ThemedText style={styles.timeText}>
                      {new Date(answer.answeredAt).toLocaleDateString()}
                    </ThemedText>

                    <Pressable
                      style={styles.helpfulButton}
                      onPress={() => markAnswerHelpful(question._id, answer._id)}
                     
                    >
                      <Ionicons name="thumbs-up" size={16} color="#6B7280" />
                      <ThemedText style={styles.helpfulText}>
                        Helpful ({answer.helpful.count})
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <ThemedText style={styles.noAnswersText}>No answers yet. Be the first to answer!</ThemedText>
            )}

            {/* Answer Input */}
            <View style={styles.answerInputContainer}>
              <TextInput
                style={styles.answerInput}
                placeholder="Write your answer..."
                placeholderTextColor="#9CA3AF"
                value={answerText[question._id] || ''}
                onChangeText={text =>
                  setAnswerText(prev => ({ ...prev, [question._id]: text }))
                }
                multiline
              />
              <Pressable
                style={styles.postAnswerButton}
                onPress={() => handleAnswerQuestion(question._id)}
               
              >
                <ThemedText style={styles.postAnswerText}>Post Answer</ThemedText>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (isLoading && questions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <ThemedText style={styles.loadingText}>Loading questions...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.title}>Questions & Answers</ThemedText>
          <ThemedText style={styles.statsText}>
            {stats.total} questions • {stats.unanswered} unanswered
          </ThemedText>
        </View>

        <Pressable
          style={styles.askButton}
          onPress={() => setShowAskQuestion(!showAskQuestion)}
         
        >
          <Ionicons name="add-circle" size={20} color="#8B5CF6" />
          <ThemedText style={styles.askButtonText}>Ask</ThemedText>
        </Pressable>
      </View>

      {/* Ask Question Form */}
      {showAskQuestion && (
        <View style={styles.askQuestionForm}>
          <TextInput
            style={styles.questionInput}
            placeholder={`Ask a question about ${productName}...`}
            placeholderTextColor="#9CA3AF"
            value={questionText}
            onChangeText={setQuestionText}
            multiline
            maxLength={500}
          />
          <View style={styles.askQuestionActions}>
            <ThemedText style={styles.charCount}>{questionText.length}/500</ThemedText>
            <View style={styles.askQuestionButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setShowAskQuestion(false);
                  setQuestionText('');
                }}
               
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={styles.submitButton}
                onPress={handleAskQuestion}
               
              >
                <ThemedText style={styles.submitButtonText}>Submit Question</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        {(['recent', 'popular', 'unanswered'] as const).map(sort => (
          <Pressable
            key={sort}
            style={[styles.sortButton, sortBy === sort && styles.sortButtonActive]}
            onPress={() => changeSortBy(sort)}
           
          >
            <ThemedText style={[styles.sortText, sortBy === sort && styles.sortTextActive]}>
              {sort.charAt(0).toUpperCase() + sort.slice(1)}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* Questions List */}
      <FlatList
        data={questions}
        renderItem={renderQuestion}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        onRefresh={refresh}
        refreshing={isRefreshing}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={Platform.OS !== 'web'}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={64} color="#D1D5DB" />
            <ThemedText style={styles.emptyText}>No questions yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Be the first to ask about this product!
            </ThemedText>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statsText: {
    fontSize: 13,
    color: '#6B7280',
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    gap: 6,
  },
  askButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },

  // Ask Question Form
  askQuestionForm: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  questionInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  askQuestionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  askQuestionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },

  // Sort
  sortContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortButtonActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#8B5CF6',
  },
  sortText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  sortTextActive: {
    color: '#8B5CF6',
  },

  // Questions List
  listContent: {
    gap: 12,
  },

  // Question Card
  questionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  questionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionContent: {
    flex: 1,
    gap: 8,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  questionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  questionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  answerCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },

  // Answers
  answersContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFF',
    padding: 16,
    gap: 12,
  },
  answerCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  answerUserName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  storeBadge: {
    backgroundColor: '#F3E8FF',
  },
  verifiedAnswerBadge: {
    backgroundColor: '#D1FAE5',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  answerText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  answerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpfulText: {
    fontSize: 12,
    color: '#6B7280',
  },
  noAnswersText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
  },

  // Answer Input
  answerInputContainer: {
    gap: 8,
    marginTop: 8,
  },
  answerInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  postAnswerButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  postAnswerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default React.memo(ProductQASection);
