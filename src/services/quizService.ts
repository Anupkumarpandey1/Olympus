
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export interface QuizQuestion {
  question: string;
  options: {
    text: string;
    correct: boolean;
    explanation: string;
  }[];
}

export interface QuizData {
  questions: QuizQuestion[];
  title?: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
  creator_name?: string;
}

export interface QuizResult {
  questions: {
    questionNumber: number;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation?: string;
  }[];
  score: number;
  totalQuestions: number;
}

export interface LeaderboardEntry {
  id?: string;
  quiz_id?: string;
  username: string;
  score: number;
  totalQuestions: number;
  timestamp: number;
  quizResult?: QuizResult;
  earnedLearnPoint?: boolean;
  userId?: string;
}

// Save a new quiz to Supabase
export async function saveQuiz(quizData: QuizData, creatorName: string = ""): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        creator_name: creatorName,
        questions: quizData.questions as any,
        title: quizData.title || `Assessment (${new Date().toLocaleDateString()})`,
        description: quizData.description || '',
        difficulty: quizData.difficulty || 'medium',
        topic: quizData.topic || ''
      })
      .select('id')
      .single();

    if (error) {
      console.error("Error saving quiz:", error);
      throw new Error(`Failed to save quiz: ${error.message}`);
    }

    if (!data) {
      throw new Error("No data returned after saving quiz");
    }

    console.log("Quiz saved successfully with ID:", data.id);
    return data.id;
  } catch (error) {
    console.error("Exception when saving quiz:", error);
    throw error;
  }
}

// Get a quiz by ID
export async function getQuiz(quizId: string): Promise<QuizData | null> {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log("Quiz not found:", quizId);
        return null;
      }
      console.error("Error fetching quiz:", error);
      throw new Error(`Failed to fetch quiz: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Handle potential missing fields in the database
    return {
      questions: Array.isArray(data.questions) ? data.questions as unknown as QuizQuestion[] : [],
      title: data.title || undefined,
      description: (data as any).description || undefined,
      difficulty: (data as any).difficulty as 'easy' | 'medium' | 'hard' || 'medium',
      topic: (data as any).topic || undefined,
      creator_name: (data as any).creator_name || undefined
    };
  } catch (error) {
    console.error("Exception when fetching quiz:", error);
    throw error;
  }
}

// Save a score to the leaderboard
export async function saveScore(quizId: string, entry: LeaderboardEntry): Promise<void> {
  try {
    console.log("Saving score for quiz:", quizId, "Entry:", entry);
    
    // First, check if the user already has a higher score
    if (entry.username) {
      const { data: existingScores, error: checkError } = await supabase
        .from('scores')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('username', entry.username);
      
      if (checkError) {
        console.error("Error checking existing scores:", checkError);
      }
      
      if (existingScores && existingScores.length > 0) {
        const highestScore = Math.max(...existingScores.map(score => score.score));
        if (highestScore >= entry.score) {
          console.log("User already has a higher score, not saving new score");
          
          // Still award learn point if this is a first completion
          if (entry.earnedLearnPoint && entry.userId && !existingScores.some(score => (score.quiz_result as any)?.earnedLearnPoint)) {
            try {
              const { error: userError } = await supabase.rpc('increment_learn_point', {
                user_id: entry.userId
              });
              
              if (userError) {
                console.error("Error updating learn points:", userError);
              } else {
                console.log("Learn point added successfully");
              }
            } catch (learnPointError) {
              console.error("Error with learn points:", learnPointError);
            }
          }
          
          return;
        }
      }
    }
    
    // Save the score to the leaderboard
    const { error } = await supabase
      .from('scores')
      .insert({
        quiz_id: quizId,
        username: entry.username,
        score: entry.score,
        total_questions: entry.totalQuestions,
        timestamp: new Date(entry.timestamp).toISOString(),
        quiz_result: entry.quizResult as any
      });

    if (error) {
      console.error("Error saving score:", error);
      throw new Error(`Failed to save score: ${error.message}`);
    }

    console.log("Score saved successfully for quiz:", quizId);
    
    // Update user learn points if they completed an external quiz
    if (entry.earnedLearnPoint && entry.userId) {
      try {
        // Call RPC to increment learn point
        const { error: userError } = await supabase.rpc('increment_learn_point', {
          user_id: entry.userId
        });
        
        if (userError) {
          console.error("Error updating learn points:", userError);
        } else {
          console.log("Learn point added successfully");
        }
      } catch (learnPointError) {
        console.error("Error with learn points:", learnPointError);
        // Continue execution even if learn points update fails
      }
    }
  } catch (error) {
    console.error("Exception when saving score:", error);
    throw error;
  }
}

// Get leaderboard entries for a quiz
export async function getLeaderboard(quizId: string): Promise<LeaderboardEntry[]> {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('quiz_id', quizId)
      .order('score', { ascending: false });

    if (error) {
      console.error("Error fetching leaderboard:", error);
      throw new Error(`Failed to fetch leaderboard: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(item => ({
      id: item.id,
      quiz_id: item.quiz_id,
      username: item.username,
      score: item.score,
      totalQuestions: item.total_questions,
      timestamp: new Date(item.timestamp).getTime(),
      quizResult: item.quiz_result as unknown as QuizResult
    }));
  } catch (error) {
    console.error("Exception when fetching leaderboard:", error);
    throw error;
  }
}

// Get all quizzes created by a user
export async function getUserCreatedQuizzes(creatorName: string): Promise<QuizData[]> {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('creator_name', creatorName);

    if (error) {
      console.error("Error fetching user quizzes:", error);
      throw new Error(`Failed to fetch user quizzes: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(quiz => ({
      questions: Array.isArray(quiz.questions) ? quiz.questions as unknown as QuizQuestion[] : [],
      title: quiz.title || undefined,
      description: (quiz as any).description || undefined,
      difficulty: (quiz as any).difficulty as 'easy' | 'medium' | 'hard' || 'medium', 
      topic: (quiz as any).topic || undefined,
      creator_name: quiz.creator_name || undefined
    }));
  } catch (error) {
    console.error("Exception when fetching user quizzes:", error);
    throw error;
  }
}

// Get global leaderboard of participants by quiz
export async function getGlobalLeaderboard(): Promise<any[]> {
  try {
    // Get quiz participation counts
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        id,
        title,
        creator_name,
        difficulty,
        topic,
        created_at,
        scores:scores(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching global leaderboard:", error);
      throw new Error(`Failed to fetch global leaderboard: ${error.message}`);
    }

    return data.map(item => ({
      id: item.id,
      title: item.title,
      creator: item.creator_name,
      difficulty: item.difficulty,
      topic: item.topic,
      created_at: item.created_at,
      participants: item.scores?.[0]?.count || 0
    })) || [];
  } catch (error) {
    console.error("Exception when fetching global leaderboard:", error);
    throw error;
  }
}

// Get user learn points leaderboard
export async function getUserLearnPointsLeaderboard(): Promise<any[]> {
  try {
    // Create a custom RPC function to get learn points leaderboard
    const { data, error } = await supabase.rpc('get_learn_points_leaderboard');

    if (error) {
      console.error("Error fetching learn points leaderboard:", error);
      throw new Error(`Failed to fetch learn points leaderboard: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Exception when fetching learn points leaderboard:", error);
    throw error;
  }
}
