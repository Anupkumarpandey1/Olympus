import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuiz, saveScore, LeaderboardEntry, QuizResult, getLeaderboard } from '@/services/quizService';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import QuizDisplay from '@/components/QuizDisplay';
import LeaderboardDisplay from '@/components/LeaderboardDisplay';
import QuizShareDialog from '@/components/QuizShareDialog';
import { useAuth } from '@/contexts/AuthContext';

const QuizPage = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);
  const [isExternalQuiz, setIsExternalQuiz] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    if (!quizId) {
      setError("No quiz ID provided");
      setLoading(false);
      return;
    }
    
    const fetchQuiz = async () => {
      try {
        const quizData = await getQuiz(quizId);
        
        if (!quizData) {
          setError("Quiz not found");
          setLoading(false);
          return;
        }
        
        setQuiz(quizData);
        
        if (user && quizData.creator_name && quizData.creator_name !== user.email?.split('@')[0] && 
            quizData.creator_name !== user.user_metadata?.full_name) {
          setIsExternalQuiz(true);
        }
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError("Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuiz();
    
    if (user) {
      const displayName = user.user_metadata?.full_name || 
                         user.email?.split('@')[0] || 
                         user.email || 
                         '';
      
      setUsername(displayName);
      setUsernameSaved(true);
    }
  }, [quizId, user]);

  useEffect(() => {
    if (quizId && (showLeaderboard || leaderboardLoaded)) {
      const loadLeaderboard = async () => {
        try {
          const data = await getLeaderboard(quizId);
          setLeaderboardData(data);
        } catch (error) {
          console.error("Error loading leaderboard:", error);
        }
      };
      
      loadLeaderboard();
    }
  }, [quizId, showLeaderboard, leaderboardLoaded]);

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username.trim().length < 2) {
      toast({
        title: "Username too short",
        description: "Please enter a name with at least 2 characters",
        variant: "destructive"
      });
      return;
    }
    
    setUsernameSaved(true);
  };

  const handleChangeUsername = () => {
    setUsernameSaved(false);
  };

  const handleQuizReset = () => {
    window.location.reload();
  };

  const handleScoreSubmit = async (score: number, totalQuestions: number, quizResult: QuizResult) => {
    if (!quizId || !username) return;
    
    try {
      setScore(score);
      setTotalQuestions(totalQuestions);
      
      const entry: LeaderboardEntry = {
        username,
        score,
        totalQuestions,
        timestamp: Date.now(),
        quizResult,
        earnedLearnPoint: isExternalQuiz && !!user,
        userId: user?.id
      };
      
      await saveScore(quizId, entry);
      
      toast({
        title: "Score saved!",
        description: `Your score of ${score}/${totalQuestions} has been saved.`
      });
      
      if (isExternalQuiz && user) {
        toast({
          title: "+1 Learn Point",
          description: "You earned a Learn Point for completing this assessment!",
          variant: "default"
        });
      }
      
      setLeaderboardLoaded(true);
    } catch (error) {
      console.error("Error saving score:", error);
      toast({
        title: "Failed to save score",
        description: "There was an error saving your score. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleLeaderboard = () => {
    setShowLeaderboard(prev => !prev);
    setLeaderboardLoaded(true);
  };

  const toggleShareDialog = () => {
    setShowShareDialog(prev => !prev);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="container mx-auto px-4 py-24">
          <Skeleton className="h-[600px] w-full max-w-4xl mx-auto rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-xl mb-8">{error}</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-24">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold gradient-text">
            {quiz.title || "Assessment"}
          </h1>
          
          {isExternalQuiz && (
            <div className="ml-3 px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-md">
              External Assessment
            </div>
          )}
          
          <div className="ml-auto flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleLeaderboard}
            >
              {showLeaderboard ? "Hide Leaderboard" : "Show Leaderboard"}
            </Button>
            <a 
              href="https://quiznect-genius.lovable.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button 
                variant="outline" 
                size="sm"
              >
                Barrack
              </Button>
            </a>
          </div>
        </div>
        
        <div className="w-full max-w-4xl mx-auto">
          {!usernameSaved ? (
            <motion.div 
              className="p-8 bg-white rounded-xl shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-6">Enter Your Name</h2>
              <form onSubmit={handleUsernameSubmit} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Name or Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full"
                    autoFocus
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This will be displayed on the leaderboard
                  </p>
                </div>
                <Button type="submit" className="w-full">
                  Start Assessment
                </Button>
              </form>
            </motion.div>
          ) : showLeaderboard ? (
            <div className="space-y-4">
              <LeaderboardDisplay 
                leaderboard={leaderboardData} 
                onBackToQuiz={toggleLeaderboard}
                quizId={quizId}
              />
            </div>
          ) : (
            <QuizDisplay 
              quiz={quiz} 
              onReset={handleQuizReset} 
              username={username}
              onScoreSubmit={handleScoreSubmit}
              creatorName={quiz.creator_name}
            />
          )}
        </div>
      </div>
      
      {showShareDialog && (
        <QuizShareDialog 
          quizId={quizId || ""} 
          quizTitle={quiz.title || "Assessment"} 
          onClose={() => setShowShareDialog(false)}
          username={username}
          score={score}
          totalQuestions={totalQuestions}
        />
      )}
    </div>
  );
};

export default QuizPage;
