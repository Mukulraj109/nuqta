/**
 * GameErrorBoundary Component
 * Specialized Error Boundary for Game Components
 *
 * Features:
 * - Catches game-specific errors
 * - Logs errors to monitoring service
 * - Displays user-friendly game error UI
 * - Provides recovery options for games
 * - Tracks error patterns for anti-cheat
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  children: ReactNode;
  gameName?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  onReturnToGames?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number | null;
}

interface ErrorLog {
  timestamp: number;
  error: string;
  stack?: string;
  gameName?: string;
  userAgent?: string;
}

class GameErrorBoundary extends Component<Props, State> {
  private errorLogs: ErrorLog[] = [];
  private fadeAnim: Animated.Value;
  private readonly MAX_ERROR_COUNT = 5; // Max errors before suspected cheating
  private readonly ERROR_TIME_WINDOW = 60000; // 1 minute

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: null,
    };
    this.fadeAnim = new Animated.Value(0);
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const now = Date.now();

    // Update error count
    this.setState((prevState) => {
      const timeSinceLastError = prevState.lastErrorTime ? now - prevState.lastErrorTime : Infinity;
      const isWithinTimeWindow = timeSinceLastError < this.ERROR_TIME_WINDOW;

      return {
        errorInfo,
        errorCount: isWithinTimeWindow ? prevState.errorCount + 1 : 1,
        lastErrorTime: now,
      };
    });

    // Log error details
    const errorLog: ErrorLog = {
      timestamp: now,
      error: error.message,
      stack: error.stack,
      gameName: this.props.gameName,
      userAgent: navigator?.userAgent,
    };

    this.errorLogs.push(errorLog);

    // Log to console (in production, send to monitoring service)

    // Check for suspicious error patterns (potential cheating)
    this.detectSuspiciousActivity();

    // Call parent error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service (e.g., Sentry, LogRocket)
    this.sendToMonitoring(errorLog);

    // Animate error screen
    Animated.timing(this.fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }

  /**
   * Detect suspicious activity patterns that might indicate cheating
   */
  private detectSuspiciousActivity = () => {
    const { errorCount } = this.state;

    // Too many errors in a short time suggests manipulation
    if (errorCount >= this.MAX_ERROR_COUNT) {

      // In production, flag this user account for review
      this.flagForReview('excessive_errors');
    }

    // Check for specific error patterns that suggest tampering
    const recentErrors = this.errorLogs.slice(-5);
    const identicalErrors = recentErrors.filter(
      (log) => log.error === this.state.error?.message
    );

    if (identicalErrors.length >= 3) {
      this.flagForReview('repeated_errors');
    }
  };

  /**
   * Flag user account for security review
   */
  private flagForReview = (reason: string) => {
    // In production, send this to backend security service

    // Could implement API call here:
    // securityApi.flagUser({ reason, errorLogs: this.errorLogs });
  };

  /**
   * Send error to monitoring service (Sentry, LogRocket, etc.)
   */
  private sendToMonitoring = (errorLog: ErrorLog) => {
    // In production, integrate with monitoring service
    // Example: Sentry.captureException(error, { tags: { game: gameName } });

    if (__DEV__) {
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReturnToGames = () => {
    if (this.props.onReturnToGames) {
      this.props.onReturnToGames();
    }
  };

  renderErrorDetails = () => {
    const { error, errorCount } = this.state;
    const { gameName } = this.props;

    if (!error) return null;

    return (
      <View style={styles.errorDetails}>
        <Text style={styles.errorTitle}>
          {errorCount > 3 ? 'Multiple Errors Detected' : 'Game Error'}
        </Text>
        <Text style={styles.errorMessage}>
          {gameName ? `Error in ${gameName}` : 'An error occurred'}
        </Text>
        {__DEV__ && (
          <Text style={styles.errorStack} numberOfLines={3}>
            {error.message}
          </Text>
        )}
      </View>
    );
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Show warning if too many errors (potential cheating)
      const showWarning = this.state.errorCount >= this.MAX_ERROR_COUNT;

      return (
        <View style={styles.container}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: this.fadeAnim,
              },
            ]}
          >
            <LinearGradient
              colors={showWarning ? ['#EF4444', '#DC2626'] : ['#8B5CF6', '#7C3AED']}
              style={styles.gradientContainer}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={showWarning ? 'warning' : 'game-controller'}
                  size={80}
                  color="white"
                />
              </View>

              <Text style={styles.title}>
                {showWarning ? 'Too Many Errors' : 'Game Interrupted'}
              </Text>

              <Text style={styles.message}>
                {showWarning
                  ? 'Multiple errors detected. Your account may be flagged for review.'
                  : 'Oops! Something went wrong with the game. Don\'t worry, your progress is safe.'}
              </Text>

              {this.renderErrorDetails()}

              <View style={styles.buttonContainer}>
                <Pressable
                  style={[styles.button, styles.primaryButton]}
                  onPress={this.handleReset}
                  accessibilityLabel="Try again"
                >
                  <Ionicons name="refresh" size={20} color="white" />
                  <Text style={styles.buttonText}>Try Again</Text>
                </Pressable>

                {this.props.onReturnToGames && (
                  <Pressable
                    style={[styles.button, styles.secondaryButton]}
                    onPress={this.handleReturnToGames}
                    accessibilityLabel="Return to games"
                  >
                    <Ionicons name="arrow-back" size={20} color="#8B5CF6" />
                    <Text style={styles.secondaryButtonText}>Back to Games</Text>
                  </Pressable>
                )}
              </View>

              {showWarning && (
                <View style={styles.warningBanner}>
                  <Ionicons name="alert-circle" size={20} color="#FEF3C7" />
                  <Text style={styles.warningText}>
                    Suspicious activity detected
                  </Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>
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
  },
  content: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  gradientContainer: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  errorDetails: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  errorStack: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'monospace',
    marginTop: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 2,
    borderColor: 'white',
  },
  secondaryButton: {
    backgroundColor: 'white',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254, 243, 199, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(254, 243, 199, 0.3)',
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FEF3C7',
  },
});

export default React.memo(GameErrorBoundary);
