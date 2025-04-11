import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Share2, Book, BookOpen, Calendar, Award, ExternalLink, Users, Trophy, Star, BarChart, LogOut as LogOutIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

interface AssessmentItem {
  id: string;
  created_at: string;
  creator_name: string | null;
  questions: Json;
  participantCount?: number;
  title?: string | null;
  description?: string | null;
  difficulty?: string | null;
  topic?: string | null;
}

interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  total_questions: number;
  timestamp: string;
}

interface UserWithPoints {
  username: string;
  learn_points: number;
  assessments_created: number;
  assessments_taken: number;
  average_score?: number;
}

const UserProfile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast: toastNotify } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [createdAssessments, setCreatedAssessments] = useState<AssessmentItem[]>([]);
  const [takenAssessments, setTakenAssessments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [titleModalOpen, setTitleModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const [currentLeaderboard, setCurrentLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentAssessmentTitle, setCurrentAssessmentTitle] = useState('');
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [globalLeaderboardOpen, setGlobalLeaderboardOpen] = useState(false);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<UserWithPoints[]>([]);
  const [globalLeaderboardLoading, setGlobalLeaderboardLoading] = useState(false);
  const [learnPoints, setLearnPoints] = useState(0);
  const [averageScore, setAverageScore] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserAssessments();
      fetchUserLearnPoints();
    }
  }, [user]);
  
  const fetchUserAssessments = async () => {
    setIsLoading(true);
    try {
      const { data: createdData, error: createdError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('creator_name', user?.user_metadata?.full_name || user?.email?.split('@')[0] || user?.email || 'anonymous');

      if (createdError) throw createdError;

      const assessmentsWithCounts = await Promise.all((createdData || []).map(async (assessment) => {
        const { count, error } = await supabase
          .from('scores')
          .select('*', { count: 'exact', head: true })
          .eq('quiz_id', assessment.id);
        
        const assessmentItem: AssessmentItem = {
          ...assessment,
          questions: assessment.questions || [],
          participantCount: error ? 0 : (count || 0),
          description: assessment.description || '',
          difficulty: assessment.difficulty || 'medium',
          topic: assessment.topic || ''
        };
        
        if (!assessmentItem.title) {
          assessmentItem.title = `Assessment (${new Date(assessment.created_at).toLocaleDateString()})`;
        }
        
        return assessmentItem;
      }));

      setCreatedAssessments(assessmentsWithCounts);

      const { data: takenData, error: takenError } = await supabase
        .from('scores')
        .select(`
          id,
          score,
          total_questions,
          timestamp,
          quiz_id,
          quizzes(questions, title, description, difficulty, topic, creator_name)
        `)
        .eq('username', user?.user_metadata?.full_name || user?.email?.split('@')[0] || user?.email || '');

      if (takenError) throw takenError;
      
      if (takenData && takenData.length > 0) {
        const totalPercentage = takenData.reduce((sum, item) => 
          sum + ((item.score / item.total_questions) * 100), 0);
        setAverageScore(Math.round(totalPercentage / takenData.length));
      }
      
      setTakenAssessments(takenData || []);
    } catch (error) {
      console.error('Error fetching user assessments:', error);
      toastNotify({
        title: "Error fetching assessments",
        description: "Could not load your assessments. Please try again later."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserLearnPoints = async () => {
    try {
      const username = user?.user_metadata?.full_name || user?.email?.split('@')[0] || user?.email || '';
      
      const { data: takenAssessments, error: takenError } = await supabase
        .from('scores')
        .select('quiz_id, quizzes(creator_name)')
        .eq('username', username);
      
      if (takenError) throw takenError;
      
      let points = 0;
      takenAssessments?.forEach(assessment => {
        if (assessment.quizzes?.creator_name !== username) {
          points++;
        }
      });
      
      setLearnPoints(points);
    } catch (error) {
      console.error('Error fetching learn points:', error);
    }
  };

  const fetchGlobalLeaderboard = async () => {
    setGlobalLeaderboardLoading(true);
    try {
      const { data: allScores, error: scoresError } = await supabase
        .from('scores')
        .select('username, score, total_questions, quiz_id, quizzes(creator_name)');
      
      if (scoresError) throw scoresError;
      
      const { data: allQuizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select('creator_name, id');
      
      if (quizzesError) throw quizzesError;
      
      const usersMap = new Map<string, { 
        learn_points: number, 
        assessments_created: number,
        assessments_taken: number,
        total_score: number,
        total_questions: number
      }>();
      
      allQuizzes?.forEach(quiz => {
        if (quiz.creator_name) {
          const userData = usersMap.get(quiz.creator_name) || { 
            learn_points: 0, 
            assessments_created: 0,
            assessments_taken: 0,
            total_score: 0,
            total_questions: 0
          };
          userData.assessments_created += 1;
          usersMap.set(quiz.creator_name, userData);
        }
      });
      
      allScores?.forEach(score => {
        if (score.username) {
          const userData = usersMap.get(score.username) || { 
            learn_points: 0, 
            assessments_created: 0,
            assessments_taken: 0,
            total_score: 0,
            total_questions: 0
          };
          
          userData.assessments_taken += 1;
          userData.total_score += score.score;
          userData.total_questions += score.total_questions;
          
          if (score.quizzes?.creator_name && score.quizzes.creator_name !== score.username) {
            userData.learn_points += 1;
          }
          
          usersMap.set(score.username, userData);
        }
      });
      
      const leaderboardData: UserWithPoints[] = Array.from(usersMap.entries()).map(([username, data]) => ({
        username,
        learn_points: data.learn_points,
        assessments_created: data.assessments_created,
        assessments_taken: data.assessments_taken,
        average_score: data.total_questions > 0 
          ? Math.round((data.total_score / data.total_questions) * 100) 
          : 0
      }));
      
      leaderboardData.sort((a, b) => {
        if (b.learn_points !== a.learn_points) {
          return b.learn_points - a.learn_points;
        }
        return (b.average_score || 0) - (a.average_score || 0);
      });
      
      setGlobalLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
      toast("Error loading global leaderboard", {
        description: "Could not load the global leaderboard. Please try again later."
      });
    } finally {
      setGlobalLeaderboardLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleShareAssessment = (id: string) => {
    const shareUrl = `${window.location.origin}/quiz/${id}`;
    navigator.clipboard.writeText(shareUrl);
    toast("Link copied!", {
      description: "Assessment link copied to clipboard. Share it with others!"
    });
  };

  const handleTitleUpdate = async () => {
    if (!selectedAssessmentId || !newTitle.trim()) return;
    
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ title: newTitle.trim() })
        .eq('id', selectedAssessmentId);
      
      if (error) throw error;
      
      setCreatedAssessments(prevAssessments => 
        prevAssessments.map(assessment => 
          assessment.id === selectedAssessmentId 
            ? { ...assessment, title: newTitle.trim() } 
            : assessment
        )
      );
      
      toast("Title updated", {
        description: "Your assessment title has been updated successfully."
      });
      
      setTitleModalOpen(false);
      setNewTitle('');
      setSelectedAssessmentId(null);
    } catch (error) {
      console.error('Error updating title:', error);
      toast("Error updating title", {
        description: "Could not update the title. Please try again later."
      });
    }
  };

  const openTitleModal = (assessment: AssessmentItem) => {
    setSelectedAssessmentId(assessment.id);
    setNewTitle(assessment.title || '');
    setTitleModalOpen(true);
  };

  const viewLeaderboard = async (assessmentId: string, title: string) => {
    setLeaderboardLoading(true);
    setCurrentAssessmentTitle(title);
    
    try {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('quiz_id', assessmentId)
        .order('score', { ascending: false });
        
      if (error) throw error;
      
      setCurrentLeaderboard(data || []);
      setLeaderboardModalOpen(true);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast("Error loading leaderboard", {
        description: "Could not load the leaderboard. Please try again later."
      });
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const openGlobalLeaderboard = () => {
    fetchGlobalLeaderboard();
    setGlobalLeaderboardOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const handleCreateAssessment = () => {
    navigate('/quiz-creator');
  };

  const handleViewAssessments = () => {
    setActiveTab("assessments");
  };

  const getQuestionCount = (questions: Json): number => {
    if (Array.isArray(questions)) {
      return questions.length;
    }
    return 0;
  };

  if (loading || !user) {
    return (
      <div className="container mx-auto py-24 px-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-80 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <Skeleton className="h-48 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userEmail = user.email || 'No email available';
  const userName = user.user_metadata?.full_name || userEmail.split('@')[0];
  const userAvatar = user.user_metadata?.avatar_url;

  let assessmentsCreated = createdAssessments.length;
  let assessmentsTaken = takenAssessments.length;
  let totalParticipants = createdAssessments.reduce((sum, item) => sum + (item.participantCount || 0), 0);

  return (
    <div className="container mx-auto py-24 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{userName}</CardTitle>
              <CardDescription>{userEmail}</CardDescription>
              <div className="mt-2 flex items-center text-amber-600">
                <Star className="w-4 h-4 mr-1 text-amber-500" />
                <span className="font-medium">{learnPoints} Learn Points</span>
              </div>
            </div>
          </div>
          <div className="absolute top-4 right-4 flex gap-2 flex-col sm:flex-row">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => window.open("https://quiznect-genius.lovable.app/", "_blank")}
            >
              <ExternalLink size={16} />
              <span className="hidden sm:inline">Barrack</span>
            </Button>
            <Button 
              variant="outline"
              onClick={handleSignOut}
            >
              <span className="hidden sm:inline">Sign Out</span>
              <LogOutIcon className="sm:ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 w-full flex justify-start overflow-x-auto">
              <TabsTrigger value="overview" className="flex-1 sm:flex-none">Overview</TabsTrigger>
              <TabsTrigger value="assessments" className="flex-1 sm:flex-none">My Assessments</TabsTrigger>
              <TabsTrigger value="settings" className="flex-1 sm:flex-none">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard Overview</CardTitle>
                  <CardDescription>Your account summary and recent activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center mb-2">
                          <Book className="text-blue-500 mr-2" size={16} />
                          <h3 className="font-medium text-sm text-blue-700">Assessments Created</h3>
                        </div>
                        <p className="text-2xl font-bold text-blue-900 mt-1">{assessmentsCreated}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center mb-2">
                          <BookOpen className="text-purple-500 mr-2" size={16} />
                          <h3 className="font-medium text-sm text-purple-700">Assessments Taken</h3>
                        </div>
                        <p className="text-2xl font-bold text-purple-900 mt-1">{assessmentsTaken}</p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                        <div className="flex items-center mb-2">
                          <Star className="text-amber-500 mr-2" size={16} />
                          <h3 className="font-medium text-sm text-amber-700">Learn Points</h3>
                        </div>
                        <p className="text-2xl font-bold text-amber-900 mt-1">{learnPoints}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center mb-2">
                          <Users className="text-green-500 mr-2" size={16} />
                          <h3 className="font-medium text-sm text-green-700">Total Participants</h3>
                        </div>
                        <p className="text-2xl font-bold text-green-900 mt-1">{totalParticipants}</p>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                        <div className="flex items-center mb-2">
                          <BarChart className="text-indigo-500 mr-2" size={16} />
                          <h3 className="font-medium text-sm text-indigo-700">Average Score</h3>
                        </div>
                        <p className="text-2xl font-bold text-indigo-900 mt-1">
                          {averageScore > 0 ? `${averageScore}%` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <h3 className="font-medium mb-2">Quick Actions</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
                          onClick={handleCreateAssessment}
                        >
                          Create Assessment
                        </Button>
                        <Button variant="outline" onClick={handleViewAssessments}>
                          View My Assessments
                        </Button>
                        <Button variant="outline" onClick={openGlobalLeaderboard}>
                          <Trophy className="w-4 h-4 mr-2" />
                          Global Leaderboard
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="assessments">
              <Card>
                <CardHeader>
                  <CardTitle>My Assessments</CardTitle>
                  <CardDescription>Assessments you've created and taken</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {createdAssessments.length > 0 && (
                        <div>
                          <h3 className="font-medium text-lg mb-3">Created by you</h3>
                          <div className="space-y-3">
                            {createdAssessments.map((assessment) => (
                              <div 
                                key={assessment.id} 
                                className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                              >
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                  <div>
                                    <h4 className="font-medium">
                                      {assessment.title || 'Untitled Assessment'} 
                                      <button 
                                        onClick={() => openTitleModal(assessment)}
                                        className="ml-2 text-xs text-blue-500 hover:text-blue-700"
                                      >
                                        Edit
                                      </button>
                                    </h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                      Created on {formatDate(assessment.created_at)} • 
                                      {assessment.difficulty && ` ${assessment.difficulty.charAt(0).toUpperCase() + assessment.difficulty.slice(1)} difficulty •`} 
                                      {getQuestionCount(assessment.questions)} questions
                                    </p>
                                    <div className="mt-2 flex items-center text-green-600">
                                      <Users className="w-4 h-4 mr-1" />
                                      <span className="font-medium">{assessment.participantCount} Participants</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleShareAssessment(assessment.id)}
                                    >
                                      <Share2 size={16} className="mr-1" />
                                      Share
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => viewLeaderboard(assessment.id, assessment.title || 'Assessment')}
                                    >
                                      <Award size={16} className="mr-1" />
                                      Leaderboard
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => navigate(`/quiz/${assessment.id}`)}
                                    >
                                      View
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {takenAssessments.length > 0 && (
                        <div className="mt-8">
                          <h3 className="font-medium text-lg mb-3">Taken by you</h3>
                          <div className="space-y-3">
                            {takenAssessments.map((assessment) => {
                              const isExternalAssessment = assessment.quizzes?.creator_name !== (user?.user_metadata?.full_name || user?.email?.split('@')[0] || user?.email);
                              return (
                                <div 
                                  key={assessment.id} 
                                  className={`p-4 border rounded-lg bg-white shadow-sm ${isExternalAssessment ? 'border-l-4 border-l-amber-400' : ''}`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                    <div>
                                      <h4 className="font-medium flex flex-wrap items-center gap-2">
                                        {assessment.quizzes?.title || 'Untitled Assessment'}
                                        {isExternalAssessment && (
                                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                                            External Assessment
                                          </span>
                                        )}
                                      </h4>
                                      <p className="text-sm text-gray-500 mt-1">
                                        Taken on {formatDate(assessment.timestamp)} • Score: {assessment.score}/{assessment.total_questions} ({Math.round((assessment.score / assessment.total_questions) * 100)}%)
                                      </p>
                                      {isExternalAssessment && (
                                        <p className="text-xs text-amber-600 mt-1">
                                          Created by: {assessment.quizzes?.creator_name}
                                          <span className="ml-2 text-green-600">+1 Learn Point</span>
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-end">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => viewLeaderboard(assessment.quiz_id, assessment.quizzes?.title || 'Assessment')}
                                      >
                                        <Award size={16} className="mr-1" />
                                        Leaderboard
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate(`/quiz/${assessment.quiz_id}`)}
                                      >
                                        Take Again
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {createdAssessments.length === 0 && takenAssessments.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-4">You haven't created or taken any assessments yet</p>
                          <Button onClick={() => navigate('/quiz-creator')}>
                            Create Your First Assessment
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Account settings will be available in a future update.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => toast("Coming Soon", { 
                    description: "Account settings are currently under development." 
                  })}>
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={titleModalOpen} onOpenChange={setTitleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Assessment Title</DialogTitle>
            <DialogDescription>
              Give your assessment a descriptive title
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter assessment title"
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTitleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTitleUpdate}>
              Save Title
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={leaderboardModalOpen} onOpenChange={setLeaderboardModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assessment Leaderboard</DialogTitle>
            <DialogDescription>
              {currentAssessmentTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {leaderboardLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : currentLeaderboard.length > 0 ? (
              <div className="max-h-[350px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Rank</th>
                      <th className="text-left py-2 px-3">User</th>
                      <th className="text-left py-2 px-3">Score</th>
                      <th className="text-right py-2 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLeaderboard.map((entry, index) => (
                      <tr key={entry.id} className="border-b">
                        <td className="py-2 px-3">{index + 1}</td>
                        <td className="py-2 px-3">{entry.username}</td>
                        <td className="py-2 px-3">
                          {entry.score}/{entry.total_questions} ({Math.round((entry.score / entry.total_questions) * 100)}%)
                        </td>
                        <td className="py-2 px-3 text-right text-gray-500 text-sm">
                          {formatDate(entry.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No one has taken this assessment yet.</p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setLeaderboardModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={globalLeaderboardOpen} onOpenChange={setGlobalLeaderboardOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Trophy className="text-amber-500 mr-2" />
              Global Leaderboard
            </DialogTitle>
            <DialogDescription>
              Users ranked by Learn Points (highest to lowest)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {globalLeaderboardLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : globalLeaderboard.length > 0 ? (
              <div className="max-h-[350px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Rank</th>
                      <th className="text-left py-2 px-3">User</th>
                      <th className="text-center py-2 px-3">Learn Points</th>
                      <th className="text-center py-2 px-3">Avg. Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalLeaderboard.map((entry, index) => (
                      <tr key={index} className={`border-b ${entry.username === (user?.user_metadata?.full_name || user?.email?.split('@')[0] || user?.email) ? 'bg-blue-50' : ''}`}>
                        <td className="py-2 px-3 font-medium">{index + 1}</td>
                        <td className="py-2 px-3">
                          {entry.username}
                          {entry.username === (user?.user_metadata?.full_name || user?.email?.split('@')[0] || user?.email) && (
                            <span className="ml-2 text-xs text-blue-600">(You)</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-amber-600">{entry.learn_points}</td>
                        <td className="py-2 px-3 text-center">
                          {entry.average_score ? (
                            <span className={`px-2 py-1 rounded text-xs ${
                              (entry.average_score || 0) >= 80 ? 'bg-green-100 text-green-800' : 
                              (entry.average_score || 0) >= 60 ? 'bg-blue-100 text-blue-800' : 
                              (entry.average_score || 0) >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {entry.average_score}%
                            </span>
                          ) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No users have accumulated learn points yet.</p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setGlobalLeaderboardOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProfile;
