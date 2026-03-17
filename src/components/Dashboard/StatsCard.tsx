'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'cyan' | 'green' | 'amber' | 'purple' | 'red' | 'blue';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const colorMap = {
  cyan: {
    bg: 'bg-accent-cyan/14',
    text: 'text-accent-cyan',
    border: 'hover:border-accent-cyan/30',
  },
  green: {
    bg: 'bg-accent-green/14',
    text: 'text-accent-green',
    border: 'hover:border-accent-green/30',
  },
  amber: {
    bg: 'bg-accent-amber/14',
    text: 'text-accent-amber',
    border: 'hover:border-accent-amber/30',
  },
  purple: {
    bg: 'bg-accent-purple/14',
    text: 'text-accent-purple',
    border: 'hover:border-accent-purple/30',
  },
  red: {
    bg: 'bg-accent-red/14',
    text: 'text-accent-red',
    border: 'hover:border-accent-red/30',
  },
  blue: {
    bg: 'bg-accent-blue/14',
    text: 'text-accent-blue',
    border: 'hover:border-accent-blue/30',
  },
};

export default function StatsCard({ title, value, subtitle, icon: Icon, color, trend }: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative overflow-hidden border border-border bg-card p-6 transition-all duration-200
        shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]
        ${colors.border} hover:shadow-elevated
      `}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${trend.isPositive ? 'text-success' : 'text-danger'}`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground font-normal">vs yesterday</span>
            </div>
          )}
        </div>
        <div className={`${colors.bg} ${colors.text} rounded-[14px] border border-current/12 p-3`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}
