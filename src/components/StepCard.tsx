
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StepCardProps {
  number: number;
  title: string;
  description: string;
  className?: string;
}

const StepCard = ({ number, title, description, className }: StepCardProps) => {
  return (
    <motion.div 
      className={cn(
        "flex flex-col items-center text-center",
        "animate-slide-up opacity-0",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: number * 0.1 }}
      style={{
        animationDelay: `${0.2 + (number * 0.1)}s`,
        animationFillMode: 'forwards'
      }}
    >
      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary text-white 
                     flex items-center justify-center text-2xl font-bold mb-6
                     shadow-lg transition-transform duration-300 hover:scale-110">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};

export default StepCard;
