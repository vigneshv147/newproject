import React, { useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, getRoleBadgeColor, getRoleDisplayName } from '@/hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { decryptEnvelope, EncryptedEnvelope } from '@/lib/crypto/envelope';
import {
  User,
  Mail,
  Shield,
  Building,
  BadgeCheck,
  LogOut,
  Calendar,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Profile() {
  const { profile, user, logout, refreshProfile } = useAuth();
  const permissions = usePermissions();
  const navigate = useNavigate();
  const [decryptedBadge, setDecryptedBadge] = React.useState<string>('Loading...');

  // Helper to decrypt a field safely
  async function decryptField(content: string | undefined): Promise<string> {
    if (!content) return 'N/A';
    if (content.trim().startsWith('{') && content.includes('"ciphertext"')) {
      try {
        const envelope = JSON.parse(content) as EncryptedEnvelope;
        return await decryptEnvelope(envelope);
      } catch (err) {
        console.error('Decryption failed:', err);
        return '🔓 [Decryption Error]';
      }
    }
    return content;
  }

  // Refresh profile data when page loads
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Decrypt badge number when profile changes
  useEffect(() => {
    const decrypt = async () => {
      if (profile) {
        const result = await decryptField(profile.badge_number);
        setDecryptedBadge(result);
      }
    };
    decrypt();
  }, [profile]);


  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <PageLayout title="Profile" subtitle="Account Details">
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="glass-panel p-8 text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-chameleon-purple to-chameleon-blue flex items-center justify-center mb-4">
            <span className="text-3xl font-bold text-primary-foreground">
              {profile?.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-2">{profile?.name || 'User'}</h1>
          {permissions.role && (
            <span className={cn(
              "inline-flex px-3 py-1 rounded-full text-sm font-medium",
              getRoleBadgeColor(permissions.role)
            )}>
              {getRoleDisplayName(permissions.role)}
            </span>
          )}
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="status-indicator status-online" />
            <span className="text-sm text-status-online">Online</span>
          </div>
        </div>

        {/* Profile Details */}
        <div className="glass-panel divide-y divide-border">
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-chameleon-purple/20 flex items-center justify-center">
              <User className="w-5 h-5 text-chameleon-purple" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="font-medium">{profile?.name || 'Not set'}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-chameleon-blue/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-chameleon-blue" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Email Address</p>
              <p className="font-medium">{profile?.email || user?.email || 'Not set'}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-chameleon-cyan/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-chameleon-cyan" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="font-medium">{permissions.role ? getRoleDisplayName(permissions.role) : 'Officer'}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-status-warning/20 flex items-center justify-center">
              <Building className="w-5 h-5 text-status-warning" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Department</p>
              <p className="font-medium">{profile?.department || 'Cyber Crime Wing'}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-status-online/20 flex items-center justify-center">
              <BadgeCheck className="w-5 h-5 text-status-online" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Badge Number</p>
              <p className="font-medium font-mono">{decryptedBadge}</p>
            </div>

          </div>

          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Account Created</p>
              <p className="font-medium">
                {profile?.created_at
                  ? format(new Date(profile.created_at), 'PPP')
                  : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </PageLayout>
  );
}
