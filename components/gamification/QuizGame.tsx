// Quiz Game Component
// Interactive quiz game with timer and scoring

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { platformAlert } from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import gamificationAPI from '@/services/gamificationApi';
import type { QuizGame as QuizGameType, QuizQuestion } from '@/types/gamification.types';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

interface QuizGameProps {
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  onGameComplete?: (score: number, coinsEarned: number, tournamentUpdate?: any) => void;
}

function QuizGame({ difficulty, category, onGameComplete }: QuizGameProps) {
  const [gameData, setGameData] = useState<QuizGameType | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timer, setTimer] = useState(30);
  const [score, setScore] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [lastTournamentUpdate, setLastTournamentUpdate] = useState<any>(null);
  const isMounted = useIsMounted();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startQuiz();
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, []);

  // Start quiz
  const startQuiz = async () => {
    try {
      const response = await gamificationAPI.startQuiz(difficulty, category);
      if (response.success && response.data) {
        if (!isMounted()) return;
        setGameData(response.data);
        if (response.data.questions.length > 0) {
          if (!isMounted()) return;
          setCurrentQuestion(response.data.questions[0]);
          startTimer(response.data.questions[0].timeLimit);
        }
      }
    } catch (error: any) {
      platformAlert('Error', error.message || 'Failed to start quiz');
    }
  };

  // Start timer
  const startTimer = (timeLimit: number) => {
    setTimer(timeLimit);
    if (timerInterval.current) clearInterval(timerInterval.current);

    timerInterval.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle timeout
  const handleTimeout = () => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    platformAlert('Time\'s Up!', 'Moving to next question...', [
      { text: 'OK', onPress: () => submitAnswer(-1) },
    ]);
  };

  // Submit answer
  const submitAnswer = async (answerIndex: number) => {
    if (isSubmitting || !gameData || !currentQuestion) return;

    try {
      setIsSubmitting(true);
      if (timerInterval.current) clearInterval(timerInterval.current);

      const response = await gamificationAPI.submitQuizAnswer(
        gameData.id,
        currentQuestion.id,
        answerIndex
      );
      if (response.success && response.data) {
        const { isCorrect, coinsEarned, currentScore, nextQuestion, gameCompleted } = response.data;
        if ((response.data as any).tournamentUpdate) {
          if (!isMounted()) return;
          setLastTournamentUpdate((response.data as any).tournamentUpdate);
        }

        // Update score and coins
        if (!isMounted()) return;
        setScore(currentScore);
        if (coinsEarned > 0) {
          setTotalCoins((prev) => prev + coinsEarned);
        }

        // Show feedback
        const message = isCorrect
          ? `Correct! +${coinsEarned} coins 🎉`
          : `Wrong! The correct answer was: ${currentQuestion.options[currentQuestion.correctAnswer]}`;

        platformAlert(isCorrect ? 'Correct!' : 'Wrong!', message, [
          {
            text: 'Continue',
            onPress: () => {
              if (gameCompleted) {
                handleGameComplete();
              } else if (nextQuestion) {
                if (!isMounted()) return;
                setCurrentQuestion(nextQuestion);
                setSelectedAnswer(null);
                startTimer(nextQuestion.timeLimit);
              }
            },
          },
        ]);
      }
    } catch (error: any) {
      platformAlert('Error', error.message || 'Failed to submit answer');
    } finally {
      if (!isMounted()) return;
      setIsSubmitting(false);
    }
  };

  // Handle game complete
  const handleGameComplete = () => {
    if (timerInterval.current) clearInterval(timerInterval.current);

    platformAlert(
      'Quiz Complete! 🎉',
      `Final Score: ${score}\nTotal Coins Earned: ${totalCoins}`,
      [
        {
          text: 'Great!',
          onPress: () => {
            onGameComplete?.(score, totalCoins, lastTournamentUpdate);
          },
        },
      ]
    );
  };

  // Render option button
  const renderOption = (option: string, index: number) => {
    const isSelected = selectedAnswer === index;
    const optionLabels = ['A', 'B', 'C', 'D'];

    return (
      <Pressable
        key={index}
        style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
        onPress={() => setSelectedAnswer(index)}
        disabled={isSubmitting}
      >
        <View style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
          <ThemedText style={[styles.optionLabelText, isSelected && { color: colors.background.primary }]}>
            {optionLabels[index]}
          </ThemedText>
        </View>
        <ThemedText style={[styles.optionText, isSelected && styles.optionTextSelected]}>
          {option}
        </ThemedText>
      </Pressable>
    );
  };

  if (!currentQuestion) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText>Loading quiz...</ThemedText>
      </View>
    );
  }

  const questionNumber = (gameData?.currentQuestionIndex || 0) + 1;
  const totalQuestions = gameData?.questions.length || 1;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[colors.brand.purpleLight, colors.brand.purple]} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.scoreBox}>
            <Ionicons name="star" size={16} color={colors.background.primary} />
            <ThemedText style={styles.scoreText}>{score}</ThemedText>
          </View>
          <ThemedText style={styles.questionCounter}>
            {questionNumber}/{totalQuestions}
          </ThemedText>
          <View style={styles.coinsBox}>
            <Ionicons name="diamond" size={16} color={colors.background.primary} />
            <ThemedText style={styles.coinsText}>{totalCoins}</ThemedText>
          </View>
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <View style={styles.timerBar}>
            <View
              style={[
                styles.timerProgress,
                {
                  width: `${(timer / (currentQuestion?.timeLimit || 30)) * 100}%`,
                  backgroundColor: timer <= 5 ? colors.error : colors.successScale[400],
                },
              ]}
            />
          </View>
          <ThemedText style={styles.timerText}>{timer}s</ThemedText>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Question */}
        <View style={styles.questionContainer}>
          <View style={styles.difficultyBadge}>
            <ThemedText style={styles.difficultyText}>
              {currentQuestion.difficulty.toUpperCase()}
            </ThemedText>
          </View>
          <ThemedText style={styles.questionText}>{currentQuestion.question}</ThemedText>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => renderOption(option, index))}
        </View>

        {/* Submit Button */}
        <Pressable
          style={[
            styles.submitButton,
            (selectedAnswer === null || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={() => selectedAnswer !== null && submitAnswer(selectedAnswer)}
          disabled={selectedAnswer === null || isSubmitting}
        >
          <LinearGradient
            colors={selectedAnswer !== null ? [colors.successScale[400], colors.successScale[700]] : [colors.neutral[400], colors.neutral[500]]}
            style={styles.submitButtonGradient}
          >
            <ThemedText style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </ThemedText>
            <Ionicons name="checkmark-circle" size={24} color={colors.background.primary} />
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  scoreText: {
    color: colors.background.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  questionCounter: {
    color: colors.background.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  coinsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  coinsText: {
    color: colors.background.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timerBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  timerProgress: {
    height: '100%',
    borderRadius: 4,
  },
  timerText: {
    color: colors.background.primary,
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 40,
  },
  scrollView: {
    flex: 1,
  },
  questionContainer: {
    margin: 20,
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.neutral[500],
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[900],
    lineHeight: 26,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionButtonSelected: {
    borderColor: colors.brand.purpleLight,
    backgroundColor: colors.tint.purpleLight,
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLabelSelected: {
    backgroundColor: colors.brand.purpleLight,
  },
  optionLabelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.neutral[500],
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: colors.neutral[700],
  },
  optionTextSelected: {
    color: colors.neutral[900],
    fontWeight: '600',
  },
  submitButton: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  submitButtonText: {
    color: colors.background.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default React.memo(QuizGame);
