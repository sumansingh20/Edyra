'use client';

import { useState, useEffect } from 'react';

export default function LiveClock({ className = 'lms-header-time' }: { className?: string }) {
  const [serverTime, setServerTime] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      setServerTime(new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  if (!mounted) return <div className={className}>--:--:--</div>;

  return <div className={className}>{serverTime}</div>;
}
