
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Loader2, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { generateQuiz } from '@/lib/openai';
import { saveQuiz, QuizData } from '@/services/quizService';

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().optional(),
  topic: z.string().min(3, {
    message: "Topic must be at least 3 characters.",
  }),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionCount: z.enum(['3', '5', '10']),
  optionCount: z.enum(['3', '4', '5']),
});

type FormValues = z.infer<typeof formSchema>;

const QuizCreator = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      topic: '',
      difficulty: 'medium',
      questionCount: '5',
      optionCount: '4',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error("Please sign in to create assessments");
      navigate('/auth');
      return;
    }

    setLoading(true);
    
    try {
      toast.info("Generating your assessment...");
      
      const questionCount = parseInt(values.questionCount);
      const optionCount = parseInt(values.optionCount);
      
      console.log("Generating quiz with parameters:", {
        topic: values.topic,
        questionCount,
        optionCount,
        difficulty: values.difficulty
      });
      
      const generatedQuiz = await generateQuiz(
        values.topic, 
        questionCount, 
        optionCount, 
        values.difficulty
      );
      
      if (!generatedQuiz || !generatedQuiz.questions || generatedQuiz.questions.length === 0) {
        throw new Error("Failed to generate assessment questions");
      }
      
      const quizData: QuizData = {
        ...generatedQuiz,
        title: values.title,
        description: values.description || '',
        difficulty: values.difficulty as 'easy' | 'medium' | 'hard',
        topic: values.topic
      };
      
      // Get display name from user object
      const displayName = user.email?.split('@')[0] || 
                         user.user_metadata?.full_name || 
                         "Anonymous";
      
      console.log("Saving quiz to database with creator:", displayName);
      
      const quizId = await saveQuiz(quizData, displayName);
      
      toast.success("Assessment created successfully!");
      navigate(`/quiz/${quizId}`);
      
    } catch (error) {
      console.error("Error creating assessment:", error);
      toast.error("Failed to create assessment. Please try again or check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full shadow-lg border-t-4 border-primary">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <CardTitle>Create New Assessment</CardTitle>
          </div>
          <CardDescription>
            Create a personalized assessment for your students or colleagues
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter a title for your assessment" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., JavaScript Basics, World History" {...field} />
                      </FormControl>
                      <FormDescription>
                        The main subject of your assessment
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide more details about this assessment" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="questionCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Questions</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select question count" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="3">3 Questions</SelectItem>
                          <SelectItem value="5">5 Questions</SelectItem>
                          <SelectItem value="10">10 Questions</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="optionCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Options per Question</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select option count" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="3">3 Options</SelectItem>
                          <SelectItem value="4">4 Options</SelectItem>
                          <SelectItem value="5">5 Options</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full md:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Assessment...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Create Assessment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuizCreator;
