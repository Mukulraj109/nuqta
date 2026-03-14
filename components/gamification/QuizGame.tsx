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
        setGameData(response.data);
        if (response.data.questions.length > 0) {
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
          setLastTournamentUpdate((response.data as any).tournamentUpdate);
        }

        // Update score and coins
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
          <ThemedText style={[styles.optionLabelText, isSelected && { color: '#FFFFFF' }]}>
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
      <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.scoreBox}>
            <Ionicons name="star" size={16} color="#FFFFFF" />
            <ThemedText style={styles.scoreText}>{score}</ThemedText>
          </View>
          <ThemedText style={styles.questionCounter}>
            {questionNumber}/{totalQuestions}
          </ThemedText>
          <View style={styles.coinsBox}>
            <Ionicons name="diamond" size={16} color="#FFFFFF" />
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
                  backgroundColor: timer <= 5 ? '#EF4444' : '#10B981',
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
            colors={selectedAnswer !== null ? ['#10B981', '#059669'] : ['#9CA3AF', '#6B7280']}
            style={styles.submitButtonGradient}
          >
            <ThemedText style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </ThemedText>
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  questionCounter: {
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 40,
  },
  scrollView: {
    flex: 1,
  },
  questionContainer: {
    margin: 20,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 26,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionButtonSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLabelSelected: {
    backgroundColor: '#8B5CF6',
  },
  optionLabelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#111827',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default React.memo(QuizGame);
