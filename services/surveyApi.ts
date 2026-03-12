export interface Survey {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  category: string;
  subcategory?: string;
  reward: number;
  estimatedTime: number;
  questionsCount: number;
  status: string;
  sponsor?: {
    name: string;
    logo: string;
  };
  expiresAt?: string;
  completedCount: number;
  targetResponses: number;
  isFeatured: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface SurveyDetail extends Survey {
  questions: SurveyQuestion[];
  instructions?: string[];
  userStatus: 'not_started' | 'in_progress' | 'completed';
  existingSession?: {
    sessionId: string;
    currentQuestionIndex: number;
    answeredCount: number;
  };
  allowSkip: boolean;
  randomizeQuestions: boolean;
  showProgress: boolean;
}

export interface SurveyQuestion {
  id: string;
  type: 'multiple_choice' | 'single_choice' | 'rating' | 'text' | 'scale';
  question: string;
  options?: string[];
  required: boolean;
  order: number;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
}

export interface SurveyCategory {
  name: string;
  count: number;
}

export interface UserSurveyStats {
  totalEarned: number;
  surveysCompleted: number;
  averageTime: number;
  completionRate: number;
  streak?: number;
}

export interface SurveyAnswer {
  questionId: string;
  answer: string | string[] | number;
}

export interface SurveySession {
  sessionId: string;
  currentQuestionIndex: number;
  answers: SurveyAnswer[];
  resumed: boolean;
}

export interface SurveySubmitResult {
  sessionId: string;
  coinsEarned: number;
  timeSpent: number;
  qualityScore: number;
  completedAt: string;
}

export interface SurveyHistoryItem {
  sessionId: string;
  survey: {
    _id: string;
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    reward: number;
  } | null;
  coinsEarned: number;
  timeSpent: number;
  completedAt: string;
}

class SurveyApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';
  }

  /**
   * Get all surveys with optional filters
   */
  async getSurveys(category?: string, limit = 50, offset = 0): Promise<Survey[]> {
    try {
      const queryParams = new URLSearchParams();
      if (category && category !== 'All') {
        queryParams.append('category', category);
      }
      queryParams.append('limit', limit.toString());
      queryParams.append('offset', offset.toString());

      const response = await fetch(`${this.baseUrl}/surveys?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch surveys');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get survey categories with counts
   */
  async getCategories(): Promise<SurveyCategory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/surveys/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch categories');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's survey statistics
   */
  async getUserStats(): Promise<UserSurveyStats> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        // Return default stats for unauthenticated users
        return {
          totalEarned: 0,
          surveysCompleted: 0,
          averageTime: 0,
          completionRate: 100,
          streak: 0,
        };
      }

      const response = await fetch(`${this.baseUrl}/surveys/user/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Return default stats on error
        return {
          totalEarned: 0,
          surveysCompleted: 0,
          averageTime: 0,
          completionRate: 100,
          streak: 0,
        };
      }

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        return {
          totalEarned: 0,
          surveysCompleted: 0,
          averageTime: 0,
          completionRate: 100,
          streak: 0,
        };
      }
    } catch (error) {
      // Return default stats on error
      return {
        totalEarned: 0,
        surveysCompleted: 0,
        averageTime: 0,
        completionRate: 100,
        streak: 0,
      };
    }
  }

  /**
   * Get user's survey history
   */
  async getUserHistory(limit = 50, offset = 0): Promise<{ surveys: SurveyHistoryItem[], total: number, hasMore: boolean }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit.toString());
      queryParams.append('offset', offset.toString());

      const response = await fetch(`${this.baseUrl}/surveys/user/history?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch history');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get survey by ID with full details
   */
  async getSurveyById(surveyId: string): Promise<SurveyDetail> {
    try {
      const token = await this.getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/surveys/${surveyId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch survey');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Start a survey session
   */
  async startSurvey(surveyId: string): Promise<SurveySession> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/surveys/${surveyId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start survey');
      }

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to start survey');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Submit survey answers
   */
  async submitSurvey(surveyId: string, answers: SurveyAnswer[]): Promise<SurveySubmitResult> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/surveys/${surveyId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit survey');
      }

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to submit survey');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save survey progress
   */
  async saveProgress(surveyId: string, answers: SurveyAnswer[], currentQuestionIndex: number): Promise<{ sessionId: string, savedAnswers: number, currentQuestionIndex: number }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/surveys/${surveyId}/save-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ answers, currentQuestionIndex }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save progress');
      }

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to save progress');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Abandon survey
   */
  async abandonSurvey(surveyId: string): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.baseUrl}/surveys/${surveyId}/abandon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to abandon survey');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get authentication token
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const { getAuthToken } = await import('@/utils/authStorage');
      const token = await getAuthToken();
      return token;
    } catch (error) {
      return null;
    }
  }
}

// Create singleton instance
const surveyApiService = new SurveyApiService();

export default surveyApiService;
export { SurveyApiService };
