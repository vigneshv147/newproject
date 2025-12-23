import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: 'message' | 'alert' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

export function HeaderNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  // Fetch recent messages and convert to notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .neq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get read status for messages
      const messageIds = (messages || []).map(m => m.id);
      const { data: reads } = await supabase
        .from('message_reads')
        .select('message_id')
        .eq('user_id', user.id)
        .in('message_id', messageIds);

      const readIds = new Set(reads?.map(r => r.message_id) || []);

      const messageNotifications: Notification[] = (messages || []).map(msg => ({
        id: msg.id,
        type: 'message' as const,
        title: 'New Message',
        description: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
        timestamp: new Date(msg.created_at),
        read: readIds.has(msg.id),
        link: msg.channel_id ? `/messages?channel=${msg.channel_id}` : '/messages',
      }));

      // Add some system notifications
      const systemNotifications: Notification[] = [
        {
          id: 'system-1',
          type: 'alert',
          title: 'Critical Threat Detected',
          description: 'Multiple DDoS attack vectors identified from Tor exit nodes.',
          timestamp: new Date(Date.now() - 1800000),
          read: false,
          link: '/tor-tracking',
        },
        {
          id: 'system-2',
          type: 'system',
          title: 'System Update',
          description: 'Privacy assessment module updated to v2.3.1.',
          timestamp: new Date(Date.now() - 7200000),
          read: true,
        },
      ];

      setNotifications([...messageNotifications, ...systemNotifications].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      ));
    };

    fetchNotifications();

    // Subscribe to new messages
    const channel = supabase
      .channel('notifications-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new as any;
          if (msg.sender_id !== user?.id) {
            const newNotification: Notification = {
              id: msg.id,
              type: 'message',
              title: 'New Message',
              description: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
              timestamp: new Date(msg.created_at),
              read: false,
              link: '/messages',
            };
            setNotifications(prev => [newNotification, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    setOpen(false);

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'alert': return 'bg-destructive/20 text-destructive';
      case 'message': return 'bg-chameleon-blue/20 text-chameleon-blue';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="p-2 hover:bg-muted rounded-md transition-colors relative group">
          <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                    !notification.read && "bg-primary/5"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      getNotificationColor(notification.type)
                    )}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{notification.title}</p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {notification.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
