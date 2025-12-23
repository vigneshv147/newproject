import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Activity, Lock, Globe, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThreatItem {
  id: string;
  type: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  time: string;
}

export function SecurityMonitor() {
  const [threats, setThreats] = useState<ThreatItem[]>([
    { id: '1', type: 'Tor', level: 'medium', message: 'New Tor exit node detected in Chennai', time: '2m ago' },
    { id: '2', type: 'Network', level: 'low', message: 'Encrypted traffic spike on port 443', time: '5m ago' },
    { id: '3', type: 'Auth', level: 'high', message: 'Multiple failed login attempts blocked', time: '12m ago' },
  ]);
  
  const [stats, setStats] = useState({
    activeNodes: 5,
    blockedThreats: 23,
    encryptedChannels: 8,
    uptime: 99.9,
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-destructive bg-destructive/10';
      case 'high': return 'text-status-danger bg-status-danger/10';
      case 'medium': return 'text-status-warning bg-status-warning/10';
      default: return 'text-status-online bg-status-online/10';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return AlertTriangle;
      default:
        return Activity;
    }
  };

  return (
    <div className="glass-panel p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-chameleon-purple" />
          Security Monitor
        </h3>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-status-online animate-pulse" />
          <span className="text-xs text-status-online">Live</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <Globe className="w-4 h-4 mx-auto mb-1 text-chameleon-blue" />
          <p className="text-lg font-bold">{stats.activeNodes}</p>
          <p className="text-[10px] text-muted-foreground">Active Nodes</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <Lock className="w-4 h-4 mx-auto mb-1 text-chameleon-purple" />
          <p className="text-lg font-bold">{stats.encryptedChannels}</p>
          <p className="text-[10px] text-muted-foreground">Encrypted</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-status-warning" />
          <p className="text-lg font-bold">{stats.blockedThreats}</p>
          <p className="text-[10px] text-muted-foreground">Blocked</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <Wifi className="w-4 h-4 mx-auto mb-1 text-status-online" />
          <p className="text-lg font-bold">{stats.uptime}%</p>
          <p className="text-[10px] text-muted-foreground">Uptime</p>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Recent Alerts</p>
        {threats.map((threat) => {
          const Icon = getLevelIcon(threat.level);
          return (
            <div
              key={threat.id}
              className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className={cn('p-1 rounded', getLevelColor(threat.level))}>
                <Icon className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">{threat.message}</p>
                <p className="text-[10px] text-muted-foreground">{threat.time}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Bar */}
      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-status-online" />
            <span className="text-muted-foreground">All systems operational</span>
          </div>
          <span className="text-muted-foreground">Last scan: 1m ago</span>
        </div>
      </div>
    </div>
  );
}
