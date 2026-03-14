// Chat Rating Component
// Allows users to rate their support conversation

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ConversationRating } from '@/types/supportChat.types';

interface ChatRatingProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: ConversationRating, comment?: string, tags?: string[]) => void;
  agentName?: string;
}

function ChatRating({
  visible,
  onClose,
  onSubmit,
  agentName,
}: ChatRatingProps) {
  const [rating, setRating] = useState<ConversationRating | null>(null);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const ratingLabels = {
    1: 'Very Poor',
    2: 'Poor',
    3: 'Average',
    4: 'Good',
    5: 'Excellent',
  };

  const feedbackTags = {
    positive: [
      'Quick response',
      'Very helpful',
      'Professional',
      'Friendly',
      'Problem solved',
      'Clear communication',
    ],
    negative: [
      'Slow response',
      'Not helpful',
      'Rude',
      'Unclear',
      'Problem not solved',
      'Unhelpful',
    ],
  };

  const handleRatingPress = (value: ConversationRating) => {
    setRating(value);
    // Reset tags when rating changes
    setSelectedTags([]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (rating) {
      onSubmit(rating, comment.trim() || undefined, selectedTags);
      // Reset state
      setRating(null);
      setComment('');
      setSelectedTags([]);
    }
  };

  const handleClose = () => {
    setRating(null);
    setComment('');
    setSelectedTags([]);
    onClose();
  };

  const availableTags = rating && rating >= 4 ? feedbackTags.positive : feedbackTags.negative;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.container}>
          <View style={styles.handle} />

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="star" size={32} color="#F59E0B" />
              </View>
              <ThemedText style={styles.title}>Rate Your Experience</ThemedText>
              {agentName && (
                <ThemedText style={styles.subtitle}>
                  How was your conversation with {agentName}?
                </ThemedText>
              )}
            </View>

            {/* Star Rating */}
            <View style={styles.starsContainer}>
              {([1, 2, 3, 4, 5] as ConversationRating[]).map((value) => (
                <Pressable
                  key={value}
                  onPress={() => handleRatingPress(value)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={rating && value <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color={rating && value <= rating ? '#F59E0B' : '#D1D5DB'}
                  />
                </Pressable>
              ))}
            </View>

            {rating && (
              <ThemedText style={styles.ratingLabel}>
                {ratingLabels[rating]}
              </ThemedText>
            )}

            {/* Feedback Tags */}
            {rating && (
              <View style={styles.tagsSection}>
                <ThemedText style={styles.tagsTitle}>
                  What stood out? (Optional)
                </ThemedText>
                <View style={styles.tagsContainer}>
                  {availableTags.map((tag) => (
                    <Pressable
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      style={[
                        styles.tag,
                        selectedTags.includes(tag) && styles.tagSelected,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.tagText,
                          selectedTags.includes(tag) && styles.tagTextSelected,
                        ]}
                      >
                        {tag}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Comment */}
            {rating && (
              <View style={styles.commentSection}>
                <ThemedText style={styles.commentTitle}>
                  Additional Comments (Optional)
                </ThemedText>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Tell us more about your experience..."
                  placeholderTextColor="#9CA3AF"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  textAlignVertical="top"
                />
                <ThemedText style={styles.characterCount}>
                  {comment.length}/500
                </ThemedText>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttons}>
              <Pressable style={styles.skipButton} onPress={handleClose}>
                <ThemedText style={styles.skipButtonText}>Skip</ThemedText>
              </Pressable>

              <Pressable
                style={[styles.submitButton, !rating && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!rating}
              >
                <LinearGradient
                  colors={rating ? ['#10B981', '#059669'] : ['#E5E7EB', '#D1D5DB']}
                  style={styles.submitButtonGradient}
                >
                  <ThemedText style={styles.submitButtonText}>Submit</ThemedText>
                </LinearGradient>
              </Pressable>
            </View>

            <ThemedText style={styles.disclaimer}>
              Your feedback helps us improve our support service
            </ThemedText>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 24,
  },
  tagsSection: {
    marginBottom: 24,
  },
  tagsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  tagSelected: {
    borderColor: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  tagTextSelected: {
    color: '#10B981',
  },
  commentSection: {
    marginBottom: 24,
  },
  commentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 6,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonGradient: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  disclaimer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default React.memo(ChatRating);
