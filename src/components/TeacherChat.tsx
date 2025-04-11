
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Loader2, SendHorizonal, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTeacherResponse, generateQuiz } from '@/lib/openai';
import { FormattedMessage } from './FormattedMessage';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { saveQuiz } from '@/services/quizService';
import { toast } from 'sonner';
import QuizDisplay from './QuizDisplay';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

interface QuizQuestion {
  question: string;
  options: {
    text: string;
    correct: boolean;
    explanation: string;
  }[];
}

interface QuizData {
  questions: QuizQuestion[];
  title?: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
}

const TeacherChat = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState<number | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizData | null>(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showSaveQuiz, setShowSaveQuiz] = useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Get AI response
    setLoading(true);
    
    try {
      const response = await getTeacherResponse(userMessage);
      
      if (response) {
        // Add bot response to chat
        setMessages(prev => [...prev, { role: 'bot', content: response }]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error getting teacher response:', error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'Sorry, I couldn\'t process your request. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleGenerateQuiz = async (messageIndex: number) => {
    // Only allow generating quiz from bot messages
    if (messages[messageIndex].role !== 'bot') return;
    
    setGeneratingQuiz(messageIndex);
    setGeneratedQuiz(null); // Reset any previous quiz
    
    try {
      const content = messages[messageIndex].content;
      toast.info("Generating quiz based on the lesson...");
      
      // Pass the content directly to generateQuiz as the prompt
      const quiz = await generateQuiz(content, 3, 4, quizDifficulty);
      
      if (quiz) {
        // Add topic information to quiz
        quiz.topic = content.substring(0, 100);
        quiz.difficulty = quizDifficulty;
        
        // Set the generated quiz to display it
        setGeneratedQuiz(quiz);
        setShowSaveQuiz(true);
        
        toast.success("Quiz generated successfully!");
      } else {
        toast.error("Failed to generate quiz. Please try again.");
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setGeneratingQuiz(null);
    }
  };
  
  const handleQuizReset = () => {
    setGeneratedQuiz(null);
    setShowSaveQuiz(false);
    setQuizTitle('');
    setQuizDescription('');
  };

  const handleSaveQuiz = async () => {
    if (!generatedQuiz || !user) {
      toast.error("Unable to save quiz. Missing quiz data or user login.");
      return;
    }

    if (!quizTitle.trim()) {
      toast.error("Please enter a title for your quiz.");
      return;
    }

    setSavingQuiz(true);
    
    try {
      // Update quiz with title and description
      const quizToSave = { 
        ...generatedQuiz,
        title: quizTitle,
        description: quizDescription,
        difficulty: quizDifficulty,
      };
      
      const displayName = user.email?.split('@')[0] || user.user_metadata?.full_name || "Anonymous";
      const quizId = await saveQuiz(quizToSave, displayName);
      
      toast.success("Quiz saved successfully! You can find it in your profile.");
      
      // Navigate to the new quiz
      navigate(`/quiz/${quizId}`);
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error("Failed to save quiz. Please try again.");
    } finally {
      setSavingQuiz(false);
    }
  };

  return (
    <motion.div 
      className="premium-card h-full overflow-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="p-6 flex flex-col h-full">
        {!generatedQuiz ? (
          <>
            <div className="flex items-center mb-6">
              <BookOpen className="text-primary mr-3" size={24} />
              <h2 className="text-2xl font-bold gradient-text">Master Teacher</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 p-6">
                  <p>Ask me anything about the quiz topic!</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div 
                    key={index}
                    className="flex flex-col"
                  >
                    <div 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[85%] rounded-xl ${
                          msg.role === 'user' 
                            ? 'bg-gradient-to-r from-primary to-secondary text-white p-4' 
                            : 'bg-gray-100'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <FormattedMessage 
                            content={msg.content} 
                            className="p-4"
                          />
                        )}
                      </div>
                    </div>
                    
                    {msg.role === 'bot' && (
                      <div className="ml-2 mt-2">
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleGenerateQuiz(index)} 
                            disabled={generatingQuiz !== null}
                            className="flex items-center gap-2"
                          >
                            {generatingQuiz === index ? (
                              <>
                                <Loader2 className="animate-spin" size={16} />
                                <span>Generating Quiz...</span>
                              </>
                            ) : (
                              <>
                                <BrainCircuit size={16} />
                                <span>Practice with Quiz</span>
                              </>
                            )}
                          </Button>
                          
                          <Select 
                            value={quizDifficulty} 
                            onValueChange={(val: 'easy' | 'medium' | 'hard') => setQuizDifficulty(val)}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue placeholder="Difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-4 rounded-xl">
                    <Loader2 className="animate-spin" size={20} />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask a question about the topic..."
                className="flex-1 p-4 border border-gray-200 rounded-xl focus:border-primary transition-all duration-200"
                disabled={loading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={loading || !inputMessage.trim()}
                className="p-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white"
              >
                <SendHorizonal size={20} />
              </Button>
            </div>
          </>
        ) : (
          <>
            {showSaveQuiz ? (
              <div className="mb-6 space-y-4">
                <h3 className="text-xl font-semibold">Save Your Assessment</h3>
                <p className="text-gray-600">Give your assessment a title and description before saving</p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quiz-title">Title</Label>
                    <Input 
                      id="quiz-title" 
                      value={quizTitle} 
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="Enter assessment title"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="quiz-description">Description (Optional)</Label>
                    <Textarea 
                      id="quiz-description" 
                      value={quizDescription} 
                      onChange={(e) => setQuizDescription(e.target.value)}
                      placeholder="Describe what this assessment covers"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowSaveQuiz(false)}
                    >
                      Skip
                    </Button>
                    <Button 
                      onClick={handleSaveQuiz}
                      disabled={savingQuiz || !quizTitle.trim()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {savingQuiz ? 
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 
                        'Save Assessment'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
            
            <QuizDisplay 
              quiz={generatedQuiz} 
              onReset={handleQuizReset} 
            />
          </>
        )}
      </div>
    </motion.div>
  );
};

export default TeacherChat;
