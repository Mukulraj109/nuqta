// Progress Steps Component
// Multi-step wizard progress indicator

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

export interface Step {
  id: string;
  title: string;
  icon: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
}

export default function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  const renderStep = (step: Step, index: number) => {
    const isCompleted = index < currentStep;
    const isCurrent = index === currentStep;
    const isUpcoming = index > currentStep;

    const stepStatus = isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming';
    const accessibilityLabel = `Step ${index + 1} of ${steps.length}: ${step.title}. Status: ${stepStatus}`;

    return (
      <View
        key={step.id}
        style={styles.stepContainer}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="progressbar"
        accessible={true}
      >
        {/* Step Circle */}
        <View style={styles.stepCircleContainer}>
          <View
            style={[
              styles.stepCircle,
              isCompleted && styles.stepCircleCompleted,
              isCurrent && styles.stepCircleCurrent,
              isUpcoming && styles.stepCircleUpcoming,
            ]}
          >
            {isCompleted ? (
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            ) : (
              <ThemedText
                style={[
                  styles.stepNumber,
                  isCurrent && styles.stepNumberCurrent,
                  isUpcoming && styles.stepNumberUpcoming,
                ]}
              >
                {index + 1}
              </ThemedText>
            )}
          </View>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <View
              style={[
                styles.connector,
                isCompleted && styles.connectorCompleted,
              ]}
            />
          )}
        </View>

        {/* Step Label */}
        <ThemedText
          style={[
            styles.stepTitle,
            isCurrent && styles.stepTitleCurrent,
            isUpcoming && styles.stepTitleUpcoming,
          ]}
        >
          {step.title}
        </ThemedText>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {steps.map((step, index) => renderStep(step, index))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepCircleContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
  },
  stepCircleCurrent: {
    backgroundColor: '#8B5CF6',
  },
  stepCircleUpcoming: {
    backgroundColor: '#E5E7EB',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepNumberCurrent: {
    color: '#FFFFFF',
  },
  stepNumberUpcoming: {
    color: '#9CA3AF',
  },
  connector: {
    position: 'absolute',
    left: 19,
    top: 40,
    width: 2,
    height: 40,
    backgroundColor: '#E5E7EB',
    zIndex: 1,
  },
  connectorCompleted: {
    backgroundColor: '#10B981',
  },
  stepTitle: {
    fontSize: 14,
    marginLeft: 4,
  },
  stepTitleCurrent: {
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  stepTitleUpcoming: {
    color: '#9CA3AF',
  },
});
