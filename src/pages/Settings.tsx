import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  User,
  Mail,
  Shield,
  Moon,
  Sun,
  Bell,
  Lock,
  Save,
  Camera,
  Globe,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AUTO_LOCK_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

export default function Settings() {
  const { user, profile, refreshProfile, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize from localStorage or default to light
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });
  const [notifications, setNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoLock, setAutoLock] = useState(() => {
    const saved = localStorage.getItem('autoLock');
    return saved !== 'false'; // default to true
  });
  const [name, setName] = useState(profile?.name || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [badgeNumber, setBadgeNumber] = useState(profile?.badge_number || '');
  const [isSaving, setIsSaving] = useState(false);

  // Change Password state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Avatar upload
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setDepartment(profile.department || '');
      setBadgeNumber(profile.badge_number || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  useEffect(() => {
    // Apply and persist theme
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Auto-lock functionality
  useEffect(() => {
    localStorage.setItem('autoLock', String(autoLock));
  }, [autoLock]);

  // Auto-lock timer
  useEffect(() => {
    if (!autoLock || !user) return;

    let lastActivity = Date.now();

    const resetTimer = () => {
      lastActivity = Date.now();
    };

    const checkInactivity = () => {
      if (Date.now() - lastActivity >= AUTO_LOCK_TIME) {
        // Log out user due to inactivity
        toast({
          title: 'Session Expired',
          description: 'You have been logged out due to inactivity.',
          variant: 'destructive',
        });
        logout();
        navigate('/auth');
      }
    };

    // Add event listeners for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Check every 30 seconds
    const timeoutId = setInterval(checkInactivity, 30000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      clearInterval(timeoutId);
    };
  }, [autoLock, user, logout, navigate, toast]);

  const handleSaveProfile = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    console.log('Saving profile for user:', user.id, { name, department, badgeNumber });

    try {
      // Use upsert to create profile if it doesn't exist, or update if it does
      const { data, error } = await (supabase as any)
        .from('profiles')
        .upsert({
          user_id: user.id,
          name,
          department,
          badge_number: badgeNumber,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select();

      console.log('Upsert result:', { data, error });

      if (error) {
        console.error('Profile save error:', error);
        toast({
          title: 'Error saving profile',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        console.log('Profile saved successfully:', data);
        // Refresh the profile in AuthContext so UI updates everywhere
        await refreshProfile();
        toast({
          title: 'Profile Updated',
          description: 'Your changes have been saved successfully',
        });
      }
    } catch (err) {
      console.error('Profile save exception:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Avatar image must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Upload to Supabase storage (using avatars bucket)
      const fileName = `${user.id}/${Date.now()}-avatar.${file.name.split('.').pop()}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        // Try message-attachments bucket as fallback
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('message-attachments')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (fallbackError) {
          throw fallbackError;
        }

        const { data: urlData } = supabase.storage
          .from('message-attachments')
          .getPublicUrl(fileName);

        // Update profile with new avatar URL
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from('profiles')
          .update({ avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() } as any)
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        setAvatarUrl(urlData.publicUrl);
        await refreshProfile();

        toast({
          title: 'Avatar Updated',
          description: 'Your profile photo has been changed',
        });
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() } as any)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(urlData.publicUrl);
      await refreshProfile();

      toast({
        title: 'Avatar Updated',
        description: 'Your profile photo has been changed',
      });
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast({
        title: 'Upload Failed',
        description: err instanceof Error ? err.message : 'Failed to upload avatar',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all password fields',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to change password',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Password Changed',
          description: 'Your password has been updated successfully',
        });
        setIsPasswordDialogOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <PageLayout title="Settings" subtitle="Manage your account">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Profile Section */}
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-6 space-y-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <User className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
              <p className="text-sm text-slate-400">Manage your personal information</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
              <Avatar className="w-24 h-24 border-4 border-cyan-500/30">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-emerald-500 text-3xl font-bold text-white">
                  {name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                {isUploadingAvatar ? 'Uploading...' : 'Change Photo'}
              </Button>
            </div>

            {/* Profile Form */}
            <div className="flex-1 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Enter department"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={profile?.role || 'Officer'}
                    disabled
                    className="bg-muted capitalize"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="badge">Badge Number</Label>
                  <Input
                    id="badge"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    placeholder="Enter badge number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joined">Member Since</Label>
                  <Input
                    id="joined"
                    value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-6 space-y-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              {isDark ? <Moon className="w-6 h-6 text-blue-400" /> : <Sun className="w-6 h-6 text-amber-400" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Appearance</h2>
              <p className="text-sm text-slate-400">Customize your display preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-medium text-white">Dark Mode</p>
                  <p className="text-sm text-slate-400">Use dark theme for the interface</p>
                </div>
              </div>
              <Switch
                checked={isDark}
                onCheckedChange={setIsDark}
              />
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-6 space-y-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Bell className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Notifications</h2>
              <p className="text-sm text-slate-400">Manage alert preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive alerts for new messages</p>
                </div>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Sound Alerts</p>
                  <p className="text-sm text-muted-foreground">Play sounds for critical alerts</p>
                </div>
              </div>
              <Switch
                checked={soundAlerts}
                onCheckedChange={setSoundAlerts}
              />
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-status-online/20">
              <Shield className="w-6 h-6 text-status-online" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Security</h2>
              <p className="text-sm text-muted-foreground">Manage your security settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Auto-Lock</p>
                  <p className="text-sm text-muted-foreground">Lock session after 5 minutes of inactivity</p>
                </div>
              </div>
              <Switch
                checked={autoLock}
                onCheckedChange={setAutoLock}
              />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsPasswordDialogOpen(true)}
            >
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </div>
        </div>

        {/* App Info */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="font-semibold">Application Information</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono">1.0.0</span>
            </div>
            <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Build</span>
              <span className="font-mono">2025.01.12</span>
            </div>
            <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Encryption</span>
              <span className="font-mono">AES-256 / Signal</span>
            </div>
            <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Protocol</span>
              <span className="font-mono">E2EE Enabled</span>
            </div>
          </div>
          <div className="pt-2">
            <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-cyan-400" onClick={() => navigate('/security-test')}>
              Run System Diagnostics
            </Button>
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-chameleon-purple" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Enter your new password below. Password must be at least 6 characters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="w-full bg-gradient-to-r from-chameleon-purple to-chameleon-blue"
            >
              {isChangingPassword ? 'Changing Password...' : 'Update Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
