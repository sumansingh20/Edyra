'use client';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { useEffect } from 'react';

type StatVariant = 'orange' | 'blue' | 'green' | 'red' | 'purple' | 'teal';

const VARIANT_STYLES: Record<StatVariant, { gradient: string; icon: string }> = {
  orange: {
    gradient: 'linear-gradient(135deg, rgba(249,128,18,0.12) 0%, rgba(249,128,18,0.04) 100%)',
    icon: 'rgba(249,128,18,0.15)',
  },
  blue: {
    gradient: 'linear-gradient(135deg, rgba(15,108,191,0.12) 0%, rgba(15,108,191,0.04) 100%)',
    icon: 'rgba(15,108,191,0.15)',
  },
  green: {
    gradient: 'linear-gradient(135deg, rgba(22,163,74,0.12) 0%, rgba(22,163,74,0.04) 100%)',
    icon: 'rgba(22,163,74,0.15)',
  },
  red: {
    gradient: 'linear-gradient(135deg, rgba(220,38,38,0.12) 0%, rgba(220,38,38,0.04) 100%)',
    icon: 'rgba(220,38,38,0.15)',
  },
  purple: {
    gradient: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(124,58,237,0.04) 100%)',
    icon: 'rgba(124,58,237,0.15)',
  },
  teal: {
    gradient: 'linear-gradient(135deg, rgba(13,148,136,0.12) 0%, rgba(13,148,136,0.04) 100%)',
    icon: 'rgba(13,148,136,0.15)',
  },
};

const BORDER_COLORS: Record<StatVariant, string> = {
  orange: '#f98012',
  blue: '#0f6cbf',
  green: '#16a34a',
  red: '#dc2626',
  purple: '#7c3aed',
  teal: '#0d9488',
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  variant?: StatVariant;
  delay?: number;
  loading?: boolean;
}

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  return <motion.span>{display}</motion.span>;
}

export default function StatCard({
  title,
  value,
  icon,
  change,
  changeType = 'neutral',
  variant = 'orange',
  delay = 0,
  loading = false,
}: StatCardProps) {
  const { gradient, icon: iconBg } = VARIANT_STYLES[variant];
  const borderColor = BORDER_COLORS[variant];
  const isNumeric = !isNaN(Number(value)) && value !== '';

  const changeColor =
    changeType === 'up' ? '#16a34a' : changeType === 'down' ? '#dc2626' : '#6a737b';
  const changePrefix = changeType === 'up' ? '↑' : changeType === 'down' ? '↓' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      style={{
        background: 'var(--card-bg)',
        border: `1px solid var(--border)`,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 'var(--radius-lg)',
        padding: '20px 22px',
        boxShadow: 'var(--shadow)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: gradient,
        pointerEvents: 'none',
      }} />

      {loading ? (
        <div>
          <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 28, width: '40%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 10, width: '30%' }} />
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              lineHeight: 1,
            }}>
              {title}
            </span>
            {icon && (
              <span style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius)',
                background: iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
              }}>
                {icon}
              </span>
            )}
          </div>

          <div style={{
            fontSize: 30,
            fontWeight: 800,
            fontFamily: "'Outfit', 'Inter', sans-serif",
            color: 'var(--text)',
            lineHeight: 1,
            marginBottom: 8,
          }}>
            {isNumeric ? <AnimatedNumber value={Number(value)} /> : value}
          </div>

          {change && (
            <div style={{ fontSize: 12, color: changeColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              {changePrefix && <span>{changePrefix}</span>}
              <span>{change}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
