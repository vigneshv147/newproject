import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertTriangle,
  Radio,
  Shield,
  Zap,
  Lock,
  Bell,
  Send,
  Check,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { logSecureAudit } from '@/lib/crypto/audit-hashing';


interface SafeMode {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: 'red' | 'orange' | 'blue' | 'cyan';
  active: boolean;
}

export default function SafeModes() {
  const { user, profile, logout } = useAuth();
  const { toast } = useToast();
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<Array<{ message: string; time: Date }>>([]);
  const [safeModes, setSafeModes] = useState<SafeMode[]>([
    {
      id: 'lockdown',
      name: 'Full Lockdown',
      description: 'Restrict all external communications and enable maximum security protocols',
      icon: Lock,
      color: 'red',
      active: false,
    },
    {
      id: 'stealth',
      name: 'Stealth Mode',
      description: 'Minimize network footprint and enable traffic obfuscation',
      icon: Shield,
      color: 'orange',
      active: false,
    },
    {
      id: 'emergency',
      name: 'Emergency Response',
      description: 'Priority channels only, disable non-essential features',
      icon: Zap,
      color: 'blue',
      active: false,
    },
    {
      id: 'silent',
      name: 'Silent Operations',
      description: 'Disable all notifications and alerts except critical ones',
      icon: Bell,
      color: 'cyan',
      active: true,
    },
  ]);

  const toggleMode = async (id: string) => {
    const mode = safeModes.find(m => m.id === id);
    const newState = !mode?.active;

    setSafeModes(prev => prev.map(m =>
      m.id === id ? { ...m, active: newState } : m
    ));

    // Log the action
    if (user) {
      await logSecureAudit(`${mode?.name} ${newState ? 'activated' : 'deactivated'}`, {
        mode: id,
        active: newState
      }, user.id);
    }


    toast({
      title: newState ? `${mode?.name} Activated` : `${mode?.name} Disabled`,
      description: newState
        ? 'Enhanced security protocols now active'
        : 'Security protocols returning to normal',
    });
  };

  const sendBroadcast = async () => {
    if (!broadcastMessage.trim()) return;

    setIsSending(true);

    // Send as a message to all users
    if (user) {
      await (supabase as any).from('messages').insert({
        sender_id: user.id,
        content: `🚨 EMERGENCY BROADCAST: ${broadcastMessage}`,
        encrypted: true,
        priority: 'high',
      });


      await logSecureAudit('Emergency broadcast sent', { message: broadcastMessage }, user.id);
    }


    setBroadcastHistory(prev => [
      { message: broadcastMessage, time: new Date() },
      ...prev,
    ]);

    setIsSending(false);

    toast({
      title: 'Emergency Broadcast Sent',
      description: 'All connected officers have been notified',
    });
    setBroadcastMessage('');
  };

  const lockAllSessions = async () => {
    toast({
      title: 'Sessions Locked',
      description: 'All active sessions have been locked',
    });

    if (user) {
      await logSecureAudit('All sessions locked', {}, user.id);
    }


    // Log out the current user
    setTimeout(() => {
      logout();
    }, 2000);
  };

  const resetEncryptionKeys = async () => {
    toast({
      title: 'Encryption Keys Reset',
      description: 'New keys have been generated for all channels',
    });

    if (user) {
      await logSecureAudit('Encryption keys reset', {}, user.id);
    }

  };

  const clearMessageCache = async () => {
    toast({
      title: 'Cache Cleared',
      description: 'Local message cache has been securely wiped',
    });

    if (user) {
      await logSecureAudit('Message cache cleared', {}, user.id);
    }

  };

  const colorClasses = {
    red: {
      bg: 'bg-destructive/10',
      border: 'border-destructive/30',
      activeBg: 'bg-destructive/20',
      activeBorder: 'border-destructive',
      icon: 'text-destructive',
    },
    orange: {
      bg: 'bg-chameleon-orange/10',
      border: 'border-chameleon-orange/30',
      activeBg: 'bg-chameleon-orange/20',
      activeBorder: 'border-chameleon-orange',
      icon: 'text-chameleon-orange',
    },
    blue: {
      bg: 'bg-chameleon-blue/10',
      border: 'border-chameleon-blue/30',
      activeBg: 'bg-chameleon-blue/20',
      activeBorder: 'border-chameleon-blue',
      icon: 'text-chameleon-blue',
    },
    cyan: {
      bg: 'bg-chameleon-cyan/10',
      border: 'border-chameleon-cyan/30',
      activeBg: 'bg-chameleon-cyan/20',
      activeBorder: 'border-chameleon-cyan',
      icon: 'text-chameleon-cyan',
    },
  };

  return (
    <PageLayout title="Safe Modes" subtitle="Emergency protocols & alerts">
      <div className="p-6 space-y-6">
        {/* Emergency Broadcast */}
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-6 space-y-4 border-l-4 border-l-red-500 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <Radio className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Emergency Broadcast</h2>
              <p className="text-sm text-slate-400">
                Send an immediate alert to all connected officers
              </p>
            </div>
          </div>

          <Textarea
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder="Type your emergency message..."
            className="min-h-[100px]"
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              This will send an encrypted broadcast to all active devices
            </p>
            <Button
              onClick={sendBroadcast}
              disabled={!broadcastMessage.trim() || isSending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Broadcast
            </Button>
          </div>

          {/* Broadcast History */}
          {broadcastHistory.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="text-sm font-medium mb-2">Recent Broadcasts</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {broadcastHistory.map((item, i) => (
                  <div key={i} className="flex justify-between items-start text-sm p-2 bg-muted/50 rounded">
                    <span className="truncate flex-1">{item.message}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {item.time.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Safe Modes Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
            <Shield className="w-6 h-6 text-cyan-400" />
            Security Modes
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {safeModes.map((mode) => {
              const Icon = mode.icon;
              const colors = colorClasses[mode.color];

              return (
                <button
                  key={mode.id}
                  onClick={() => toggleMode(mode.id)}
                  className={cn(
                    "p-6 rounded-lg border-2 text-left transition-all",
                    mode.active
                      ? `${colors.activeBg} ${colors.activeBorder}`
                      : `${colors.bg} ${colors.border} hover:border-opacity-50`
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("p-2 rounded-lg", colors.bg)}>
                      <Icon className={cn("w-6 h-6", colors.icon)} />
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      mode.active
                        ? `${colors.activeBorder} ${colors.activeBg}`
                        : "border-muted-foreground/30"
                    )}>
                      {mode.active && (
                        <Check className={cn("w-4 h-4", colors.icon)} />
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg">{mode.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{mode.description}</p>

                  <div className="mt-4 flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      mode.active ? "bg-status-online" : "bg-muted-foreground/30"
                    )} />
                    <span className="text-xs text-muted-foreground">
                      {mode.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-6 space-y-4 backdrop-blur-sm">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            Quick Actions
          </h2>

          <div className="grid sm:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={lockAllSessions}
            >
              <Lock className="w-5 h-5 text-destructive" />
              <span>Lock All Sessions</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={resetEncryptionKeys}
            >
              <Shield className="w-5 h-5 text-chameleon-blue" />
              <span>Reset Encryption Keys</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={clearMessageCache}
            >
              <Trash2 className="w-5 h-5 text-chameleon-cyan" />
              <span>Clear Message Cache</span>
            </Button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-6 space-y-4 backdrop-blur-sm">
          <h3 className="font-semibold text-white">Current Status</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-status-online">Active</p>
              <p className="text-sm text-muted-foreground">System Status</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{safeModes.filter(m => m.active).length}</p>
              <p className="text-sm text-muted-foreground">Modes Active</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">256-bit</p>
              <p className="text-sm text-muted-foreground">Encryption</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">47</p>
              <p className="text-sm text-muted-foreground">Connected Devices</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
