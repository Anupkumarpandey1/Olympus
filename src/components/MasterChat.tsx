import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

export interface QuizContextQuestion {
  questionNumber: number;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface QuizContext {
  totalQuestions: number;
  score: number | null;
  questions: QuizContextQuestion[];
  title?: string;
  difficulty?: string;
  topic?: string;
}

interface MasterChatProps {
  quizTopic?: string;
  quizContext?: QuizContext;
}

const MasterChat = ({ quizTopic, quizContext }: MasterChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (messages.length === 0) {
      let initialMessage: Message;
      
      if (quizContext && quizContext.score !== null) {
        const score = quizContext.score;
        const total = quizContext.totalQuestions;
        const percentage = Math.round((score / total) * 100);
        const title = quizContext.title || 'this assessment';
        const difficulty = quizContext.difficulty ? ` (${quizContext.difficulty} difficulty)` : '';
        
        let incorrectAnswersMessage = '';
        if (score < total) {
          const wrongAnswers = quizContext.questions.filter(q => !q.isCorrect);
          if (wrongAnswers.length > 0) {
            incorrectAnswersMessage = `\n\nHere's some feedback on your incorrect answers:\n\n`;
            wrongAnswers.forEach(q => {
              incorrectAnswersMessage += `Question ${q.questionNumber}: "${q.question}"\n`;
              incorrectAnswersMessage += `Your answer: "${q.userAnswer}"\n`;
              incorrectAnswersMessage += `Correct answer: "${q.correctAnswer}"\n`;
              incorrectAnswersMessage += `${q.explanation || 'No explanation provided.'}\n\n`;
            });
          }
        }
        
        initialMessage = {
          id: '1',
          text: `Hi there! I'm your learning assistant. I see you've completed "${title}"${difficulty} with a score of ${score}/${total} (${percentage}%).${incorrectAnswersMessage}\nYou can ask me about any questions you got wrong or any concepts you'd like to understand better.`,
          sender: 'ai' as const
        };
      } else {
        initialMessage = {
          id: '1',
          text: quizTopic 
            ? `Hi there! I'm your learning assistant. Ask me any questions about "${quizTopic}" or your recent assessment.` 
            : "Hi there! I'm your learning assistant. How can I help you understand the topic better?",
          sender: 'ai' as const
        };
      }
      
      setMessages([initialMessage]);
    }
  }, [quizTopic, quizContext, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);
    
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateResponse(newMessage, quizTopic, quizContext),
        sender: 'ai'
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateResponse = (message: string, topic?: string, context?: QuizContext): string => {
    const normalizedMessage = message.toLowerCase();
    
    const questionNumberMatch = normalizedMessage.match(/question\s*(\d+)|(\d+)(st|nd|rd|th)\s*question|(\d+)\s*answer/i);
    if (questionNumberMatch && context) {
      const questionNum = parseInt(
        questionNumberMatch[1] || 
        questionNumberMatch[2] || 
        questionNumberMatch[4] || 
        '0'
      );
      
      const questionData = context.questions.find(q => q.questionNumber === questionNum);
      
      if (questionData) {
        if (normalizedMessage.includes('wrong') || normalizedMessage.includes('incorrect') || 
            normalizedMessage.includes('mistake') || normalizedMessage.includes('why')) {
          
          if (!questionData.isCorrect) {
            return `For question ${questionNum}: "${questionData.question}", you answered "${questionData.userAnswer}" which was incorrect. The correct answer was "${questionData.correctAnswer}".\n\nDetailed explanation: ${questionData.explanation || 'No detailed explanation was provided for this question.'}\n\nA common mistake is to ${generateCommonMistake(questionData.question, questionData.userAnswer, questionData.correctAnswer)}. Remember that ${generateLearningPoint(questionData.question, questionData.correctAnswer)}.`;
          } else {
            return `Actually, you got question ${questionNum} correct! You answered "${questionData.userAnswer}" which was the right answer. ${questionData.explanation || ''}`;
          }
        }
        
        return `Regarding question ${questionNum}: "${questionData.question}", the correct answer is "${questionData.correctAnswer}". ${questionData.explanation || ''}`;
      }
    }
    
    if ((normalizedMessage.includes('wrong answers') || normalizedMessage.includes('incorrect answers')) && context) {
      const wrongAnswers = context.questions.filter(q => !q.isCorrect);
      
      if (wrongAnswers.length === 0) {
        return "Great job! You didn't get any answers wrong on this assessment.";
      }
      
      if (wrongAnswers.length === 1) {
        const q = wrongAnswers[0];
        return `You only got question ${q.questionNumber} wrong: "${q.question}". You answered "${q.userAnswer}" but the correct answer was "${q.correctAnswer}". ${q.explanation || ''}`;
      }
      
      const wrongAnswersList = wrongAnswers.map(q => 
        `Question ${q.questionNumber}: "${q.question}". You answered "${q.userAnswer}" but the correct answer was "${q.correctAnswer}". ${q.explanation || ''}`
      ).join("\n\n");
      
      return `Here are the questions you got wrong:\n\n${wrongAnswersList}`;
    }
    
    if ((normalizedMessage.includes('score') || normalizedMessage.includes('result') || 
         normalizedMessage.includes('how did i do') || normalizedMessage.includes('how well did i do')) && context) {
      const score = context.score || 0;
      const total = context.totalQuestions;
      const percentage = Math.round((score / total) * 100);
      const difficultyText = context.difficulty ? ` on a ${context.difficulty} difficulty assessment` : '';
      
      if (percentage === 100) {
        return `You got a perfect score! ${score} out of ${total} (${percentage}%)${difficultyText}. Excellent work!`;
      } else if (percentage >= 80) {
        return `You did very well! You scored ${score} out of ${total} (${percentage}%)${difficultyText}. Great job!`;
      } else if (percentage >= 60) {
        return `You scored ${score} out of ${total} (${percentage}%)${difficultyText}. Good effort, but there's room for improvement.`;
      } else {
        return `You scored ${score} out of ${total} (${percentage}%)${difficultyText}. Let's work on improving your understanding of this topic.`;
      }
    }
    
    if ((normalizedMessage.includes('what') || normalizedMessage.includes('topic') || 
         normalizedMessage.includes('subject') || normalizedMessage.includes('about')) && 
        normalizedMessage.includes('quiz') && context && context.topic) {
      return `This assessment is about "${context.topic}". It was designed as a ${context.difficulty || 'medium'} difficulty test with ${context.totalQuestions} questions.`;
    }
    
    if (normalizedMessage.includes('explain') || normalizedMessage.includes('understand')) {
      const topicToUse = context?.topic || topic || 'this topic';
      return `The key to understanding ${topicToUse} is breaking it down into manageable parts. Start by mastering the core principles, then build on that knowledge step by step.`;
    }
    
    if (normalizedMessage.includes('tip') || normalizedMessage.includes('advice') || normalizedMessage.includes('help')) {
      const topicToUse = context?.topic || topic || 'this topic';
      return `Here's a helpful tip for ${topicToUse}: Try creating simple examples to test your understanding. Also, explaining the concept to someone else (even imaginary) can help solidify your knowledge.`;
    }
    
    const topicToUse = context?.topic || topic || 'this topic';
    return `That's a great question about ${topicToUse}! To fully understand it, focus on connecting new information with concepts you already know. Also, regular practice with varied examples will help reinforce your learning.`;
  };

  const generateCommonMistake = (question: string, userAnswer: string, correctAnswer: string): string => {
    return `misinterpret the key concepts involved in the question, which leads to selecting an answer that seems plausible but misses the core principle`;
  };

  const generateLearningPoint = (question: string, correctAnswer: string): string => {
    return `focusing on the precise terminology and understanding the underlying principles is crucial for mastering this topic`;
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border shadow-md overflow-hidden flex flex-col h-full">
      <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
        <h3 className="font-semibold text-lg">Learning Master</h3>
        <p className="text-sm text-gray-600">
          {quizContext?.title ? `Ask about "${quizContext.title}"` : "Ask questions about your assessment"}
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg p-3",
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white'
                  : 'bg-gray-100 text-gray-800'
              )}
            >
              <p className="text-sm whitespace-pre-line">{message.text}</p>
            </div>
          </motion.div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg p-3 max-w-[80%]">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!newMessage.trim()} className="bg-primary hover:bg-primary/90">
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
};

export default MasterChat;
