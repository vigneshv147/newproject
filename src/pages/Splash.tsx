import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Lock, Wifi } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function Splash() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing secure connection...');

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }

        // Update status text based on progress
        if (prev === 30) setStatusText('Establishing encrypted tunnel...');
        if (prev === 60) setStatusText('Loading security protocols...');
        if (prev === 85) setStatusText('Verifying credentials...');

        return prev + 2;
      });
    }, 50);

    const redirect = setTimeout(() => {
      if (isAuthenticated) {
        navigate('/dashboard');
      } else {
        navigate('/auth');
      }
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [navigate, isAuthenticated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Scan Line Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,255,0.02)_2px,rgba(0,255,255,0.02)_4px)]" />

      {/* Content */}
      <div className="relative z-10 text-center space-y-8 px-4">
        {/* Logo */}
        <div className="relative">
          <div className="w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 p-0.5 animate-pulse">
            <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center overflow-hidden">
              <Logo size="xl" className="w-28 h-28 rounded-xl" />
            </div>
          </div>

          {/* Pulse Rings */}
          <div className="absolute inset-0 rounded-2xl border-2 border-cyan-500/30 animate-ping" style={{ animationDuration: '2s' }} />
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">TN CYBER CRIME WING</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            Advanced Real-Time Threat Monitoring<br />
            & Public Safety Interface
          </p>
        </div>

        {/* System Status */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-cyan-400" />
            AES-256
          </span>
          <span className="text-cyan-500/30">|</span>
          <span className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-emerald-400" />
            SECURE
          </span>
        </div>

        {/* Loading Bar */}
        <div className="w-80 mx-auto space-y-3">
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-100 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
          <p className="text-xs text-cyan-400 font-mono">
            {statusText} {progress}%
          </p>
        </div>

        {/* Footer */}
        <div className="pt-8 space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-widest">
            Cyber Crime Wing, State Police Headquarters
          </p>
          <p className="text-xs text-slate-600">
            TN Police Hackathon 2025 • Team CIT
          </p>
        </div>
      </div>
    </div>
  );
}
