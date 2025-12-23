import React from 'react';
import { AlertTriangle, AlertCircle, Info, Check } from 'lucide-react';
import { Alert } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AlertsListProps {
  alerts: Alert[];
  onAcknowledge?: (id: string) => void;
}

const alertIcons = {
  emergency: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

const alertColors = {
  emergency: 'border-l-destructive bg-destructive/5',
  warning: 'border-l-status-warning bg-status-warning/5',
  info: 'border-l-chameleon-blue bg-chameleon-blue/5',
};

export function AlertsList({ alerts, onAcknowledge }: AlertsListProps) {
  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const Icon = alertIcons[alert.type];
        
        return (
          <div
            key={alert.id}
            className={cn(
              "p-4 rounded-lg border-l-4 transition-all",
              alertColors[alert.type],
              alert.acknowledged && "opacity-60"
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className={cn(
                "w-5 h-5 mt-0.5 flex-shrink-0",
                alert.type === 'emergency' && "text-destructive",
                alert.type === 'warning' && "text-status-warning",
                alert.type === 'info' && "text-chameleon-blue"
              )} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium text-sm">{alert.title}</h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                
                {!alert.acknowledged && onAcknowledge && (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
