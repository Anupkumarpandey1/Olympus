
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";

// Firebase configuration - these are public keys, so it's safe to include them in the client code
const firebaseConfig = {
  apiKey: "AIzaSyDdxOWlF_HWMDfYHOXS5dL19N8_pFuT77E",
  authDomain: "quiz-app-lovable.firebaseapp.com",
  projectId: "quiz-app-lovable",
  storageBucket: "quiz-app-lovable.appspot.com",
  messagingSenderId: "412377112590",
  appId: "1:412377112590:web:8b2d346f0f1c7d09f3f03a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase initialized with project:", firebaseConfig.projectId);

interface QuizQuestion {
  question: string;
  options: {
    text: string;
    correct: boolean;
    explanation: string;
  }[];
}

export interface QuizData {
  questions: QuizQuestion[];
  createdAt: Timestamp;
}

export interface LeaderboardEntry {
  username: string;
  score: number;
  totalQuestions: number;
  timestamp: number;
}

// Save a new quiz to Firestore
export const saveQuiz = async (quizData: { questions: QuizQuestion[] }, quizId: string): Promise<void> => {
  try {
    console.log("Saving quiz to Firestore with ID:", quizId);
    
    const quizWithTimestamp: QuizData = {
      ...quizData,
      createdAt: Timestamp.now()
    };
    
    await setDoc(doc(db, "quizzes", quizId), quizWithTimestamp);
    console.log("Quiz saved successfully with ID:", quizId);
  } catch (error) {
    console.error("Error saving quiz:", error);
    throw error;
  }
};

// Get a quiz by ID - improved error handling and logging
export const getQuiz = async (quizId: string): Promise<QuizData | null> => {
  try {
    console.log("Fetching quiz from Firestore with ID:", quizId);
    const docRef = doc(db, "quizzes", quizId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log("Quiz found, returning data");
      const quizData = docSnap.data() as QuizData;
      
      // Validate quiz data structure
      if (!quizData.questions || !Array.isArray(quizData.questions)) {
        console.error("Invalid quiz data format:", quizData);
        return null;
      }
      
      return quizData;
    } else {
      console.log("No quiz found with ID:", quizId);
      return null;
    }
  } catch (error) {
    console.error("Error getting quiz:", error);
    throw error;
  }
};

// Save a score to the leaderboard for a specific quiz
export const saveScore = async (
  quizId: string, 
  entry: LeaderboardEntry
): Promise<void> => {
  try {
    console.log("Saving score to leaderboard for quiz ID:", quizId);
    const leaderboardRef = doc(db, "leaderboards", quizId);
    const leaderboardSnap = await getDoc(leaderboardRef);
    
    if (leaderboardSnap.exists()) {
      // Leaderboard exists, add new entry
      await updateDoc(leaderboardRef, {
        entries: arrayUnion(entry)
      });
      console.log("Score added to existing leaderboard for quiz:", quizId);
    } else {
      // Create new leaderboard with this entry
      await setDoc(leaderboardRef, {
        entries: [entry]
      });
      console.log("New leaderboard created with first score for quiz:", quizId);
    }
  } catch (error) {
    console.error("Error saving score:", error);
    throw error;
  }
};

// Get the leaderboard for a specific quiz
export const getLeaderboard = async (quizId: string): Promise<LeaderboardEntry[]> => {
  try {
    console.log("Fetching leaderboard for quiz ID:", quizId);
    const leaderboardRef = doc(db, "leaderboards", quizId);
    const leaderboardSnap = await getDoc(leaderboardRef);
    
    if (leaderboardSnap.exists()) {
      const data = leaderboardSnap.data();
      console.log(`Leaderboard found with ${data.entries?.length || 0} entries`);
      return data.entries as LeaderboardEntry[] || [];
    } else {
      console.log("No leaderboard found for quiz:", quizId);
      return [];
    }
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    throw error;
  }
};

export default db;
