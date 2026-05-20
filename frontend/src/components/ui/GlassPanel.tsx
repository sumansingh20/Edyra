'use client';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  dark?: boolean;
  padding?: string;
  animate?: boolean;
  delay?: number;
  style?: React.CSSProperties;
}

export default function GlassPanel({
  children,
  className = '',
  dark = false,
  padding = '20px',
  animate = true,
  delay = 0,
  style = {},
}: GlassPanelProps) {
  const base = {
    padding,
    borderRadius: 'var(--radius-lg)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'var(--glass-border)'}`,
    background: dark ? 'rgba(0,0,0,0.35)' : 'var(--glass-bg)',
    boxShadow: 'var(--shadow-md)',
    ...style,
  };

  if (!animate) {
    return (
      <div className={className} style={base}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={base}
      initial={{ opacity: 0, scale: 0.97, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
