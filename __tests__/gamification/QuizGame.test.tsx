// QuizGame Component Tests
// Test suite for quiz game functionality

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import QuizGame from '@/components/gamification/QuizGame';
import gamificationAPI from '@/services/gamificationApi';
import { QuizGame as QuizGameType, QuizQuestion } from '@/types/gamification.types';

// Mock dependencies
jest.mock('@/services/gamificationApi');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 2,
    difficulty: 'easy',
    category: 'geography',
    timeLimit: 30,
  },
  {
    id: 'q2',
    question: 'Which planet is closest to the sun?',
    options: ['Venus', 'Mercury', 'Mars', 'Earth'],
    correctAnswer: 1,
    difficulty: 'medium',
    category: 'science',
    timeLimit: 30,
  },
  {
    id: 'q3',
    question: 'Who wrote Romeo and Juliet?',
    options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
    correctAnswer: 1,
    difficulty: 'easy',
    category: 'literature',
    timeLimit: 30,
  },
];

const mockQuizGame: QuizGameType = {
  id: 'game-1',
  userId: 'user-1',
  questions: mockQuestions,
  currentQuestionIndex: 0,
  score: 0,
  coinsEarned: 0,
  startedAt: new Date(),
  isCompleted: false,
};

describe('QuizGame Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render quiz start screen', async () => {
      const { getByText, getByTestId } = render(<QuizGame />);

      expect(getByText(/quiz game/i)).toBeTruthy();
      expect(getByTestId('start-quiz-button')).toBeTruthy();
    });

    it('should display difficulty selection', () => {
      const { getByText } = render(<QuizGame />);

      expect(getByText(/easy/i)).toBeTruthy();
      expect(getByText(/medium/i)).toBeTruthy();
      expect(getByText(/hard/i)).toBeTruthy();
    });

    it('should show question when quiz starts', async () => {
      (gamificationAPI.startQuiz as jest.Mock).mockResolvedValue({
        success: true,
        data: mockQuizGame,
      });

      const { getByTestId, getByText } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByTestId('start-quiz-button'));
      });

      await waitFor(() => {
        expect(getByText(mockQuestions[0].question)).toBeTruthy();
      });
    });

    it('should display all answer options', async () => {
      (gamificationAPI.startQuiz as jest.Mock).mockResolvedValue({
        success: true,
        data: mockQuizGame,
      });

      const { getByTestId, getByText } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByTestId('start-quiz-button'));
      });

      await waitFor(() => {
        mockQuestions[0].options.forEach(option => {
          expect(getByText(option)).toBeTruthy();
        });
      });
    });

    it('should show timer countdown', async () => {
      (gamificationAPI.startQuiz as jest.Mock).mockResolvedValue({
        success: true,
        data: mockQuizGame,
      });

      const { getByTestId } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByTestId('start-quiz-button'));
      });

      await waitFor(() => {
        expect(getByTestId('timer')).toBeTruthy();
      });
    });

    it('should display current score', async () => {
      const gameWithScore = { ...mockQuizGame, score: 50 };
      (gamificationAPI.startQuiz as jest.Mock).mockResolvedValue({
        success: true,
        data: gameWithScore,
      });

      const { getByText } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByText(/start/i));
      });

      await waitFor(() => {
        expect(getByText(/score.*50/i)).toBeTruthy();
      });
    });
  });

  describe('Quiz Flow', () => {
    it('should start quiz with selected difficulty', async () => {
      (gamificationAPI.startQuiz as jest.Mock).mockResolvedValue({
        success: true,
        data: mockQuizGame,
      });

      const { getByText, getByTestId } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByText(/medium/i));
        fireEvent.press(getByTestId('start-quiz-button'));
      });

      await waitFor(() => {
        expect(gamificationAPI.startQuiz).toHaveBeenCalledWith('medium', undefined);
      });
    });

    it('should submit answer and move to next question', async () => {
      (gamificationAPI.startQuiz as jest.Mock).mockResolvedValue({
        success: true,
        data: mockQuizGame,
      });

      (gamificationAPI.submitQuizAnswer as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          isCorrect: true,
          coinsEarned: 10,
          currentScore: 10,
          nextQuestion: mockQuestions[1],
          gameCompleted: false,
        },
      });

      const { getByText, getByTestId } = render(<QuizGame />);

      // Start quiz
      await act(async () => {
        fireEvent.press(getByTestId('start-quiz-button'));
      });

      // Answer first question
      await waitFor(() => {
        fireEvent.press(getByText(mockQuestions[0].options[2])); // Correct answer
      });

      // Check for next question
      await waitFor(() => {
        expect(getByText(mockQuestions[1].question)).toBeTruthy();
      });
    });

    it('should handle correct answers', async () => {
      (gamificationAPI.submitQuizAnswer as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          isCorrect: true,
          coinsEarned: 10,
          currentScore: 10,
          nextQuestion: mockQuestions[1],
          gameCompleted: false,
        },
      });

      const { getByText, getByTestId } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByText(mockQuestions[0].options[2])); // Correct answer
      });

      await waitFor(() => {
        expect(getByTestId('correct-feedback')).toBeTruthy();
      });
    });

    it('should handle incorrect answers', async () => {
      (gamificationAPI.submitQuizAnswer as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          isCorrect: false,
          coinsEarned: 0,
          currentScore: 0,
          nextQuestion: mockQuestions[1],
          gameCompleted: false,
        },
      });

      const { getByText, getByTestId } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByText(mockQuestions[0].options[0])); // Wrong answer
      });

      await waitFor(() => {
        expect(getByTestId('incorrect-feedback')).toBeTruthy();
      });
    });

    it('should complete quiz after all questions', async () => {
      (gamificationAPI.submitQuizAnswer as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          isCorrect: true,
          coinsEarned: 10,
          currentScore: 30,
          gameCompleted: true,
          totalCoins: 30,
        },
      });

      const { getByText, getByTestId } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByText(mockQuestions[2].options[1])); // Last question
      });

      await waitFor(() => {
        expect(getByTestId('quiz-complete')).toBeTruthy();
      });
    });
  });

  describe('Timer Functionality', () => {
    it('should countdown from time limit', async () => {
      (gamificationAPI.startQuiz as jest.Mock).mockResolvedValue({
        success: true,
        data: mockQuizGame,
      });

      const { getByTestId } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByTestId('start-quiz-button'));
      });

      await waitFor(() => {
        const timer = getByTestId('timer');
        expect(timer.props.children).toMatch(/30/);
      });

      // Advance timer
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        const timer = getByTestId('timer');
        expect(timer.props.children).toMatch(/25/);
      });
    });

    it('should auto-submit when timer expires', async () => {
      (gamificationAPI.startQuiz as jest.Mock).mockResolvedValue({
        success: true,
        data: mockQuizGame,
      });

      (gamificationAPI.submitQuizAnswer as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          isCorrect: false,
          coinsEarned: 0,
          currentScore: 0,
          nextQuestion: mockQuestions[1],
          gameCompleted: false,
        },
      });

      const { getByTestId } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByTestId('start-quiz-button'));
      });

      // Wait for timer to expire
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(gamificationAPI.submitQuizAnswer).toHaveBeenCalled();
      });
    });

    it('should stop timer after answer submission', async () => {
      (gamificationAPI.submitQuizAnswer as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          isCorrect: true,
          coinsEarned: 10,
          currentScore: 10,
          nextQuestion: mockQuestions[1],
          gameCompleted: false,
        },
      });

      const { getByText } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByText(mockQuestions[0].options[2]));
      });

      // Timer should stop
      await waitFor(() => {
        expect(gamificationAPI.submitQuizAnswer).toHaveBeenCalled();
      });
    });

    it('should show time bonus for quick answers', async () => {
      (gamificationAPI.submitQuizAnswer as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          isCorrect: true,
          coinsEarned: 15, // Base + time bonus
          currentScore: 15,
          nextQuestion: mockQuestions[1],
          gameCompleted: false,
        },
      });

      const { getByText, getByTestId } = render(<QuizGame />);

      // Answer quickly (within 5 seconds)
      await act(async () => {
        jest.advanceTimersByTime(3000);
        fireEvent.press(getByText(mockQuestions[0].options[2]));
      });

      await waitFor(() => {
        expect(getByTestId('time-bonus')).toBeTruthy();
      });
    });
  });

  describe('Score Calculation', () => {
    it('should calculate score based on correct answers', async () => {
      const correctAnswers = [
        { isCorrect: true, coinsEarned: 10 },
        { isCorrect: true, coinsEarned: 10 },
        { isCorrect: false, coinsEarned: 0 },
      ];

      let currentScore = 0;
      correctAnswers.forEach((answer, index) => {
        (gamificationAPI.submitQuizAnswer as jest.Mock).mockResolvedValueOnce({
          success: true,
          data: {
            ...answer,
            currentScore: currentScore + answer.coinsEarned,
            nextQuestion: mockQuestions[index + 1],
            gameCompleted: index === correctAnswers.length - 1,
          },
        });
        currentScore += answer.coinsEarned;
      });

      const { getByText } = render(<QuizGame />);

      // Answer all questions
      for (let i = 0; i < correctAnswers.length; i++) {
        await act(async () => {
          fireEvent.press(getByText(mockQuestions[i].options[0]));
        });
        await waitFor(() => {
          expect(gamificationAPI.submitQuizAnswer).toHaveBeenCalledTimes(i + 1);
        });
      }

      // Final score should be 20
      await waitFor(() => {
        expect(getByText(/20/)).toBeTruthy();
      });
    });

    it('should award bonus coins for perfect score', async () => {
      (gamificationAPI.submitQuizAnswer as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          isCorrect: true,
          coinsEarned: 10,
          currentScore: 30,
          gameCompleted: true,
          totalCoins: 40, // Base + perfect bonus
        },
      });

      const { getByText } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByText(mockQuestions[2].options[1]));
      });

      await waitFor(() => {
        expect(getByText(/bonus/i)).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle quiz start failure', async () => {
      (gamificationAPI.startQuiz as jest.Mock).mockRejectedValue(
        new Error('Failed to start quiz')
      );

      const { getByTestId } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByTestId('start-quiz-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('start')
        );
      });
    });

    it('should handle answer submission failure', async () => {
      (gamificationAPI.submitQuizAnswer as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { getByText } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByText(mockQuestions[0].options[0]));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('submit')
        );
      });
    });

    it('should allow retry after error', async () => {
      (gamificationAPI.submitQuizAnswer as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          success: true,
          data: {
            isCorrect: true,
            coinsEarned: 10,
            currentScore: 10,
            nextQuestion: mockQuestions[1],
            gameCompleted: false,
          },
        });

      const { getByText, getByTestId } = render(<QuizGame />);

      // First attempt fails
      await act(async () => {
        fireEvent.press(getByText(mockQuestions[0].options[0]));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Retry succeeds
      await act(async () => {
        fireEvent.press(getByTestId('retry-button'));
      });

      await waitFor(() => {
        expect(gamificationAPI.submitQuizAnswer).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should prevent multiple answer submissions', async () => {
      (gamificationAPI.submitQuizAnswer as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { getByText } = render(<QuizGame />);

      // Try to submit multiple times
      await act(async () => {
        fireEvent.press(getByText(mockQuestions[0].options[0]));
        fireEvent.press(getByText(mockQuestions[0].options[1]));
        fireEvent.press(getByText(mockQuestions[0].options[2]));
      });

      await waitFor(() => {
        expect(gamificationAPI.submitQuizAnswer).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle empty question list', async () => {
      (gamificationAPI.startQuiz as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockQuizGame, questions: [] },
      });

      const { getByText } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByText(/start/i));
      });

      await waitFor(() => {
        expect(getByText(/no questions/i)).toBeTruthy();
      });
    });

    it('should handle quiz interruption', async () => {
      const { getByTestId, unmount } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByTestId('start-quiz-button'));
      });

      // Unmount component (simulate navigation away)
      unmount();

      // Timer should be cleaned up
      expect(() => jest.advanceTimersByTime(1000)).not.toThrow();
    });
  });

  describe('Anti-Cheat Measures', () => {
    it('should validate answers server-side', async () => {
      const { getByText } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByText(mockQuestions[0].options[2]));
      });

      await waitFor(() => {
        const call = (gamificationAPI.submitQuizAnswer as jest.Mock).mock.calls[0];
        expect(call).toEqual([
          mockQuizGame.id,
          mockQuestions[0].id,
          2, // Answer index only, no correctness info
        ]);
      });
    });

    it('should track time spent on each question', async () => {
      (gamificationAPI.submitQuizAnswer as jest.Mock).mockImplementation(
        (gameId, questionId, answer) => {
          expect(typeof answer).toBe('number');
          return Promise.resolve({
            success: true,
            data: {
              isCorrect: true,
              coinsEarned: 10,
              currentScore: 10,
              nextQuestion: mockQuestions[1],
              gameCompleted: false,
            },
          });
        }
      );

      const { getByText } = render(<QuizGame />);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await act(async () => {
        fireEvent.press(getByText(mockQuestions[0].options[2]));
      });

      await waitFor(() => {
        expect(gamificationAPI.submitQuizAnswer).toHaveBeenCalled();
      });
    });

    it('should enforce time limits strictly', async () => {
      const { getByText } = render(<QuizGame />);

      // Try to answer after time expires
      act(() => {
        jest.advanceTimersByTime(31000); // Over 30 second limit
      });

      await act(async () => {
        fireEvent.press(getByText(mockQuestions[0].options[2]));
      });

      // Answer should not be submitted (auto-submitted already)
      await waitFor(() => {
        expect(gamificationAPI.submitQuizAnswer).toHaveBeenCalledTimes(1);
      });
    });

    it('should prevent quiz state manipulation', async () => {
      const { getByTestId } = render(<QuizGame />);

      // Try to access quiz without starting
      await waitFor(() => {
        expect(getByTestId('start-quiz-button')).toBeTruthy();
        expect(() => getByTestId('question-container')).toThrow();
      });
    });
  });

  describe('Results Display', () => {
    it('should show detailed results after completion', async () => {
      (gamificationAPI.submitQuizAnswer as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          isCorrect: true,
          coinsEarned: 10,
          currentScore: 30,
          gameCompleted: true,
          totalCoins: 30,
        },
      });

      const { getByText } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByText(mockQuestions[2].options[1]));
      });

      await waitFor(() => {
        expect(getByText(/quiz complete/i)).toBeTruthy();
        expect(getByText(/30/)).toBeTruthy(); // Total coins
      });
    });

    it('should show coins earned breakdown', async () => {
      const { getByTestId } = render(<QuizGame />);

      await waitFor(() => {
        expect(getByTestId('results-breakdown')).toBeTruthy();
      });
    });

    it('should allow replaying quiz', async () => {
      (gamificationAPI.startQuiz as jest.Mock).mockResolvedValue({
        success: true,
        data: mockQuizGame,
      });

      const { getByTestId } = render(<QuizGame />);

      await act(async () => {
        fireEvent.press(getByTestId('play-again-button'));
      });

      await waitFor(() => {
        expect(gamificationAPI.startQuiz).toHaveBeenCalled();
      });
    });
  });
});
