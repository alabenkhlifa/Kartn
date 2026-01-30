'use client';

import { motion } from 'framer-motion';

interface GlowEffectProps {
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export default function GlowEffect({ className = '', intensity = 'medium' }: GlowEffectProps) {
  const intensities = {
    low: 'opacity-20',
    medium: 'opacity-30',
    high: 'opacity-50',
  };

  return (
    <motion.div
      className={`absolute rounded-full bg-neon-500 blur-3xl pointer-events-none ${intensities[intensity]} ${className}`}
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.4, 0.3],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
