import React from 'react';
import { Link } from 'react-router-dom';
import { HeaderSearch } from './HeaderSearch';
import { HeaderNotifications } from './HeaderNotifications';
import { HeaderProfileMenu } from './HeaderProfileMenu';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { useSecurity } from '@/contexts/SecurityContext';
import { Lock, Unlock, Wifi, WifiOff, ShieldCheck, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmergencyButton } from '@/components/dashboard/EmergencyButton';

function SecurityBadge() {
  const { trustScore, isKeysInitialized, isDeviceBound, isOffline } = useSecurity();

  // Color logic
  let scoreColor = 'text-emerald-500';
  if (trustScore < 80) scoreColor = 'text-amber-500';
  if (trustScore < 60) scoreColor = 'text-red-500';

  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1.5" title="Device Trust Score">
        {trustScore >= 80 ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />}
        <span className={cn("font-mono font-bold", scoreColor)}>{trustScore}%</span>
      </div>

      <div className="h-3 w-px bg-slate-700" />

      <div className="flex items-center gap-1.5" title="Encryption Status">
        {isKeysInitialized ? <Lock className="w-3.5 h-3.5 text-emerald-500" /> : <Unlock className="w-3.5 h-3.5 text-amber-500" />}
        <span className={cn("font-medium", isKeysInitialized ? "text-emerald-500" : "text-amber-500")}>
          {isKeysInitialized ? "ENCRYPTED" : "NO KEYS"}
        </span>
      </div>

      {isOffline && (
        <>
          <div className="h-3 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 text-amber-500" title="Offline Mode">
            <WifiOff className="w-3.5 h-3.5" />
            <span className="font-bold">OFFLINE</span>
          </div>
        </>
      )}
    </div>
  );
}

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 z-40">
      <div className="h-full flex items-center justify-between px-4 pl-20 max-w-full">
        {/* Logo & Brand */}
        <Link to="/home" className="flex items-center gap-3 shrink-0">
          <Logo size="md" />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-white leading-tight">TN CYBER CRIME WING</h1>
            <p className="text-xs text-cyan-400/70 font-mono">DIGITAL SHIELD v2.0</p>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link to="/security">
            <Button
              size="sm"
              className="hidden md:flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold"
            >
              <AlertTriangle className="w-4 h-4" />
              SOS / Report Cyber Crime
            </Button>
          </Link>

          <div className="hidden md:block">
            <EmergencyButton />
          </div>

          <div className="hidden lg:flex items-center gap-2 mr-2 px-3 py-1.5 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <SecurityBadge />
          </div>
          <div className="hidden md:block">
            <HeaderSearch />
          </div>
          <HeaderNotifications />
          <div className="ml-1">
            <HeaderProfileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
