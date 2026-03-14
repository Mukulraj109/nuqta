// Navigation Error Boundary
// Catches navigation errors and provides recovery UI

import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href } from 'expo-router';

interface Props {
  children: ReactNode;
  fallbackRoute?: Href;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  attemptedRecovery: boolean;
}

/**
 * Navigation Error Boundary Component
 * Catches errors during navigation and provides recovery options
 */
export class NavigationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      attemptedRecovery: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
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

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Attempt auto-recovery
    if (!this.state.attemptedRecovery) {
      this.attemptRecovery();
    }
  }

  attemptRecovery = () => {
    this.setState({ attemptedRecovery: true });

    // Try to recover after a short delay
    setTimeout(() => {
      try {
        // Clear error state to retry
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
        });
      } catch (recoveryError) {
        // silently handle
      }
    }, 1000);
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      attemptedRecovery: false,
    });
  };

  handleGoHome = () => {
    this.handleReset();
    // Navigate to home - this should be handled by parent
    if (this.props.fallbackRoute) {
      // Use router to navigate
      try {
        const { router } = require('expo-router');
        router.replace(this.props.fallbackRoute);
      } catch (error) {
        // silently handle
      }
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning-outline" size={64} color="#EF4444" />
            </View>

            <Text style={styles.title}>Navigation Error</Text>

            <Text style={styles.message}>
              Something went wrong with navigation. Don't worry, we're working to fix it!
            </Text>

            {this.props.showErrorDetails && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>Error Details:</Text>
                <Text style={styles.errorDetailsText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorDetailsText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}

            <View style={styles.actions}>
              <Pressable
                style={styles.primaryButton}
                onPress={this.handleReset}
              >
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={this.handleGoHome}
              >
                <Ionicons name="home" size={20} color="#6B7280" />
                <Text style={styles.secondaryButtonText}>Go Home</Text>
              </Pressable>
            </View>

            <Text style={styles.helpText}>
              If this problem persists, please contact support
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorDetails: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  errorDetailsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  errorDetailsText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  helpText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 24,
  },
});

export default React.memo(NavigationErrorBoundary);
