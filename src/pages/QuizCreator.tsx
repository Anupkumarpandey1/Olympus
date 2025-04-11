
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import QuizCreator from '@/components/QuizCreator';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const QuizCreatorPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
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
          <h1 className="text-3xl font-bold gradient-text">Create Assessment</h1>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <QuizCreator />
        </div>
      </div>
    </div>
  );
};

export default QuizCreatorPage;
