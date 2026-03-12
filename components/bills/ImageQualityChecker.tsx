import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { analyzeImageQuality, ImageQualityResult } from '../../services/imageQualityService';

interface ImageQualityCheckerProps {
  imageUri: string;
  onQualityResult?: (result: ImageQualityResult) => void;
  onRetry?: () => void;
  onAccept?: () => void;
  autoAnalyze?: boolean;
}

/**
 * Component that shows quality assessment for selected images
 * Provides visual indicators and actionable feedback
 */
export const ImageQualityChecker: React.FC<ImageQualityCheckerProps> = ({
  imageUri,
  onQualityResult,
  onRetry,
  onAccept,
  autoAnalyze = true
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ImageQualityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (autoAnalyze && imageUri) {
      analyzeImage();
    }
  }, [imageUri, autoAnalyze]);

  // Pulse animation for quality indicator
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;

    if (analyzing) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
          })
        ])
      );
      pulseLoop.start();
    } else {
      pulseAnim.setValue(1);
    }

    // Cleanup: stop animation on unmount or when analyzing changes
    return () => {
      if (pulseLoop) {
        pulseLoop.stop();
      }
      pulseAnim.setValue(1);
    };
  }, [analyzing]);

  const analyzeImage = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      const qualityResult = await analyzeImageQuality(imageUri);
      setResult(qualityResult);
      onQualityResult?.(qualityResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image';
      setError(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  const getQualityColor = (score: number): string => {
    if (score >= 75) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getQualityLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  };

  const getStatusIcon = (status: 'good' | 'fair' | 'poor'): string => {
    switch (status) {
      case 'good':
        return 'checkmark-circle';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'close-circle';
    }
  };

  const getStatusColor = (status: 'good' | 'fair' | 'poor'): string => {
    switch (status) {
      case 'good':
        return '#10B981';
      case 'fair':
        return '#F59E0B';
      case 'poor':
        return '#EF4444';
    }
  };

  if (analyzing) {
    return (
      <View style={styles.container}>
        <View style={styles.imagePreviewContainer}>
          <CachedImage source={imageUri} style={styles.imagePreview} contentFit="contain" />
          <View style={styles.overlay}>
            <Animated.View style={[styles.analyzingIndicator, { transform: [{ scale: pulseAnim }] }]}>
              <ActivityIndicator size="large" color="#8B5CF6" />
            </Animated.View>
            <Text style={styles.analyzingText}>Analyzing image quality...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Analysis Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          {onRetry && (
            <Pressable style={styles.retryButton} onPress={onRetry}>
              <Ionicons name="refresh" size={20} color="#FFF" />
              <Text style={styles.retryButtonText}>Try Different Image</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={styles.container}>
        <Pressable style={styles.analyzeButton} onPress={analyzeImage}>
          <Ionicons name="analytics" size={24} color="#8B5CF6" />
          <Text style={styles.analyzeButtonText}>Analyze Image Quality</Text>
        </Pressable>
      </View>
    );
  }

  const qualityColor = getQualityColor(result.score);
  const qualityLabel = getQualityLabel(result.score);

  return (
    <View style={styles.container}>
      {/* Image Preview */}
      <View style={styles.imagePreviewContainer}>
        <CachedImage source={imageUri} style={styles.imagePreview} contentFit="contain" />
      </View>

      {/* Quality Score */}
      <View style={[styles.scoreContainer, { borderColor: qualityColor }]}>
        <View style={styles.scoreHeader}>
          <View style={[styles.scoreBadge, { backgroundColor: qualityColor }]}>
            <Text style={styles.scoreText}>{result.score}</Text>
            <Text style={styles.scoreLabel}>/ 100</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={[styles.qualityLabel, { color: qualityColor }]}>{qualityLabel}</Text>
            <Text style={styles.feedback}>{result.feedback}</Text>
          </View>
        </View>
      </View>

      {/* Quality Details */}
      <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
        {/* Sharpness */}
        <View style={styles.detailRow}>
          <Ionicons
            name={getStatusIcon(result.details.sharpness.status)}
            size={24}
            color={getStatusColor(result.details.sharpness.status)}
          />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Sharpness</Text>
            <Text style={styles.detailMessage}>{result.details.sharpness.message}</Text>
          </View>
        </View>

        {/* Brightness */}
        <View style={styles.detailRow}>
          <Ionicons
            name={getStatusIcon(result.details.brightness.status)}
            size={24}
            color={getStatusColor(result.details.brightness.status)}
          />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Brightness</Text>
            <Text style={styles.detailMessage}>{result.details.brightness.message}</Text>
          </View>
        </View>

        {/* Contrast */}
        <View style={styles.detailRow}>
          <Ionicons
            name={getStatusIcon(result.details.contrast.status)}
            size={24}
            color={getStatusColor(result.details.contrast.status)}
          />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Contrast</Text>
            <Text style={styles.detailMessage}>{result.details.contrast.message}</Text>
          </View>
        </View>

        {/* Resolution */}
        <View style={styles.detailRow}>
          <Ionicons
            name={getStatusIcon(result.details.resolution.status)}
            size={24}
            color={getStatusColor(result.details.resolution.status)}
          />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Resolution</Text>
            <Text style={styles.detailMessage}>
              {result.details.resolution.width} x {result.details.resolution.height} (
              {result.details.resolution.message})
            </Text>
          </View>
        </View>

        {/* File Size (if available) */}
        {result.details.fileSize && (
          <View style={styles.detailRow}>
            <Ionicons
              name={getStatusIcon(result.details.fileSize.status)}
              size={24}
              color={getStatusColor(result.details.fileSize.status)}
            />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>File Size</Text>
              <Text style={styles.detailMessage}>{result.details.fileSize.message}</Text>
            </View>
          </View>
        )}

        {/* Issues */}
        {result.issues.length > 0 && (
          <View style={styles.issuesContainer}>
            <Text style={styles.issuesTitle}>Issues Found:</Text>
            {result.issues.map((issue, index) => (
              <View key={index} style={styles.issueRow}>
                <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                <Text style={styles.issueText}>{issue}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Suggestions */}
        {result.suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Suggestions:</Text>
            {result.suggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionRow}>
                <Ionicons name="bulb-outline" size={16} color="#F59E0B" />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {onRetry && (
          <Pressable
            style={[styles.actionButton, styles.retryActionButton]}
            onPress={onRetry}
          >
            <Ionicons name="camera" size={20} color="#6B7280" />
            <Text style={styles.retryActionText}>Try Again</Text>
          </Pressable>
        )}

        {onAccept && (
          <Pressable
            style={[
              styles.actionButton,
              styles.acceptButton,
              !result.isValid && styles.acceptButtonDisabled
            ]}
            onPress={onAccept}
            disabled={!result.isValid}
          >
            <Ionicons name="checkmark" size={20} color="#FFF" />
            <Text style={styles.acceptButtonText}>
              {result.isValid ? 'Accept Image' : 'Quality Too Low'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  imagePreviewContainer: {
    height: 200,
    backgroundColor: '#000',
    position: 'relative'
  },
  imagePreview: {
    width: '100%',
    height: '100%'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  analyzingIndicator: {
    marginBottom: 12
  },
  analyzingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  },
  scoreContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  scoreBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF'
  },
  scoreLabel: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.9
  },
  scoreInfo: {
    flex: 1
  },
  qualityLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4
  },
  feedback: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20
  },
  detailsContainer: {
    flex: 1,
    paddingHorizontal: 16
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  detailContent: {
    flex: 1,
    marginLeft: 12
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2
  },
  detailMessage: {
    fontSize: 13,
    color: '#6B7280'
  },
  issuesContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8
  },
  issuesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 8
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4
  },
  issueText: {
    fontSize: 13,
    color: '#7F1D1D',
    marginLeft: 8,
    flex: 1
  },
  suggestionsContainer: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4
  },
  suggestionText: {
    fontSize: 13,
    color: '#78350F',
    marginLeft: 8,
    flex: 1
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8
  },
  retryActionButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  retryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151'
  },
  acceptButton: {
    backgroundColor: '#8B5CF6'
  },
  acceptButtonDisabled: {
    backgroundColor: '#D1D5DB'
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF'
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    gap: 12
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6'
  }
});
