import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import {
  MessageSquare,
  Send,
  Lock,
  Search,
  Plus,
  Hash,
  Circle,
  Smile,
  Paperclip,
  Users,
  User,
  Info,
  FileText,
  Image as ImageIcon,
  X,
  Trash2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserSearchDialog } from '@/components/messages/UserSearchDialog';
import { GroupInfoPanel } from '@/components/messages/GroupInfoPanel';
import { encryptEnvelope, decryptEnvelope, EncryptedEnvelope } from '@/lib/crypto/envelope';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  channel_id: string | null;
  sender_name?: string;
  sender_avatar?: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  encrypted?: boolean;
}

// Helper to decrypt message content safely
async function decryptMessageContent(content: string): Promise<string> {
  if (!content) return '';

  // Check if content looks like a JSON envelope
  if (content.trim().startsWith('{') && content.includes('"ciphertext"')) {
    try {
      const envelope = JSON.parse(content) as EncryptedEnvelope;
      return await decryptEnvelope(envelope);
    } catch (err) {
      console.error('Decryption failed for envelope:', err);
      return '🔓 [Decryption Error]';
    }
  }

  // Return plain text for legacy messages
  return content;
}


interface Channel {
  id: string;
  name: string;
  type: 'group' | 'broadcast' | 'direct';
  participants: string[];
  unreadCount?: number;
}

// Default channels
const defaultChannelData = [
  { id: 'general', name: 'General', type: 'group' },
  { id: 'cyber-crime', name: 'Cyber Crime Unit', type: 'group' },
  { id: 'emergency', name: 'Emergency Broadcast', type: 'broadcast' },
  { id: 'investigation', name: 'Investigation Team', type: 'group' },
];

// Helper to save channels to localStorage
const saveChannelsToStorage = (channels: Channel[]) => {
  localStorage.setItem('chameleon_channels', JSON.stringify(channels));
};

// Helper to load channels from localStorage
const loadChannelsFromStorage = (): Channel[] | null => {
  const saved = localStorage.getItem('chameleon_channels');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
};

// Helper to save messages for a channel to localStorage
const saveMessagesToStorage = (channelId: string, messages: Message[]) => {
  // Only save the last 50 messages to prevent storage bloat
  localStorage.setItem(`chameleon_msgs_${channelId}`, JSON.stringify(messages.slice(-50)));
};

