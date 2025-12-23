import React from 'react';
import { TrackedIP } from '@/types';
import { X, MapPin, Clock, Activity, Fingerprint, AlertTriangle, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface IPDetailPanelProps {
  ip: TrackedIP | null;
  onClose: () => void;
}

const threatColors = {
  low: 'text-status-online',
  medium: 'text-status-warning',
  high: 'text-chameleon-orange',
  critical: 'text-destructive',
};

export function IPDetailPanel({ ip, onClose }: IPDetailPanelProps) {
  if (!ip) return null;

  return (
    <div className="glass-panel-strong p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              ip.threatLevel === 'low' && "bg-status-online",
              ip.threatLevel === 'medium' && "bg-status-warning",
              ip.threatLevel === 'high' && "bg-chameleon-orange",
              ip.threatLevel === 'critical' && "bg-destructive animate-pulse"
            )} />
            <h3 className="text-lg font-semibold font-mono">{ip.ip}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Tracked IP Details
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Risk Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Risk Score</span>
          <span className={cn("text-2xl font-bold", threatColors[ip.threatLevel])}>
            {ip.riskScore}/100
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              ip.riskScore < 30 && "bg-status-online",
              ip.riskScore >= 30 && ip.riskScore < 60 && "bg-status-warning",
              ip.riskScore >= 60 && ip.riskScore < 80 && "bg-chameleon-orange",
              ip.riskScore >= 80 && "bg-destructive"
            )}
            style={{ width: `${ip.riskScore}%` }}
          />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Location</span>
          </div>
          <p className="text-sm font-medium">{ip.city}, {ip.country}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Globe className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Country Code</span>
          </div>
          <p className="text-sm font-medium">{ip.countryCode}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Activity className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Requests</span>
          </div>
          <p className="text-sm font-medium">{ip.requestCount.toLocaleString()}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Threat Level</span>
          </div>
          <Badge 
            variant="outline" 
            className={cn("capitalize", threatColors[ip.threatLevel])}
          >
            {ip.threatLevel}
          </Badge>
        </div>
      </div>

      {/* Fingerprint */}
      {ip.fingerprint && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Fingerprint className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Traffic Fingerprint</span>
          </div>
          <code className="block p-2 bg-muted rounded text-sm font-mono">
            {ip.fingerprint}
          </code>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Timeline</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">First Seen</span>
            <span>{format(ip.firstSeen, 'MMM d, yyyy HH:mm')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last Seen</span>
            <span>{formatDistanceToNow(ip.lastSeen, { addSuffix: true })}</span>
          </div>
        </div>
      </div>

      {/* Behaviors */}
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Detected Behaviors
        </span>
        <div className="flex flex-wrap gap-2">
          {ip.behaviors.map((behavior, i) => (
            <Badge key={i} variant="secondary">
              {behavior}
            </Badge>
          ))}
        </div>
      </div>

      {/* Exit Node */}
      {ip.exitNode && (
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Exit Node
          </span>
          <p className="text-sm font-mono">{ip.exitNode}</p>
        </div>
      )}
    </div>
  );
}
