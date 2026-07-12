import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CountUp = ({ end, duration = 1000 }: { end: string | number, duration?: number }) => {
  const [count, setCount] = useState(0);
  const isNumber = typeof end === 'number' || !isNaN(Number(end));
  const target = isNumber ? Number(end) : 0;
  
  useEffect(() => {
    if (!isNumber) return;
    let startTimestamp: number | null = null;
    let animationFrameId: number;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };
    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [target, duration, isNumber]);

  return <span>{isNumber ? count : end}</span>;
};

interface SummaryCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  colorClass: string;
  onClick?: () => void;
}

export function SummaryCard({ title, value, icon: Icon, colorClass, onClick }: SummaryCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={`bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between ${onClick ? 'cursor-pointer hover:bg-secondary/50 transition-colors' : ''}`}
    >
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-foreground"><CountUp end={value} /></p>
      </div>
      <div className={`h-12 w-12 rounded-full flex items-center justify-center bg-secondary ${colorClass}`}>
        <Icon size={24} />
      </div>
    </motion.div>
  );
}