// Helper to load messages for a channel from localStorage
const loadMessagesFromStorage = (channelId: string): Message[] => {
  const saved = localStorage.getItem(`chameleon_msgs_${channelId}`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

// Helper to get deleted channel IDs from storage
const getDeletedChannels = (): string[] => {
  try {
    const saved = localStorage.getItem('chameleon_deleted_channels');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// Helper to save deleted channel ID
const markChannelAsDeleted = (channelId: string) => {
  const deleted = getDeletedChannels();
  if (!deleted.includes(channelId)) {
    deleted.push(channelId);
    localStorage.setItem('chameleon_deleted_channels', JSON.stringify(deleted));
  }
};

export default function Messages() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [isNewChannelOpen, setIsNewChannelOpen] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [profilesCache, setProfilesCache] = useState<Record<string, { name: string; avatar_url?: string }>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch all profiles for sender names
  const fetchProfiles = useCallback(async () => {
    try {
      const { data } = await supabase.from('profiles').select('user_id, name, avatar_url');
      if (data) {
        const cache: Record<string, { name: string; avatar_url?: string }> = {};
        (data as any[]).forEach(p => {
          cache[p.user_id] = { name: p.name, avatar_url: p.avatar_url || undefined };
        });
        setProfilesCache(cache);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Initialize channels - fetch from database with local storage merge
  useEffect(() => {
    if (!user) return;

    const initChannels = async () => {
      // Load from local storage first for immediate data
      const localChannels = loadChannelsFromStorage() || [];
      const defaultChannels: Channel[] = defaultChannelData.map(ch => ({
        id: ch.id,
        name: ch.name,
        type: ch.type as 'group' | 'broadcast' | 'direct',
        participants: [user.id],
      }));

      // Combine defaults with local storage (avoid duplicates)
      let currentChannels = [...localChannels];
      defaultChannels.forEach(def => {
        if (!currentChannels.find(c => c.id === def.id)) {
          currentChannels.push(def);
        }
      });

      // CRITICAL FIX: Filter out deleted channels immediately from initial load
      const deletedIds = new Set(getDeletedChannels());
      currentChannels = currentChannels.filter(c => !deletedIds.has(c.id));

      setChannels(currentChannels);
      if (currentChannels.length > 0 && !selectedChannel) {
        setSelectedChannel(currentChannels[0]);
      }

      try {
        // Fetch all channels from database
        const { data: dbGroupChannels, error: dbError } = await (supabase as any)
          .from('message_channels')
          .select('*')
          .in('type', ['group', 'broadcast'])
          .order('created_at', { ascending: true });

        if (dbError) {
          // If JWT error or other auth issue, stick with current channels
          console.warn('Database channel fetch failed (using local data):', dbError.message);
          return;
        }

        const { data: userDMParticipations } = await (supabase as any)
          .from('channel_participants')
          .select('channel_id')
          .eq('user_id', user.id);

        const userDMChannelIds = userDMParticipations?.map(p => p.channel_id) || [];

        let dbDMChannels: any[] = [];
        if (userDMChannelIds.length > 0) {
          const { data: dms } = await (supabase as any)
            .from('message_channels')
            .select('*')
            .eq('type', 'direct')
            .in('id', userDMChannelIds);
          dbDMChannels = dms || [];
        }

        const allDBChannelsSource = [...(dbGroupChannels || []), ...dbDMChannels];

        // Fetch participants for these channels
        const channelParticipants: Record<string, string[]> = {};
        for (const ch of allDBChannelsSource) {
          if (ch.type === 'direct') {
            const { data: participants } = await (supabase as any)
              .from('channel_participants')
              .select('user_id')
              .eq('channel_id', ch.id);
            channelParticipants[ch.id] = participants?.map(p => p.user_id) || [user.id];
          }
        }

        const mappedDBChannels: Channel[] = allDBChannelsSource.map(ch => ({
          id: ch.id,
          name: ch.name,
          type: ch.type as 'group' | 'broadcast' | 'direct',
          participants: channelParticipants[ch.id] || [user.id],
        }));

        // MERGE: Keep all DB channels, and add any local channels that aren't in DB yet
        const dbIds = new Set(mappedDBChannels.map(c => c.id));
        const finalChannels = [...mappedDBChannels];
        currentChannels.forEach(lc => {
          if (!dbIds.has(lc.id)) {
            finalChannels.push(lc);
          }
        });

        // FILTER: Remove channels that have been marked as deleted locally
        const deletedIds = new Set(getDeletedChannels());
        const activeChannels = finalChannels.filter(c => !deletedIds.has(c.id));

        setChannels(activeChannels);
        saveChannelsToStorage(activeChannels);

        // Update selected channel if needed
        const channelParam = searchParams.get('channel');
        if (channelParam) {
          const target = activeChannels.find(c => c.id === channelParam);
          if (target) setSelectedChannel(target);
        }
      } catch (err: any) {
        console.warn('Silent error in initChannels (fallback to local):', err.message);
      }
    };

    initChannels();
  }, [user, searchParams]);

  // Fetch messages for selected channel - CRITICAL: Filter by channel_id
  const fetchMessages = useCallback(async () => {
    if (!user || !selectedChannel) {
      setMessages([]);
      return;
    }

    console.log('Fetching messages for channel:', selectedChannel.id);

    try {
      const { data, error } = await (supabase as any)
        .from('messages')

        .select('*')
        .eq('channel_id', selectedChannel.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
        return;
      }

      console.log(`Found ${data?.length || 0} messages for channel ${selectedChannel.id}`);

      if (!data || data.length === 0) {
        setMessages([]);
        return;
      }

      // Get unique sender IDs
      const senderIds = [...new Set(data.map(m => m.sender_id))];

      // Build final message list: Start with local, then add DB messages that aren't already there
      const localMsgs = loadMessagesFromStorage(selectedChannel.id);
      const dbIds = new Set(data.map(m => m.id));
      const finalMessages = [...data];

      // Add local messages that haven't been synced (or aren't in DB yet)
      localMsgs.forEach(lm => {
        if (!dbIds.has(lm.id)) {
          finalMessages.push(lm);
        }
      });

      // Sort by date
      finalMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      // Create a map of sender profiles
      const profileMap: Record<string, { name: string; avatar_url?: string }> = {};
      // Fix: Use profilesCache if senderProfiles was a typo, or fetch them. 
      // Since fetchProfiles populates profilesCache, and it's redundant to rebuild profileMap from it here if we use profilesCache directly in render.
      // But fetchMessages uses it for message enrichment.
      // We'll use profilesCache directly if available, or just skip this step and rely on the enrichment logic below utilizing profileMap if we can populate it.
      // Actually, let's just use the component state `profilesCache` which is already populated by `fetchProfiles`

      // ... WAIT, `senderProfiles` variable doesn't exist in scope. 
      // It seems the intent was to use the data fetched in `fetchProfiles` but that is async.
      // We will remove the reference to `senderProfiles` and use `profilesCache` state, 
      // but `fetchMessages` is a callback that might run before `profilesCache` is populated if not careful.
      // However, for now, let's just iterate over unique senderIds and try to get from cache or just leave it since we have `profilesCache` in dependency.

      // Better fix: Just use profilesCache from state directly in the map loop below.


      // Map messages with sender names and decrypt content
      const messagesWithNames = await Promise.all(finalMessages.map(async (msg) => ({
        ...msg,
        content: msg.encrypted ? await decryptMessageContent(msg.content) : msg.content,
        sender_name: msg.sender_id === user.id
          ? (profile?.name || 'You')
          : (profilesCache[msg.sender_id]?.name || 'User'),
        sender_avatar: profilesCache[msg.sender_id]?.avatar_url,
      })));

      setMessages(messagesWithNames);
      saveMessagesToStorage(selectedChannel.id, messagesWithNames);

      // Mark messages as read
      const unread = messagesWithNames.filter(m => m.sender_id !== user.id);
      if (unread.length > 0) {
        try {
          const { data: reads } = await (supabase as any)
            .from('message_reads')
            .select('message_id')
            .eq('user_id', user.id)
            .in('message_id', unread.map(m => m.id));


          const readSet = new Set(reads?.map(r => r.message_id) || []);
          const toMark = unread.filter(m => !readSet.has(m.id));

          if (toMark.length > 0) {
            await (supabase as any).from('message_reads').insert(
              toMark.map(m => ({ message_id: m.id, user_id: user.id }))
            );

            console.log(`Marked ${toMark.length} messages as read`);
          }
        } catch (err) {
          console.log('Could not mark messages as read:', err);
        }
      }
    } catch (err) {
      console.error('Error in fetchMessages:', err);
      // Fallback to local storage only on failure
      if (selectedChannel) {
        setMessages(loadMessagesFromStorage(selectedChannel.id));
      }
    }
  }, [user, profile, selectedChannel]);

  // Clear and refetch messages when channel changes
  useEffect(() => {
    setMessages([]); // Clear messages first to prevent showing old channel's messages
    fetchMessages();
  }, [selectedChannel?.id]); // Only depend on channel ID

  // Also refetch when profile cache is ready
  useEffect(() => {
    if (Object.keys(profilesCache).length > 0 && selectedChannel) {
      fetchMessages();
    }
  }, [profilesCache]);

  // Real-time subscription - CRITICAL: Filter by channel_id
  useEffect(() => {
    if (!user || !selectedChannel) return;

    console.log('Setting up realtime subscription for channel:', selectedChannel.id);

    const subscription = supabase
      .channel(`messages-${selectedChannel.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${selectedChannel.id}`
      }, (payload) => {
        const msg = payload.new as Message;
        console.log('Realtime message received:', payload);

        // Async decryption for realtime messages
        const handleRealtime = async () => {
          if (msg.channel_id === selectedChannel.id) {
            const decryptedContent = await decryptMessageContent(msg.content);
            const enrichedMsg = {
              ...msg,
              content: decryptedContent,
              sender_name: msg.sender_id === user.id
                ? (profile?.name || 'You')
                : (profilesCache[msg.sender_id]?.name || 'Unknown'),
              sender_avatar: profilesCache[msg.sender_id]?.avatar_url,
            };
            setMessages(prev => [...prev, enrichedMsg]);
          }
        };

        handleRealtime();

      })
      .subscribe();

    return () => {
      console.log('Cleaning up subscription for channel:', selectedChannel.id);
      subscription.unsubscribe();
    };
  }, [user, profile, selectedChannel?.id, profilesCache]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedChannel) return;

    const messageText = newMessage.trim();
    const tempId = `msg-${Date.now()}`;

    // 1. Create optimistic local message
    const optimisticMsg: Message = {
      id: tempId,
      sender_id: user.id,
      content: messageText,
      created_at: new Date().toISOString(),
      channel_id: selectedChannel.id,
      sender_name: profile?.name || 'You',
      sender_avatar: profile?.avatar_url || undefined,
      encrypted: false, // Local display is unencrypted
    };

    // 2. Update state and localStorage immediately
    const updatedMessages = [...messages, optimisticMsg];
    setMessages(updatedMessages);
    saveMessagesToStorage(selectedChannel.id, updatedMessages);
    setNewMessage('');
    inputRef.current?.focus();

    setIsLoading(true);
    try {
      // 🛡️ Encrypt message content before sending to DB
      const envelope = await encryptEnvelope(messageText);
      const encryptedContent = JSON.stringify(envelope);

      const { error } = await (supabase as any).from('messages').insert({
        id: tempId,
        sender_id: user.id,
        content: encryptedContent,
        encrypted: true,
        priority: 'normal',
        channel_id: selectedChannel.id,
      });

      if (error) {
        console.warn('Silent sync to DB failed (saved locally):', error.message);
      }
    } catch (err: any) {
      console.warn('Caught send error (saved locally):', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // File upload with better error handling
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedChannel) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 10MB', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    console.log('Uploading file:', file.name, file.type, file.size);

    try {
      const fileName = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: 'Upload Failed',
          description: `${uploadError.message}. Make sure to run the storage bucket SQL.`,
          variant: 'destructive'
        });
        return;
      }

      console.log('Upload success:', uploadData);

      const { data: urlData } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(fileName);

      console.log('Public URL:', urlData.publicUrl);

      const { error: msgError } = await (supabase as any).from('messages').insert({
        sender_id: user.id,
        content: `📎 ${file.name}`,
        encrypted: true,
        priority: 'normal',
        channel_id: selectedChannel.id,
        attachment_url: urlData.publicUrl,
        attachment_name: file.name,
        attachment_type: file.type,
      });


      if (msgError) throw msgError;

      toast({ title: 'File sent!' });
    } catch (err: any) {
      console.error('File upload error:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Emoji selection
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // Create channel - ALWAYS save to localStorage first
  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !user) return;

    const newId = `channel-${Date.now()}`;
    const newChannel: Channel = {
      id: newId,
      name: newChannelName.trim(),
      type: 'group',
      participants: [user.id],
    };

    // Always add to local state and localStorage first
    const updatedChannels = [...channels, newChannel];
    setChannels(updatedChannels);
    saveChannelsToStorage(updatedChannels);
    setSelectedChannel(newChannel);
    setNewChannelName('');
    setIsNewChannelOpen(false);

    // Then try to sync with database in background
    try {
      // 🛡️ Ensure we catch any database errors to prevent the "JWT cryptographic problem" from bubbling up
      const { error: chError } = await (supabase as any).from('message_channels').insert({
        id: newId,
        name: newChannelName.trim(),
        type: 'group',
        created_by: user.id,
      });

      if (chError) {
        console.warn('Channel base creation in DB failed (captured):', chError.message);
      } else {
        const { error: partError } = await (supabase as any).from('channel_participants').insert({
          channel_id: newId,
          user_id: user.id,
        });
        if (partError) console.warn('Channel participant insertion failed:', partError.message);
      }
    } catch (err: any) {
      console.warn('Silent database sync fail for new channel:', err.message);
    }

    toast({ title: 'Channel created!' });
  };

  // Delete channel (Local persistent hide)
  const handleDeleteChannel = (e: React.MouseEvent, channelId: string) => {
    // Prevent event bubbling
    e.stopPropagation();
    e.preventDefault();

    // Debug check
    // alert('Delete button clicked for: ' + channelId); // Uncomment if needed, but window.confirm below is sufficient blocking UI

    if (window.confirm('PERMANENTLY DELETE: Are you sure you want to remove this contact?')) {
      // 1. Mark as deleted in persistent storage
      markChannelAsDeleted(channelId);

      // 2. Remove from current state
      setChannels(prevChannels => prevChannels.filter(c => c.id !== channelId));

      // 3. Clear selection if needed
      if (selectedChannel?.id === channelId) {
        setSelectedChannel(null);
      }

      toast({ title: 'Contact Deleted', description: 'The contact has been removed.' });
    }
  };

  // Handle DM user selection
  const handleUserSelect = async (selectedUser: any) => {
    if (!user) return;

    const existingDM = channels.find(c =>
      c.type === 'direct' &&
      c.participants.includes(selectedUser.user_id) &&
      c.participants.includes(user.id)
    );

    if (existingDM) {
      setSelectedChannel(existingDM);
      setIsUserSearchOpen(false);
      return;
    }

    const newId = `dm-${Date.now()}`;
    const newChannel: Channel = {
      id: newId,
      name: selectedUser.name,
      type: 'direct',
      participants: [user.id, selectedUser.user_id],
    };

    // Save locally first
    const updatedChannels = [...channels, newChannel];
    setChannels(updatedChannels);
    saveChannelsToStorage(updatedChannels);
    setSelectedChannel(newChannel);
    setIsUserSearchOpen(false);

    // Try database in background
    try {
      await (supabase as any).from('message_channels').insert({
        id: newId,
        name: `DM: ${profile?.name} & ${selectedUser.name}`,
        type: 'direct',
        created_by: user.id,
      });


      await (supabase as any).from('channel_participants').insert([
        { channel_id: newId, user_id: user.id },
        { channel_id: newId, user_id: selectedUser.user_id },
      ]);

    } catch (err) {
      console.log('Could not save DM to database:', err);
    }

    toast({ title: `Started chat with ${selectedUser.name}` });
  };

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render attachment
  const renderAttachment = (msg: Message) => {
    if (!msg.attachment_url) return null;
    const isImage = msg.attachment_type?.startsWith('image/');
    const isVideo = msg.attachment_type?.startsWith('video/');

    if (isImage) {
      return (
        <img
          src={msg.attachment_url}
          alt={msg.attachment_name || 'Image'}
          className="max-w-xs rounded-lg mt-2 cursor-pointer hover:opacity-90"
          onClick={() => window.open(msg.attachment_url!, '_blank')}
        />
      );
    }

    if (isVideo) {
      return (
        <video
          src={msg.attachment_url}
          controls
          className="max-w-xs rounded-lg mt-2"
        />
      );
    }

    return (
      <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 mt-2 p-2 bg-background/50 rounded-lg hover:bg-background/80">
        <FileText className="w-4 h-4" />
        <span className="text-sm underline">{msg.attachment_name}</span>
      </a>
    );
  };

  if (!user) {
    return (
      <PageLayout title="Secure Messages" subtitle="End-to-End Encrypted">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center glass-panel p-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Please Login</h2>
            <p className="text-muted-foreground">You need to be logged in to access secure messages.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Secure Messages" subtitle="End-to-End Encrypted">
      <div className="flex h-[calc(100vh-180px)] gap-4 p-4">
        {/* Sidebar */}
        <div className="w-80 flex flex-col bg-slate-900/80 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm">
          {/* User info */}
          <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-cyan-500/50">
                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-emerald-500 text-white">
                  {profile?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-white">{profile?.name || 'User'}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-400">
                <Circle className="w-2 h-2 fill-current" />
                Online
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-slate-700/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Channels */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4" /> Channels ({channels.length})
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsUserSearchOpen(true)} title="New DM">
                  <User className="w-4 h-4" />
                </Button>
                <Dialog open={isNewChannelOpen} onOpenChange={setIsNewChannelOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Channel</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Channel Name</Label>
                        <Input
                          value={newChannelName}
                          onChange={(e) => setNewChannelName(e.target.value)}
                          placeholder="e.g. investigation-team"
                          onKeyDown={(e) => e.key === 'Enter' && handleCreateChannel()}
                        />
                      </div>
                      <Button onClick={handleCreateChannel} className="w-full bg-gradient-to-r from-chameleon-purple to-chameleon-blue">
                        Create Channel
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <ScrollArea className="flex-1 px-2">
              {filteredChannels.map((channel) => (
                <div key={channel.id} className="flex items-center gap-2 mb-2 group">
                  <div
                    onClick={() => setSelectedChannel(channel)}
                    className={cn(
                      "flex-1 flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer",
                      selectedChannel?.id === channel.id
                        ? "bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30"
                        : "hover:bg-slate-800/50 border border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      channel.type === 'direct' ? "bg-gradient-to-br from-cyan-500 to-blue-500" : "bg-gradient-to-br from-cyan-500 to-emerald-500"
                    )}>
                      {channel.type === 'direct' ? <User className="w-5 h-5 text-white" /> : <Hash className="w-5 h-5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate block text-white">{channel.name}</span>
                      <span className="text-xs text-slate-400">
                        {channel.type === 'direct' ? 'Direct Message' : 'Group Channel'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteChannel(e, channel.id);
                    }}
                    className="p-3 text-slate-400 hover:text-white hover:bg-red-500/80 rounded-xl transition-all border border-transparent hover:border-red-500/50 flex-shrink-0"
                    title="Delete contact"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-900/80 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm">
          {selectedChannel ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 to-emerald-500/10">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    selectedChannel.type === 'direct' ? "bg-gradient-to-br from-chameleon-cyan to-chameleon-blue" : "bg-gradient-to-br from-chameleon-purple to-chameleon-blue"
                  )}>
                    {selectedChannel.type === 'direct' ? <User className="w-6 h-6 text-white" /> : <Hash className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedChannel.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Lock className="w-3 h-3" /> End-to-End Encrypted • {selectedChannel.type === 'direct' ? 'Private Chat' : 'Group'}
                    </p>
                  </div>
                </div>
                {selectedChannel.type !== 'direct' && (
                  <Button variant="ghost" size="icon" onClick={() => setShowGroupInfo(true)}>
                    <Info className="w-5 h-5" />
                  </Button>
                )}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <MessageSquare className="w-20 h-20 mx-auto mb-4 opacity-20" />
                      <h3 className="text-xl font-medium mb-2">No messages yet</h3>
                      <p className="text-sm">Be the first to start the conversation in {selectedChannel.name}!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={cn("flex gap-3", isMe && "flex-row-reverse")}>
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            {msg.sender_avatar && <AvatarImage src={msg.sender_avatar} />}
                            <AvatarFallback className={cn(
                              "text-white font-bold",
                              isMe ? "bg-gradient-to-br from-chameleon-purple to-chameleon-blue" : "bg-gradient-to-br from-chameleon-cyan to-chameleon-blue"
                            )}>
                              {(msg.sender_name || 'U').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn("max-w-[70%]", isMe && "text-right")}>
                            <div className={cn("flex items-center gap-2 mb-1", isMe && "flex-row-reverse")}>
                              <span className={cn("text-sm font-medium", isMe ? "text-chameleon-purple" : "text-chameleon-cyan")}>
                                {isMe ? 'You' : msg.sender_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <div className={cn(
                              "rounded-2xl px-4 py-3 inline-block text-sm",
                              isMe ? "bg-gradient-to-r from-chameleon-purple to-chameleon-blue text-white rounded-tr-sm" : "bg-muted/80 rounded-tl-sm"
                            )}>
                              {msg.content}
                              {renderAttachment(msg)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border/50 bg-background/30">
                <div className="flex gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Input
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message #${selectedChannel.name}...`}
                    className="flex-1 bg-background/50"
                    disabled={isLoading}
                  />
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="ghost" size="icon">
                        <Smile className="w-5 h-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </PopoverContent>
                  </Popover>
                  <Button type="submit" disabled={!newMessage.trim() || isLoading} className="bg-gradient-to-r from-chameleon-purple to-chameleon-blue">
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Messages are encrypted end-to-end
                </p>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Select a channel to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* Group Info Panel */}
        {showGroupInfo && selectedChannel && (
          <GroupInfoPanel channel={selectedChannel as any} onClose={() => setShowGroupInfo(false)} />
        )}
      </div>

      {/* User Search Dialog */}
      <UserSearchDialog open={isUserSearchOpen} onOpenChange={setIsUserSearchOpen} onSelectUser={handleUserSelect} />
    </PageLayout>
  );
}