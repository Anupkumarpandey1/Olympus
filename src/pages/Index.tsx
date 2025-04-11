
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LandingSection from '@/components/LandingSection';
import AssessmentGenerator from '@/components/QuizGenerator';
import QuizDisplay from '@/components/QuizDisplay';
import TeacherChat from '@/components/TeacherChat';
import MasterChat from '@/components/MasterChat';
import LeaderboardDisplay from '@/components/LeaderboardDisplay';
import QuizShareDialog from '@/components/QuizShareDialog';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Share2, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { 
  saveQuiz, 
  getQuiz, 
  saveScore, 
  getLeaderboard, 
  type LeaderboardEntry, 
  type QuizData 
} from '@/services/quizService';
import { useAuth } from '@/contexts/AuthContext';

const LEADERBOARD_POLL_INTERVAL = 5000; // Poll for leaderboard updates every 5 seconds

const Index = () => {
  const [showQuizSection, setShowQuizSection] = useState(false);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [username, setUsername] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [usernameRequired, setUsernameRequired] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState<string>('');
  const [liveLeaderboardVisible, setLiveLeaderboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMasterChat, setShowMasterChat] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    const checkForSharedQuiz = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const sharedParam = urlParams.get('share');
        const quizId = urlParams.get('quizId');
        
        if (sharedParam === 'true' && quizId) {
          console.log("Found shared quiz in URL, redirecting to:", quizId);
          navigate(`/quiz/${quizId}`, { replace: true });
        }
      } catch (error) {
        console.error("Error processing URL parameters:", error);
        toast({
          title: "Error",
          description: "Failed to process the shared quiz link",
          variant: "destructive"
        });
      }
    };
    
    checkForSharedQuiz();
  }, [location, navigate, toast]);

  useEffect(() => {
    if (!currentQuizId) return;
    
    loadLeaderboard(currentQuizId);
    
    const intervalId = setInterval(() => {
      loadLeaderboard(currentQuizId);
    }, LEADERBOARD_POLL_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [currentQuizId]);

  const loadLeaderboard = async (quizId: string) => {
    try {
      const leaderboardData = await getLeaderboard(quizId);
      if (leaderboardData && leaderboardData.length > 0) {
        setLeaderboard(sortLeaderboard(leaderboardData));
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    }
  };

  const sortLeaderboard = (entries: LeaderboardEntry[]) => {
    return [...entries].sort((a, b) => {
      const aPercent = a.score / a.totalQuestions;
      const bPercent = b.score / b.totalQuestions;
      if (bPercent !== aPercent) return bPercent - aPercent;
      
      return b.timestamp - a.timestamp;
    });
  };

  const handleGetStarted = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    setShowQuizSection(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuizGenerated = async (quizData: QuizData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to generate assessments",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    
    setQuiz(quizData);
    setUsernameRequired(true);
    
    try {
      // Use user's email as username if available
      const displayName = user.email?.split('@')[0] || "Anonymous";
      setUsername(displayName);
      
      const quizId = await saveQuiz(quizData, displayName);
      console.log("Quiz stored successfully with ID:", quizId);
      setCurrentQuizId(quizId);
      setLiveLeaderboardVisible(true);
    } catch (error) {
      console.error("Error storing quiz data:", error);
      toast({
        title: "Error saving assessment",
        description: "Failed to save the assessment to the database",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setQuiz(null);
    setShowLeaderboard(false);
    setShowMasterChat(false);
  };

  const handleScoreSubmit = async (score: number, totalQuestions: number) => {
    if (!username || !currentQuizId) {
      toast({
        title: "Error saving score",
        description: "Missing username or quiz ID",
        variant: "destructive",
      });
      return;
    }

    const newEntry: LeaderboardEntry = {
      username,
      score,
      totalQuestions,
      timestamp: Date.now(),
    };

    try {
      await saveScore(currentQuizId, newEntry);
      
      const updatedLeaderboard = await getLeaderboard(currentQuizId);
      const sortedLeaderboard = sortLeaderboard(updatedLeaderboard);
      setLeaderboard(sortedLeaderboard);
      
      setShowLeaderboard(true);
      setShowShareDialog(true);
      setShowMasterChat(true);
    } catch (error) {
      console.error("Error updating leaderboard:", error);
      toast({
        title: "Error saving score",
        description: "Failed to save your score to the leaderboard",
        variant: "destructive"
      });
    }
  };

  const handleShareClose = () => {
    setShowShareDialog(false);
  };

  const handleShareQuiz = () => {
    if (!currentQuizId) {
      toast({
        title: "Error sharing assessment",
        description: "Assessment ID is missing",
        variant: "destructive",
      });
      return;
    }
    
    const shareUrl = new URL(window.location.origin);
    shareUrl.pathname = `/quiz/${currentQuizId}`;
    
    navigator.clipboard.writeText(shareUrl.toString());
    
    toast({
      title: "Assessment link copied!",
      description: "Share this link with friends to let them take the same assessment!",
    });
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter your name to continue",
        variant: "destructive",
      });
      return;
    }
    
    setUsernameRequired(false);
  };

  const toggleLiveLeaderboard = () => {
    setLiveLeaderboardVisible(prev => !prev);
  };

  const toggleMasterChat = () => {
    setShowMasterChat(prev => !prev);
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
  };

  if (showQuizSection && usernameRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <motion.div 
          className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-6">
            <User className="w-12 h-12 mx-auto text-primary mb-2" />
            <h2 className="text-2xl font-bold gradient-text">Confirm Your Name</h2>
            <p className="text-gray-600 mt-2">Please confirm your name before taking the assessment</p>
          </div>
          
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
            <div>
              <Button 
                type="submit" 
                className="w-full py-3" 
                disabled={isLoading}
              >
                {isLoading ? 'Loading Assessment...' : 'Continue to Assessment'}
              </Button>
            </div>
          </form>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setShowQuizSection(false);
                setUsernameRequired(false);
              }}
              className="text-gray-600 hover:text-primary transition-colors"
              disabled={isLoading}
            >
              ← Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <AnimatePresence mode="wait">
        {!showQuizSection ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={pageTransition}
          >
            <LandingSection onGetStarted={handleGetStarted} />
            <Footer />
          </motion.div>
        ) : (
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={pageTransition}
            className="w-full mx-auto px-4 sm:px-6 py-8 sm:py-16 pt-24"
          >
            <div className={`grid ${!quiz && !showLeaderboard ? 'md:grid-cols-2' : (quiz && liveLeaderboardVisible ? 'md:grid-cols-2' : '')} gap-6 md:gap-8 axion-container`}>
              <div className="space-y-6 md:space-y-8">
                {!quiz && showLeaderboard ? (
                  <LeaderboardDisplay 
                    leaderboard={leaderboard} 
                    onBackToQuiz={() => setShowLeaderboard(false)} 
                  />
                ) : !quiz ? (
                  <>
                    {user ? (
                      <AssessmentGenerator onQuizGenerated={handleQuizGenerated} />
                    ) : (
                      <div className="p-8 text-center bg-white rounded-xl shadow-md">
                        <h3 className="text-xl font-semibold mb-4">Authentication Required</h3>
                        <p className="mb-6">Please login to create and take assessments.</p>
                        <Button onClick={() => navigate('/auth')}>Login or Sign Up</Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <QuizDisplay 
                      quiz={quiz} 
                      onReset={handleReset} 
                      username={username}
                      onScoreSubmit={handleScoreSubmit}
                    />
                    
                    {!showLeaderboard && (
                      <div className="flex justify-center gap-4 flex-wrap">
                        <Button
                          variant="outline"
                          onClick={handleShareQuiz}
                          className="gap-2"
                        >
                          <Share2 className="w-4 h-4" />
                          Share This Assessment
                        </Button>
                        
                        {showMasterChat && (
                          <Button
                            variant="secondary"
                            onClick={toggleMasterChat}
                            className="md:hidden"
                          >
                            {liveLeaderboardVisible ? "Hide Learning Master" : "Ask Learning Master"}
                          </Button>
                        )}
                        
                        <Button
                          variant="secondary"
                          onClick={toggleLiveLeaderboard}
                          className="md:hidden"
                        >
                          {liveLeaderboardVisible ? "Hide Leaderboard" : "Show Leaderboard"}
                        </Button>
                      </div>
                    )}
                    
                    {showMasterChat && (
                      <div className="md:hidden mt-6">
                        {liveLeaderboardVisible && (
                          <MasterChat quizTopic={quiz?.questions[0]?.question.split(' ').slice(0, 5).join(' ')} />
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {!quiz && !showLeaderboard && user && (
                <div className="h-[600px] md:h-[800px]">
                  <TeacherChat />
                </div>
              )}
              
              {quiz && showMasterChat && (
                <div className="md:block">
                  <div className="sticky top-4 space-y-6">
                    <MasterChat quizTopic={quiz?.questions[0]?.question.split(' ').slice(0, 5).join(' ')} />
                  </div>
                </div>
              )}
              
              {quiz && leaderboard.length > 0 && liveLeaderboardVisible && (
                <div className="md:block">
                  <div className="sticky top-4">
                    <LeaderboardDisplay 
                      leaderboard={leaderboard} 
                      onBackToQuiz={() => {}} 
                    />
                    <div className="md:hidden mt-4 text-center">
                      <Button
                        variant="outline"
                        onClick={toggleLiveLeaderboard}
                      >
                        Hide Leaderboard
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {quiz && leaderboard.length === 0 && liveLeaderboardVisible && (
                <div className="md:block">
                  <div className="sticky top-4">
                    <LeaderboardDisplay 
                      leaderboard={[]} 
                      onBackToQuiz={() => {}} 
                    />
                    <div className="md:hidden mt-4 text-center">
                      <Button
                        variant="outline"
                        onClick={toggleLiveLeaderboard}
                      >
                        Hide Leaderboard
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 md:mt-16 text-center axion-container">
              <button
                onClick={() => {
                  setShowQuizSection(false);
                  setUsername('');
                  setQuiz(null);
                  setShowLeaderboard(false);
                  setShowMasterChat(false);
                }}
                className="text-gray-600 hover:text-primary transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showShareDialog && (
        <QuizShareDialog 
          onClose={handleShareClose}
          username={username}
          score={leaderboard.find(entry => entry.username === username)?.score || 0}
          totalQuestions={leaderboard.find(entry => entry.username === username)?.totalQuestions || 0}
          quizId={currentQuizId}
        />
      )}
    </div>
  );
};

export default Index;
