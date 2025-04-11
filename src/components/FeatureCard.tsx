import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  requiresAuth?: boolean;
  accentColor?: string;
  secondaryColor?: string;
}

const FeatureCard = ({
  icon,
  title,
  description,
  className,
  requiresAuth = false,
  accentColor = "#4F46E5",
  secondaryColor = "#EC4899"
}: FeatureCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={cn(
        "axion-card relative overflow-hidden rounded-xl p-6 backdrop-blur-sm",
        "border border-white/20 bg-white/10 dark:bg-gray-900/60",
        "flex flex-col items-center text-center",
        "transition-all duration-500 ease-out",
        className
      )}
      style={{
        boxShadow: isHovered 
          ? `0 20px 25px -5px ${accentColor}15, 0 8px 10px -6px ${secondaryColor}20` 
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ 
        y: -10,
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 10 }
      }}
    >
      {/* Background gradient circles */}
      <div 
        className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none"
        style={{
          background: isHovered
            ? `radial-gradient(circle at 20% 20%, ${accentColor}50 0%, transparent 50%), 
               radial-gradient(circle at 80% 80%, ${secondaryColor}50 0%, transparent 50%)`
            : 'none',
          transition: 'background 0.7s ease-in-out'
        }}
      />

      {/* Auth Badge */}
      {requiresAuth && (
        <motion.div 
          className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-medium z-10"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          Login Required
        </motion.div>
      )}

      {/* Icon with animated gradient background */}
      <motion.div 
        className="relative rounded-full p-5 mb-6 z-10"
        style={{
          background: isHovered
            ? `linear-gradient(135deg, ${accentColor}40 0%, ${secondaryColor}40 100%)`
            : `linear-gradient(135deg, ${accentColor}20 0%, ${secondaryColor}20 100%)`,
          transition: 'background 0.3s ease-in-out'
        }}
        whileHover={{ 
          rotate: [0, -5, 5, -5, 0],
          transition: { duration: 0.5 }
        }}
      >
        <motion.div 
          className="text-3xl"
          animate={{ 
            color: isHovered ? accentColor : "#6B7280"
          }}
          transition={{ duration: 0.3 }}
        >
          {icon}
        </motion.div>
        
        {/* Pulsing ring effect on hover */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ opacity: 0.7, scale: 1 }}
            animate={{ 
              opacity: 0,
              scale: 1.5,
            }}
            transition={{ 
              repeat: Infinity,
              duration: 1.5,
              ease: "easeOut"
            }}
            style={{
              border: `2px solid ${accentColor}`,
            }}
          />
        )}
      </motion.div>

      {/* Title with gradient on hover */}
      <motion.h3 
        className="text-xl font-bold mb-3 z-10"
        animate={{ 
          background: isHovered 
            ? `-webkit-linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)` 
            : '#1F2937',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: isHovered ? 'transparent' : '#1F2937',
        }}
        transition={{ duration: 0.3 }}
      >
        {title}
      </motion.h3>

      {/* Description with subtle animation */}
      <motion.p 
        className="text-gray-600 dark:text-gray-300 z-10 max-w-xs"
        animate={{ 
          opacity: isHovered ? 1 : 0.9,
          y: isHovered ? 0 : 2
        }}
        transition={{ duration: 0.3 }}
      >
        {description}
      </motion.p>

      {/* Animated arrow/indicator that appears on hover */}
      <motion.div
        className="mt-4 flex items-center justify-center gap-1 text-sm font-medium"
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : 10
        }}
        transition={{ duration: 0.3 }}
        style={{
          color: accentColor
        }}
      >
        Learn more
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="ml-1"
        >
          <motion.path 
            d="M5 12h14" 
            animate={{ 
              x: isHovered ? [0, 5, 0] : 0 
            }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
          />
          <motion.path 
            d="M12 5l7 7-7 7" 
            animate={{ 
              x: isHovered ? [0, 5, 0] : 0 
            }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
};

export default FeatureCard;