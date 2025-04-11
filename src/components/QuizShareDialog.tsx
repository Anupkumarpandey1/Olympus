
import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check, Award, Globe, Download, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface QuizShareDialogProps {
  onClose: () => void;
  username: string;
  score: number;
  totalQuestions: number;
  quizId?: string;
  quizTitle?: string;
}

const QuizShareDialog = ({ onClose, username, score, totalQuestions, quizId, quizTitle }: QuizShareDialogProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const assessmentTitle = quizTitle || 'Assessment';
  const shareText = `I just scored ${score}/${totalQuestions} on "${assessmentTitle}" on LearnFlow AI! Try to beat my score!`;

  // Create an absolute URL using the new format
  const baseUrl = window.location.origin;
  const shareUrl = quizId 
    ? `${baseUrl}/quiz/${quizId}` 
    : window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    setCopied(true);

    toast({
      title: "Link copied!",
      description: "Share it with your friends to challenge them!",
    });

    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Assessment Challenge: ${assessmentTitle}`,
          text: shareText,
          url: shareUrl,
        });

        toast({
          title: "Shared successfully!",
          description: "Challenge sent to your friends!",
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadResults = () => {
    const resultsText = `
Assessment Results for ${username}
--------------------------
Assessment: ${assessmentTitle}
Score: ${score}/${totalQuestions}
Percentage: ${((score / totalQuestions) * 100).toFixed(2)}%
Date: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([resultsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-results-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Results downloaded!",
      description: "Your assessment results have been saved as a text file.",
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-w-[calc(100%-2rem)] p-0 overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Award className="w-5 h-5" />
              Congratulations, {username}!
            </DialogTitle>
          </DialogHeader>
        
          <motion.div 
            className="mt-4 text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-sm opacity-90 mb-2">
                {assessmentTitle}
              </p>
              <p className="text-2xl font-bold mb-1">
                {score}/{totalQuestions}
              </p>
              <div className="h-2 bg-white/30 rounded-full w-full mt-2 mb-1">
                <div 
                  className="h-2 bg-white rounded-full" 
                  style={{ width: `${(score / totalQuestions) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm opacity-90">
                {((score / totalQuestions) * 100).toFixed(0)}% score
              </p>
            </motion.div>
          </motion.div>
        </div>

        <div className="p-6 space-y-4">
          <h3 className="font-medium text-gray-800">Share your achievement</h3>
          
          <div className="flex space-x-2">
            <div className="bg-gray-100 p-2 rounded-md flex-1 truncate text-sm break-all overflow-x-auto">
              <div className="max-w-full overflow-hidden text-ellipsis">{shareUrl}</div>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCopyLink}
              className="flex-shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm border border-blue-100">
            <div className="flex items-start">
              <Globe className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800">How this works:</p>
                <p className="text-blue-700">
                  When others open this link, they'll take the same assessment after entering their name. All scores will be saved to the online leaderboard!
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button 
              variant="outline"
              onClick={handleDownloadResults}
              className="w-full justify-between"
            >
              <span className="flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Download Results
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            <Button 
              onClick={handleShare}
              className="w-full justify-between"
            >
              <span className="flex items-center">
                <Share2 className="w-4 h-4 mr-2" />
                Share Result
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <DialogFooter className="p-4 pt-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuizShareDialog;
