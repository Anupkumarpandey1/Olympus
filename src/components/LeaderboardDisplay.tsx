
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Users, ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getLeaderboard, LeaderboardEntry } from '@/services/quizService';

interface LeaderboardDisplayProps {
  leaderboard?: LeaderboardEntry[];
  onBackToQuiz?: () => void;
  quizId?: string;
}

const LeaderboardDisplay = ({ leaderboard: propLeaderboard, onBackToQuiz, quizId }: LeaderboardDisplayProps) => {
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(propLeaderboard || []);
  const [loading, setLoading] = useState(!propLeaderboard && !!quizId);
  
  useEffect(() => {
    if (propLeaderboard) {
      setLeaderboard(propLeaderboard);
      setLastUpdated(new Date());
    } else if (quizId) {
      const fetchLeaderboard = async () => {
        try {
          setLoading(true);
          const data = await getLeaderboard(quizId);
          setLeaderboard(data);
          setLastUpdated(new Date());
        } catch (error) {
          console.error("Error fetching leaderboard:", error);
          toast({
            title: "Failed to load leaderboard",
            description: "Could not retrieve the leaderboard data",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchLeaderboard();
    }
  }, [quizId, propLeaderboard, toast]);

  const handleDownloadResults = () => {
    try {
      // Create CSV content
      let csvContent = "Rank,Name,Score,Percentage,Date\n";
      
      leaderboard.forEach((entry, index) => {
        const percentage = Math.round((entry.score / entry.totalQuestions) * 100);
        const date = new Date(entry.timestamp).toLocaleDateString();
        csvContent += `${index + 1},"${entry.username}",${entry.score}/${entry.totalQuestions},${percentage}%,${date}\n`;
      });
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'quiz_results.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Results downloaded",
        description: "Quiz results have been downloaded as CSV file",
      });
    } catch (error) {
      console.error("Error downloading results:", error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the results",
        variant: "destructive",
      });
    }
  };
  
  const formatLastUpdated = () => {
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    if (diff < 1000) return 'just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    return `${Math.floor(diff / 60000)}m ago`;
  };

  return (
    <motion.div 
      className="premium-card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4 sm:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div className="flex items-center">
            <Award className="w-6 h-6 text-quiz-primary mr-2" />
            <h2 className="text-xl sm:text-2xl font-bold gradient-text">Leaderboard</h2>
          </div>
          <div className="flex gap-2">
            {leaderboard.length > 0 && (
              <Button
                onClick={handleDownloadResults}
                variant="outline"
                size="sm"
                className="flex items-center text-gray-600 hover:text-quiz-primary transition-colors"
              >
                <Download className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            )}
            {onBackToQuiz && (
              <button
                onClick={onBackToQuiz}
                className="flex items-center text-gray-600 hover:text-quiz-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span>Back</span>
              </button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading leaderboard...</p>
          </div>
        ) : (
          <>
            {leaderboard.length > 0 && (
              <div className="text-xs text-gray-500 mb-2 flex items-center">
                <RefreshCw className="w-3 h-3 mr-1 inline" />
                <span>Updated {formatLastUpdated()}</span>
              </div>
            )}
            
            {leaderboard.length === 0 ? (
              <div className="text-center py-10 sm:py-20">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-500">No scores yet</h3>
                <p className="text-gray-400 mt-2">Complete a quiz to see your score here!</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16 text-center">Rank</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.map((entry, index) => {
                        const percentage = Math.round((entry.score / entry.totalQuestions) * 100);
                        
                        // Determine rank styling based on position
                        let rankClass = '';
                        let medal = null;
                        if (index === 0) {
                          rankClass = 'bg-yellow-100 text-yellow-800';
                          medal = '🥇';
                        } else if (index === 1) {
                          rankClass = 'bg-gray-100 text-gray-800';
                          medal = '🥈';
                        } else if (index === 2) {
                          rankClass = 'bg-amber-100 text-amber-800';
                          medal = '🥉';
                        }
                        
                        return (
                          <TableRow key={`${entry.username}-${entry.timestamp}`}>
                            <TableCell className="text-center">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${rankClass}`}>
                                {medal || index + 1}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium max-w-[120px] sm:max-w-none truncate">
                              {entry.username}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              {entry.score}/{entry.totalQuestions}
                            </TableCell>
                            <TableCell className="text-right">
                              <span 
                                className={`px-2 py-1 rounded ${
                                  percentage >= 80 ? 'bg-green-100 text-green-800' : 
                                  percentage >= 60 ? 'bg-blue-100 text-blue-800' : 
                                  percentage >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'
                                }`}
                              >
                                {percentage}%
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default LeaderboardDisplay;
