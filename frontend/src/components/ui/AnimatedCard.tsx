'use client';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function AnimatedCard({
  children,
  className = '',
  delay = 0,
  hover = true,
  onClick,
  style = {},
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={
        hover
          ? {
              y: -2,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              transition: { duration: 0.2 },
            }
          : undefined
      }
      onClick={onClick}
      className={className}
      style={{ cursor: onClick ? 'pointer' : undefined, ...style }}
    >
      {children}
    </motion.div>
  );
}
