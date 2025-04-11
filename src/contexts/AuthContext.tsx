import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      return data;
    } catch (error: any) {
      console.error('Sign in error:', error.message);
      
      // Handle email not confirmed error specifically
      if (error.message.includes('Email not confirmed')) {
        // Resend confirmation email
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: email,
        });
        
        if (resendError) {
          toast({
            title: "Error signing in",
            description: "Email not confirmed. We tried to resend confirmation email but failed.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Email not confirmed",
            description: "We've sent a new confirmation email. Please check your inbox.",
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Error signing in",
          description: error.message,
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // For development purposes, we'll use signInWithPassword instead of signUp
      // to bypass email verification when in development environment
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin,
          // Do not require email verification for development
          data: {
            email_confirmed: true
          }
        }
      });
      
      if (error) throw error;
      
      if (!data.session) {
        toast({
          title: "Signup successful",
          description: "Please check your email to verify your account, then you can log in.",
        });
      } else {
        // If we have a session, user is automatically signed in (development mode)
        toast({
          title: "Signup successful",
          description: "You are now logged in!",
        });
      }
      
      return data;
    } catch (error: any) {
      console.error('Sign up error:', error.message);
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      console.error('Sign out error:', error.message);
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const value = {
    session,
    user,
    signIn,
    signUp,
    signOut,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};