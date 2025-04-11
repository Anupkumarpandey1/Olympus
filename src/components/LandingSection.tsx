
import React from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2, Sparkles, Lightbulb, Zap, ArrowRight, Star, Flag } from 'lucide-react';
import FeatureCard from './FeatureCard';
import StepCard from './StepCard';
import ThreeDModel from './ThreeDModel';
import { Button } from './ui/button';

interface LandingSectionProps {
  onGetStarted: () => void;
}

const LandingSection = ({ onGetStarted }: LandingSectionProps) => {
  // Stagger animation for children elements
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  // Testimonials data
  const testimonials = [
    {
      text: "Learnflow AI completely transformed how I study. The quizzes are incredibly tailored to my learning style!",
      author: "Arpita Kukreja",
      role: "Medical Student and Doctor by profession"
    },
    {
      text: "I've tried many learning platforms, but nothing compares to the personalized experience that Learnflow AI provides.",
      author: "Rudramani Upadhyay",
      role: "Software Engineer"
    },
    {
      text: "The AI-powered chat feature feels like having a personal tutor available 24/7. Simply incredible.",
      author: "Cheshta Sharma",
      role: "PhD Candidate"
    },
    {
      text: "Axion AI completely transformed how I study. The quizzes are incredibly tailored to my learning style!",
      author: "Anup Kumar Pandey",
      role: "Berozgaar"
    }
  ];

  // Pricing plans
  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for casual learners",
      features: [
        "5 AI-generated quizzes per month",
        "Basic chat assistance",
        "Standard quiz customization",
        "Email support"
      ],
      buttonText: "Start Free",
      popular: false
    },
    {
      name: "Pro",
      price: "$19",
      period: "/month",
      description: "Ideal for serious students",
      features: [
        "Unlimited AI-generated quizzes",
        "Advanced AI tutor assistance",
        "Full quiz customization options",
        "Priority email & chat support",
        "Progress tracking & analytics"
      ],
      buttonText: "Get Started",
      popular: true
    },
    {
      name: "Team",
      price: "$49",
      period: "/month",
      description: "Perfect for study groups",
      features: [
        "Everything in Pro plan",
        "Up to 5 team members",
        "Collaborative learning tools",
        "Team analytics dashboard",
        "Dedicated account manager"
      ],
      buttonText: "Contact Sales",
      popular: false
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-purple-50 z-0"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl z-0"></div>
        
        <div className="axion-container relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-left"
            >
              <div className="inline-flex items-center px-3 py-1 mb-6 rounded-full bg-primary/10 text-primary">
                <Sparkles size={16} className="mr-2" />
                <span className="font-medium">AI-Powered Learning Revolution</span>
              </div>
              
              <h1 className="text-2xl md:text-2xl lg:text-6xl font-bold mb-6 leading-tight">
               
                Master Any Topic with <span className="axion-text-gradient">AI-Powered</span> Assessments and Learn any <span className="axion-text-gradient">concept</span> interactively and with fun.
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                Transform videos, documents, or any topic into interactive quizzes. Boost your learning with our AI-powered quiz generator and chat with our Master Teacher for personalized help.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <motion.button
                  onClick={onGetStarted}
                  className="primary-button flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </motion.button>
                
                <motion.a
                  href="https://quiznect-genius.lovable.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="secondary-button flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  
                >
                  <span className="axion-text-gradient">Barrack</span>
                  <Flag className="ml-2 h-4 w-4"   />
                </motion.a>
              </div>
              
              <div className="mt-8 flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium">
                      {i}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">500+</span> students learning today
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 200 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden md:block"
            >
              <ThreeDModel />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="axion-section bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="axion-container text-center"
        >
          <div className="max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center px-3 py-1 mb-4 rounded-full bg-primary/10 text-primary">
              <Zap size={16} className="mr-2" />
              <span className="font-medium">Powerful Features</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Unlock Your Learning Potential</h2>
            
            <p className="text-lg text-gray-600">
              Our platform combines AI technology with proven learning methods to help you master any subject more effectively than traditional studying.
            </p>
          </div>

          <div className="axion-grid">
            <FeatureCard
              icon={<Brain className="w-8 h-8" />}
              title="AI-Generated Questions"
              description="Our advanced AI creates tailored questions based on your chosen topic or content"
            />
            <FeatureCard
              icon={<Lightbulb className="w-8 h-8" />}
              title="Master Teacher AI"
              description="Chat with our AI teacher to get personalized explanations and insights on any topic"
            />
            <FeatureCard
              icon={<CheckCircle2 className="w-8 h-8" />}
              title="Detailed Explanations"
              description="Get comprehensive explanations for correct answers to enhance learning"
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="PDF & Image Analysis"
              description="Upload documents and images to generate quizzes from your study materials"
            />
            <FeatureCard
              icon={<Sparkles className="w-8 h-8" />}
              title="Adaptive Learning"
              description="Our quizzes adapt to your knowledge level, focusing on areas where you need improvement"
            />
            <FeatureCard
              icon={<Star className="w-8 h-8" />}
              title="Progress Tracking"
              description="Monitor your performance over time with detailed analytics and improvement suggestions"
            />
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="axion-section bg-gray-50">
        <div className="axion-container">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center px-3 py-1 mb-4 rounded-full bg-primary/10 text-primary">
              <Sparkles size={16} className="mr-2" />
              <span className="font-medium">Simple Process</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            
            <p className="text-lg text-gray-600">
              Getting started with Learnflow AI is quick and easy. Follow these simple steps to begin your enhanced learning journey.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <StepCard number={1} title="Choose Your Input" description="Enter a topic, paste a YouTube URL, or upload a document" />
            <StepCard number={2} title="Customize" description="Set the number of questions and options" />
            <StepCard number={3} title="Generate & Learn" description="Get your personalized quiz instantly" />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="axion-section bg-white">
        <div className="axion-container">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center px-3 py-1 mb-4 rounded-full bg-primary/10 text-primary">
              <Star size={16} className="mr-2" />
              <span className="font-medium">Testimonials</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
            
            <p className="text-lg text-gray-600">
              Discover how Learnflow AI has transformed the learning experience for students worldwide.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="inline-block w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  
                  <p className="text-gray-700 mb-4 flex-grow">{testimonial.text}</p>
                  
                  <div className="mt-auto">
                    <h4 className="font-semibold text-lg">{testimonial.author}</h4>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="axion-section bg-gray-50">
        <div className="axion-container">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center px-3 py-1 mb-4 rounded-full bg-primary/10 text-primary">
              <Zap size={16} className="mr-2" />
              <span className="font-medium">Pricing Plans</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            
            <p className="text-lg text-gray-600">
              Choose the plan that's right for you and start transforming your learning experience today.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden relative ${
                  plan.popular ? 'border-2 border-primary md:scale-105' : 'border border-gray-100'
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                    Most Popular
                  </div>
                )}
                
                <div className="p-6 md:p-8">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-gray-500">{plan.period}</span>}
                  </div>
                  
                  <ul className="mb-8 space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={onGetStarted}
                    className={`w-full rounded-full ${
                      plan.popular ? 'bg-primary hover:bg-primary/90' : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="axion-section bg-white">
        <div className="axion-container">
          <motion.div 
            className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12 relative overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-3xl"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Learning?</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Join thousands of students who are accelerating their learning with our AI-powered quiz platform.
              </p>
              <Button
                onClick={onGetStarted}
                className="primary-button text-lg px-8 py-3"
              >
                Get Started Free
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default LandingSection;
