'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  sm: { radius: 16, strokeWidth: 3, fontSize: 'text-[8px]' },
  md: { radius: 24, strokeWidth: 4, fontSize: 'text-xs' },
  lg: { radius: 36, strokeWidth: 5, fontSize: 'text-sm' },
};

export function CircularProgress({
  percentage,
  size = 'sm',
  showLabel = true,
  className,
}: CircularProgressProps) {
  const config = SIZE_CONFIG[size];
  const circumference = 2 * Math.PI * config.radius;
  const offset = circumference - (percentage / 100) * circumference;

  const svgSize = config.radius * 2 + config.strokeWidth * 2;
  const center = svgSize / 2;

  // Color basado en el porcentaje
  const getColor = () => {
    if (percentage >= 80) return '#10b981'; // green-500
    if (percentage >= 60) return '#3b82f6'; // blue-500
    if (percentage >= 40) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={svgSize} height={svgSize} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={config.radius}
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          fill="none"
          className="text-slate-200 dark:text-slate-700"
        />

        {/* Progress circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={config.radius}
          stroke={getColor()}
          strokeWidth={config.strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      </svg>

      {/* Percentage label */}
      {showLabel && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center font-semibold',
            config.fontSize
          )}
        >
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}
