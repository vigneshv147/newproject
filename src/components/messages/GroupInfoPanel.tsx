import React, { useState, useRef, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  X,
  Camera,
  Users,
  FileText,
  Clock,
  Settings,
  Image as ImageIcon,
  Video,
  File
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Channel } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface Participant {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string;
  isOnline?: boolean;
}

interface SharedFile {
  id: string;
  name: string;
  type: string;
  url: string;
  sharedAt: Date;
  sharedBy: string;
}

interface GroupInfoPanelProps {
  channel: Channel;
  onClose: () => void;
}

export function GroupInfoPanel({ channel, onClose }: GroupInfoPanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track online presence using Supabase Realtime
  useEffect(() => {
    if (!user || !channel.id) return;

    const presenceChannel = supabase.channel(`presence-${channel.id}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineUserIds = new Set(Object.keys(state));
        setOnlineUsers(onlineUserIds);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [user, channel.id]);

  // Fetch real participants from database
  const fetchParticipants = useCallback(async () => {
    if (!channel.id) return;

    try {
      // Get participant user_ids from channel_participants
      const { data: participantData } = await supabase
        .from('channel_participants')
        .select('user_id')
        .eq('channel_id', channel.id);

      // Also get users who have sent messages in this channel
      const { data: messageSenders } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('channel_id', channel.id);

      // Combine both sources of user IDs
      const participantIds = participantData?.map(p => p.user_id) || [];
      const senderIds = messageSenders?.map(m => m.sender_id) || [];
      const allUserIds = [...new Set([...participantIds, ...senderIds, ...(channel.participants || [])])];

      console.log('Channel participants IDs:', allUserIds);

      if (allUserIds.length === 0) {
        setParticipants([]);
        return;
      }

      // Fetch profiles for all users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', allUserIds);

      console.log('Fetched profiles:', profiles);

      if (profiles && profiles.length > 0) {
        setParticipants(profiles.map(p => ({
          id: p.user_id,
          user_id: p.user_id,
          name: p.name || 'User',
          avatar_url: p.avatar_url || undefined,
          isOnline: onlineUsers.has(p.user_id) || p.user_id === user?.id
        })));
      } else {
        setParticipants([]);
      }
    } catch (err) {
      console.error('Error fetching participants:', err);
      setParticipants([]);
    }
  }, [channel.id, channel.participants, user, onlineUsers]);

  // Fetch real files shared in this channel
  const fetchSharedFiles = useCallback(async () => {
    if (!channel.id) return;

    try {
      // Get messages with attachments in this channel
      const { data: messages } = await supabase
        .from('messages')
        .select('id, sender_id, attachment_url, attachment_name, attachment_type, created_at')
        .eq('channel_id', channel.id)
        .not('attachment_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!messages || messages.length === 0) {
        setSharedFiles([]);
        return;
      }

      // Get sender names
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      setSharedFiles(messages.map(m => ({
        id: m.id,
        name: m.attachment_name || 'Unknown file',
        type: m.attachment_type || 'application/octet-stream',
        url: m.attachment_url || '',
        sharedAt: new Date(m.created_at),
        sharedBy: profileMap.get(m.sender_id) || 'Unknown'
      })));
    } catch (err) {
      console.error('Error fetching shared files:', err);
      setSharedFiles([]);
    }
  }, [channel.id]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchParticipants(), fetchSharedFiles()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchParticipants, fetchSharedFiles]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileName = `channel-${channel.id}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('message-attachments')
        .upload(`channel-avatars/${fileName}`, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(`channel-avatars/${fileName}`);

      setAvatarUrl(urlData.publicUrl);
      toast({
        title: 'Avatar updated',
        description: 'Channel avatar has been updated',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload avatar',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-green-500" />;
    if (type.startsWith('video/')) return <Video className="w-5 h-5 text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l border-border shadow-xl z-50 flex flex-col animate-in slide-in-from-right">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold">Channel Info</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Channel Profile */}
      <div className="p-6 flex flex-col items-center border-b border-border">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-chameleon-purple to-chameleon-blue flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={channel.name} className="w-full h-full object-cover" />
            ) : (
              <Users className="w-10 h-10 text-primary-foreground" />
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
        <h4 className="mt-4 text-lg font-semibold">{channel.name}</h4>
        <p className="text-sm text-muted-foreground capitalize">{channel.type} Channel</p>
        <p className="text-xs text-muted-foreground mt-1">
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="participants" className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger
            value="participants"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            <Users className="w-4 h-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger
            value="files"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            <FileText className="w-4 h-4 mr-2" />
            Files
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="participants" className="m-0 p-4 space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Loading members...</p>
              </div>
            ) : participants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No members found</p>
              </div>
            ) : (
              participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={participant.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-chameleon-purple to-chameleon-blue text-primary-foreground text-xs">
                        {participant.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                      participant.isOnline ? "bg-status-online" : "bg-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{participant.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {participant.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="files" className="m-0 p-4 space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Loading files...</p>
              </div>
            ) : sharedFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No files shared yet</p>
              </div>
            ) : (
              sharedFiles.map((file) => (
                <a
                  key={file.id}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.sharedBy} • {formatDistanceToNow(file.sharedAt, { addSuffix: true })}
                    </p>
                  </div>
                </a>
              ))
            )}
          </TabsContent>

          <TabsContent value="settings" className="m-0 p-4 space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h5 className="font-medium text-sm mb-2">Channel Description</h5>
              <p className="text-sm text-muted-foreground">
                Secure communication channel for {channel.name}. All messages are end-to-end encrypted.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h5 className="font-medium text-sm mb-2">Channel Type</h5>
              <p className="text-sm text-muted-foreground capitalize">
                {channel.type} Channel
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h5 className="font-medium text-sm mb-2">Encryption</h5>
              <p className="text-sm text-muted-foreground">
                Signal Protocol • AES-256
              </p>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
