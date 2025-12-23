import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  X,
  Home,
  MessageSquare,
  Shield,
  AlertTriangle,
  ExternalLink,
  LogOut,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { teamMembers } from '@/data/mockData';
import { Logo } from '@/components/ui/Logo';

interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

export function CommandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      // Get messages from the last 24 hours not sent by current user
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id, sender_id, channel_id')
        .neq('sender_id', user.id)
        .gte('created_at', oneDayAgo.toISOString());

      if (msgError || !messages || messages.length === 0) {
        setUnreadCount(0);
        return;
      }

      // Get read receipts for current user
      const { data: reads, error: readError } = await supabase
        .from('message_reads')
        .select('message_id')
        .eq('user_id', user.id);

      if (readError) {
        console.log('Could not fetch read receipts:', readError);
        setUnreadCount(0);
        return;
      }

      const readIds = new Set(reads?.map(r => r.message_id) || []);
      const unread = messages.filter(m => !readIds.has(m.id)).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching unread count:', err);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Subscribe to message_reads changes
    const channel = supabase
      .channel('command-menu-reads')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reads',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const menuItems: MenuItem[] = [
    { label: 'Home', icon: Home, path: '/dashboard' },
    { label: 'Secure Messages', icon: MessageSquare, path: '/messages', badge: unreadCount },
    { label: 'Security', icon: Shield, path: '/security' },
    { label: 'Safe Modes', icon: AlertTriangle, path: '/safe-modes' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 p-3 bg-slate-900/80 border border-slate-700/50 rounded-lg hover:bg-slate-800 transition-all duration-200 group backdrop-blur-sm"
        aria-label="Open menu"
      >
        <div className="flex flex-col gap-1.5 w-6">
          <span className="block h-0.5 bg-white group-hover:bg-cyan-400 transition-colors" />
          <span className="block h-0.5 bg-white group-hover:bg-cyan-400 transition-colors w-4" />
          <span className="block h-0.5 bg-white group-hover:bg-cyan-400 transition-colors w-5" />
        </div>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side Menu */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-80 bg-slate-900 border-r border-slate-700 z-50",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div>
              <h2 className="font-semibold text-sm text-white">TN Cyber Crime Wing</h2>
              <p className="text-xs text-slate-400">Cyber Crime Wing</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        {profile && (
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {profile.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-white">{profile.name}</p>
                <p className="text-xs text-slate-400 capitalize">{profile.role}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 flex-1 overflow-y-auto scrollbar-thin">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200",
                      "hover:bg-slate-800 group",
                      isActive && "bg-cyan-500/10 text-cyan-400"
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-white"
                    )} />
                    <span className={cn(
                      "flex-1 font-medium text-sm",
                      isActive ? "text-cyan-400" : "text-slate-300"
                    )}>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-cyan-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* External Links */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-3">
              External
            </p>
            <a
              href="https://www.tnpolice.gov.in/citizenportal"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-800 transition-colors group"
            >
              <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-cyan-400" />
              <span className="flex-1 font-medium text-sm text-slate-300">TN Police Portal</span>
            </a>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-red-500/10 transition-colors text-red-400"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}