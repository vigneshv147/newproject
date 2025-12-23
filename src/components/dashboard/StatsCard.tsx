import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: 'purple' | 'blue' | 'cyan' | 'green' | 'orange' | 'red';
}

const iconColorClasses = {
  purple: 'bg-chameleon-purple/20 text-chameleon-purple',
  blue: 'bg-chameleon-blue/20 text-chameleon-blue',
  cyan: 'bg-chameleon-cyan/20 text-chameleon-cyan',
  green: 'bg-status-online/20 text-status-online',
  orange: 'bg-chameleon-orange/20 text-chameleon-orange',
  red: 'bg-chameleon-red/20 text-chameleon-red',
};

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon,
  iconColor = 'purple' 
}: StatsCardProps) {
  return (
    <div className="glass-panel p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change && (
            <p className={cn(
              "text-xs font-medium",
              changeType === 'positive' && "text-status-online",
              changeType === 'negative' && "text-destructive",
              changeType === 'neutral' && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={cn("p-2 rounded-lg", iconColorClasses[iconColor])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
