import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Check, AlertTriangle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import MasterChat from '@/components/MasterChat';
import { toast } from 'sonner';

interface QuizOption {
  text: string;
  correct: boolean;
  explanation: string;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

interface QuizData {
  questions: QuizQuestion[];
  title?: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
  creator_name?: string;
}

interface QuizDisplayProps {
  quiz: QuizData;
  onReset: () => void;
  username?: string;
  onScoreSubmit?: (score: number, totalQuestions: number, quizResult: any) => void;
  creatorName?: string;
}

const QuizDisplay = ({ quiz, onReset, username, onScoreSubmit, creatorName }: QuizDisplayProps) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [showMasterChat, setShowMasterChat] = useState(false);
  const [earnedLearnPoint, setEarnedLearnPoint] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>(quiz.difficulty || 'medium');
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    setSelectedAnswers({});
    setScore(null);
    setShowExplanation({});
    setScoreSubmitted(false);
    setShowMasterChat(false);
    setEarnedLearnPoint(false);
  }, [quiz]);

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    if (score !== null) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const toggleExplanation = (questionIndex: number) => {
    setShowExplanation(prev => ({
      ...prev,
      [questionIndex]: !prev[questionIndex]
    }));
  };

  const submitQuiz = () => {
    if (Object.keys(selectedAnswers).length < quiz.questions.length) {
      return;
    }
    
    let correctCount = 0;
    quiz.questions.forEach((q, index) => {
      if (q.options[selectedAnswers[index]]?.correct) {
        correctCount++;
      }
    });
    
    setScore(correctCount);

    if (isExternalQuiz && !earnedLearnPoint) {
      setEarnedLearnPoint(true);
      toast.success("You earned 1 Learn Point!", {
        description: "Playing assessments created by others helps you earn Learn Points!"
      });
    }
    
    if (username && onScoreSubmit) {
      const quizResult = getQuizContext();
      onScoreSubmit(correctCount, quiz.questions.length, quizResult);
      setScoreSubmitted(true);
    }
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setScore(null);
    setShowExplanation({});
    setScoreSubmitted(false);
    setShowMasterChat(false);
  };

  const getScoreMessage = () => {
    const percentage = (score! / quiz.questions.length) * 100;
    if (percentage === 100) return "Perfect score! Excellent work!";
    if (percentage >= 80) return "Great job! You've mastered this topic!";
    if (percentage >= 60) return "Good effort! Keep learning!";
    if (percentage >= 40) return "Nice try! Review the explanations to improve!";
    return "Keep practicing! Review the material and try again!";
  };

  const handleSubmitScore = () => {
    if (score !== null && onScoreSubmit && !scoreSubmitted) {
      const quizResult = getQuizContext();
      onScoreSubmit(score, quiz.questions.length, quizResult);
      setScoreSubmitted(true);
    }
  };

  const getQuizContext = () => {
    const questionsWithAnswers = quiz.questions.map((q, qIndex) => {
      const selectedOption = selectedAnswers[qIndex];
      const isCorrect = selectedOption !== undefined ? q.options[selectedOption]?.correct : false;
      return {
        questionNumber: qIndex + 1,
        question: q.question,
        userAnswer: selectedOption !== undefined ? q.options[selectedOption]?.text || "Not answered" : "Not answered",
        correctAnswer: q.options.find(opt => opt.correct)?.text || "",
        isCorrect,
        explanation: q.options.find(opt => opt.correct)?.explanation || ""
      };
    });
    
    return {
      totalQuestions: quiz.questions.length,
      score: score,
      questions: questionsWithAnswers,
      title: quiz.title,
      difficulty: quiz.difficulty,
      topic: quiz.topic
    };
  };

  const getQuizTopic = () => {
    if (quiz.topic) {
      return quiz.topic;
    } else if (quiz.title) {
      return quiz.title;
    } else if (quiz.questions && quiz.questions.length > 0) {
      return quiz.questions[0].question;
    }
    return '';
  };

  const isExternalQuiz = username && creatorName && username !== creatorName;

  return (
    <motion.div 
      className="premium-card overflow-visible"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4 sm:p-8">
        {username && (
          <div className="mb-4 py-2 px-4 bg-blue-50 rounded-lg text-gray-700 inline-block">
            Taking assessment as: <span className="font-semibold">{username}</span>
          </div>
        )}
        
        {isExternalQuiz && (
          <div className="mb-4 py-2 px-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-center">
            <Star className="text-amber-500 mr-2 h-5 w-5" />
            <div>
              <p className="font-medium">External Assessment</p>
              <p className="text-sm">Created by: {creatorName}</p>
              {!scoreSubmitted && <p className="text-xs text-green-600 mt-1">Complete this assessment to earn 1 Learn Point</p>}
            </div>
          </div>
        )}
        
        <h2 className="text-2xl font-bold mb-6 gradient-text">
          {quiz.title || "Your Assessment"}
          {quiz.difficulty && <span className="ml-2 text-sm font-medium text-gray-500">({quiz.difficulty} difficulty)</span>}
        </h2>
        
        {quiz.description && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg text-gray-700 text-sm">
            {quiz.description}
          </div>
        )}
        
        {!quizStarted ? (
          <div className="p-6 bg-white rounded-xl shadow-md mb-6">
            <h3 className="text-xl font-semibold mb-4">Select Difficulty Level</h3>
            <p className="text-gray-600 mb-4">Choose the difficulty level for this assessment:</p>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <Button 
                variant={selectedDifficulty === 'easy' ? 'default' : 'outline'}
                onClick={() => setSelectedDifficulty('easy')}
                className={selectedDifficulty === 'easy' ? 'bg-green-600' : ''}
              >
                Easy
              </Button>
              <Button 
                variant={selectedDifficulty === 'medium' ? 'default' : 'outline'}
                onClick={() => setSelectedDifficulty('medium')}
                className={selectedDifficulty === 'medium' ? 'bg-blue-600' : ''}
              >
                Medium
              </Button>
              <Button 
                variant={selectedDifficulty === 'hard' ? 'default' : 'outline'}
                onClick={() => setSelectedDifficulty('hard')}
                className={selectedDifficulty === 'hard' ? 'bg-red-600' : ''}
              >
                Hard
              </Button>
            </div>
            
            <Button 
              onClick={() => setQuizStarted(true)}
              className="w-full"
            >
              Start Assessment
            </Button>
          </div>
        ) : !showMasterChat ? (
          <>
            <div className="space-y-8">
              {quiz.questions.map((question, qIndex) => (
                <motion.div 
                  key={qIndex}
                  className="p-4 sm:p-6 bg-gray-50 rounded-xl border border-gray-100 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: qIndex * 0.1 }}
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {qIndex + 1}. {question.question}
                  </h3>
                  
                  <div className="space-y-3 mb-3">
                    {question.options.map((option, oIndex) => (
                      <motion.div 
                        key={oIndex}
                        whileHover={score === null ? { scale: 1.01 } : {}}
                        whileTap={score === null ? { scale: 0.99 } : {}}
                      >
                        <button
                          onClick={() => handleAnswerSelect(qIndex, oIndex)}
                          className={cn(
                            "w-full text-left p-3 sm:p-4 rounded-lg transition-all duration-200 border",
                            score === null ? "hover:bg-gray-100 cursor-pointer" : "cursor-default",
                            selectedAnswers[qIndex] === oIndex 
                              ? (score !== null && !option.correct
                                  ? "bg-red-50 border-red-300" 
                                  : "bg-blue-50 border-blue-300")
                              : (score !== null && option.correct
                                  ? "bg-green-50 border-green-300"
                                  : "bg-white border-gray-200")
                          )}
                          disabled={score !== null}
                        >
                          <div className="flex items-center">
                            <div className={cn(
                              "w-5 h-5 rounded-full mr-3 flex-shrink-0 flex items-center justify-center border",
                              selectedAnswers[qIndex] === oIndex 
                                ? (score !== null && !option.correct
                                    ? "border-red-500 bg-red-100" 
                                    : "border-blue-500 bg-blue-100")
                                : (score !== null && option.correct
                                    ? "border-green-500 bg-green-100"
                                    : "border-gray-300 bg-white")
                            )}>
                              {score !== null && option.correct && (
                                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                              {score !== null && selectedAnswers[qIndex] === oIndex && !option.correct && (
                                <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className="break-words">{option.text}</span>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                  
                  {score !== null && (
                    <div className="mt-4">
                      {selectedAnswers[qIndex] !== undefined && 
                       !quiz.questions[qIndex].options[selectedAnswers[qIndex]].correct && (
                        <div className="mb-2 flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-700">Your answer was incorrect</p>
                            <p className="text-sm text-red-600">
                              The correct answer is: {quiz.questions[qIndex].options.find(opt => opt.correct)?.text}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => toggleExplanation(qIndex)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {showExplanation[qIndex] ? "Hide Explanation" : "Show Explanation"}
                      </button>
                      
                      <AnimatePresence>
                        {showExplanation[qIndex] && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 p-4 bg-green-50 rounded-lg text-sm text-green-800 border border-green-100">
                              <p className="font-semibold mb-1">Explanation:</p>
                              <p className="break-words">
                                {quiz.questions[qIndex].options.find(opt => opt.correct)?.explanation || 
                                "No explanation provided for this question."}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            
            {score === null ? (
              <motion.button
                onClick={submitQuiz}
                className={cn(
                  "w-full bg-gradient-to-r from-primary to-secondary text-white font-medium py-4 px-6 rounded-xl mt-8",
                  Object.keys(selectedAnswers).length < quiz.questions.length ? "opacity-70" : ""
                )}
                whileHover={Object.keys(selectedAnswers).length === quiz.questions.length ? { scale: 1.02 } : {}}
                whileTap={Object.keys(selectedAnswers).length === quiz.questions.length ? { scale: 0.98 } : {}}
                disabled={Object.keys(selectedAnswers).length < quiz.questions.length}
              >
                {Object.keys(selectedAnswers).length < quiz.questions.length 
                  ? `Answer all questions (${Object.keys(selectedAnswers).length}/${quiz.questions.length})` 
                  : "Submit Assessment"}
              </motion.button>
            ) : (
              <motion.div 
                className="mt-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-gradient-to-r from-primary to-secondary p-4 sm:p-8 rounded-2xl text-white text-center">
                  <div className="mb-2">
                    <Trophy className="w-12 h-12 sm:w-14 sm:h-14 mx-auto" />
                  </div>
                  <h3 className="text-xl sm:text-3xl font-bold mb-2">
                    Your Score: {score} out of {quiz.questions.length}
                  </h3>
                  <p className="text-white/90 mb-6">
                    {getScoreMessage()}
                  </p>
                  
                  {earnedLearnPoint && (
                    <div className="mb-6 p-3 bg-amber-500/20 backdrop-blur-sm rounded-lg text-white inline-flex items-center">
                      <Star className="text-amber-300 mr-2 h-5 w-5" />
                      <span>You earned 1 Learn Point for completing this external assessment!</span>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap justify-center gap-4">
                    <button
                      onClick={resetQuiz}
                      className="bg-white text-primary px-4 sm:px-6 py-2 sm:py-3 rounded-full font-medium 
                              hover:bg-blue-50 transition-colors duration-200"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => setShowMasterChat(true)}
                      className="bg-white/20 backdrop-blur-sm text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-medium 
                              hover:bg-white/30 transition-colors duration-200"
                    >
                      Ask Master Teacher
                    </button>
                    <button
                      onClick={onReset}
                      className="bg-white/20 backdrop-blur-sm text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-medium 
                              hover:bg-white/30 transition-colors duration-200"
                    >
                      New Assessment
                    </button>
                    {!scoreSubmitted && username && (
                      <Button
                        onClick={handleSubmitScore}
                        className="bg-white/20 backdrop-blur-sm text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-medium 
                                  hover:bg-white/30 transition-colors duration-200 flex items-center gap-2"
                      >
                        <Award className="w-4 h-4" />
                        Save Score
                      </Button>
                    )}
                    {scoreSubmitted && (
                      <Button
                        className="bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-medium flex items-center gap-2"
                        disabled
                      >
                        <Check className="w-4 h-4" />
                        Score Saved
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <div className="h-[600px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Master Teacher Chat</h3>
              <Button variant="outline" onClick={() => setShowMasterChat(false)}>
                Back to Assessment
              </Button>
            </div>
            <MasterChat 
              quizTopic={getQuizTopic()} 
              quizContext={getQuizContext()}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default QuizDisplay;
