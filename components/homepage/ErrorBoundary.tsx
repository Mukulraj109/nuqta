import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface ErrorRetryProps {
  error: string;
  onRetry: () => void;
  title?: string;
  description?: string;
  showIcon?: boolean;
}

export function ErrorRetry({ 
  error, 
  onRetry, 
  title = 'Something went wrong',
  description = 'We encountered an error while loading this section.',
  showIcon = true
}: ErrorRetryProps) {
  return (
    <ThemedView style={styles.container}>
      {showIcon && (
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        </View>
      )}
      
      <ThemedText style={styles.title}>{title}</ThemedText>
      <ThemedText style={styles.description}>{description}</ThemedText>
      
      {error && (
        <ThemedText style={styles.errorDetails} numberOfLines={2}>
          {error}
        </ThemedText>
      )}
      
      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Ionicons name="refresh" size={20} color="#FFFFFF" />
        <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

interface SectionErrorProps {
  sectionTitle: string;
  error: string;
  onRetry: () => void;
  compact?: boolean;
}

export function SectionError({ 
  sectionTitle, 
  error, 
  onRetry, 
  compact = false 
}: SectionErrorProps) {
  if (compact) {
    return (
      <View style={styles.compactError}>
        <View style={styles.compactErrorContent}>
          <Ionicons name="warning-outline" size={16} color="#F59E0B" />
          <ThemedText style={styles.compactErrorText}>
            Failed to load {sectionTitle.toLowerCase()}
          </ThemedText>
        </View>
        <Pressable onPress={onRetry} style={styles.compactRetryButton}>
          <Ionicons name="refresh" size={16} color="#8B5CF6" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.sectionErrorContainer}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>{sectionTitle}</ThemedText>
      </View>
      <ErrorRetry
        error={error}
        onRetry={onRetry}
        title={`Failed to load ${sectionTitle.toLowerCase()}`}
        description="Please check your connection and try again."
      />
    </View>
  );
}

interface NetworkErrorProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export function NetworkError({ onRetry, isRetrying = false }: NetworkErrorProps) {
  return (
    <ThemedView style={styles.networkErrorContainer}>
      <View style={styles.networkErrorContent}>
        <Ionicons name="cloud-offline-outline" size={64} color="#6B7280" />
        <ThemedText style={styles.networkErrorTitle}>No Internet Connection</ThemedText>
        <ThemedText style={styles.networkErrorDescription}>
          Please check your internet connection and try again.
        </ThemedText>
        
        <Pressable 
          style={[styles.networkRetryButton, isRetrying && styles.networkRetryButtonDisabled]} 
          onPress={onRetry}
          disabled={isRetrying}
         
        >
          {isRetrying ? (
            <Ionicons name="hourglass-outline" size={20} color="#FFFFFF" />
          ) : (
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          )}
          <ThemedText style={styles.networkRetryButtonText}>
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

// Error Boundary Component for React Error Handling
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; onRetry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} onRetry={this.handleRetry} />;
      }

      return (
        <ErrorRetry
          error={this.state.error.message}
          onRetry={this.handleRetry}
          title="Application Error"
          description="Something unexpected happened. The error has been reported."
        />
      );
    }

    return this.props.children;
  }
}

// Hook for handling async errors
export function useErrorHandler() {
  const [error, setError] = React.useState<string | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleError = React.useCallback((error: unknown) => {
    if (error instanceof Error) {
      setError(error.message);
    } else {
      setError('An unexpected error occurred');
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
    setIsRetrying(false);
  }, []);

  const retry = React.useCallback(async (retryFunction: () => Promise<void>) => {
    setIsRetrying(true);
    try {
      await retryFunction();
      clearError();
    } catch (error) {
      handleError(error);
    } finally {
      setIsRetrying(false);
    }
  }, [handleError, clearError]);

  return {
    error,
    isRetrying,
    handleError,
    clearError,
    retry,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FAFAFA',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  errorDetails: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  compactError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  compactErrorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  compactErrorText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  compactRetryButton: {
    padding: 4,
  },
  sectionErrorContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  networkErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  networkErrorContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  networkErrorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  networkErrorDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  networkRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  networkRetryButtonDisabled: {
    opacity: 0.6,
  },
  networkRetryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default React.memo(ErrorBoundary);