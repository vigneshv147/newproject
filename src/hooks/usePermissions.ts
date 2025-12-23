import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'dispatcher' | 'officer' | 'support';

export interface RolePermissions {
  // Navigation access
  canAccessSettings: boolean;
  canAccessAuditLogs: boolean;
  canAccessUserManagement: boolean;

  // Messages
  canViewAllMessages: boolean;
  canSendMessages: boolean;
  canManageChannels: boolean;
  canBroadcastAlerts: boolean;

  // Tor Tracking
  canViewTorData: boolean;
  canManageTorData: boolean;

  // Security
  canAccessSecurityCenter: boolean;
  canAccessSafeModes: boolean;

  // Profiles
  canViewAllProfiles: boolean;
  canManageUsers: boolean;

  // Dashboard
  hasFullDashboard: boolean;
}

export const rolePermissions: Record<AppRole, RolePermissions> = {
  admin: {
    canAccessSettings: true,
    canAccessAuditLogs: true,
    canAccessUserManagement: true,
    canViewAllMessages: true,
    canSendMessages: true,
    canManageChannels: true,
    canBroadcastAlerts: true,
    canViewTorData: true,
    canManageTorData: true,
    canAccessSecurityCenter: true,
    canAccessSafeModes: true,
    canViewAllProfiles: true,
    canManageUsers: true,
    hasFullDashboard: true,
  },
  dispatcher: {
    canAccessSettings: false,
    canAccessAuditLogs: false,
    canAccessUserManagement: false,
    canViewAllMessages: true,
    canSendMessages: true,
    canManageChannels: true,
    canBroadcastAlerts: true,
    canViewTorData: true,
    canManageTorData: false,
    canAccessSecurityCenter: true,
    canAccessSafeModes: true,
    canViewAllProfiles: true,
    canManageUsers: false,
    hasFullDashboard: true,
  },
  officer: {
    canAccessSettings: true,
    canAccessAuditLogs: false,
    canAccessUserManagement: false,
    canViewAllMessages: false,
    canSendMessages: true,
    canManageChannels: false,
    canBroadcastAlerts: false,
    canViewTorData: true,
    canManageTorData: false,
    canAccessSecurityCenter: true,
    canAccessSafeModes: true,
    canViewAllProfiles: false,
    canManageUsers: false,
    hasFullDashboard: false,
  },
  support: {
    canAccessSettings: false,
    canAccessAuditLogs: false,
    canAccessUserManagement: false,
    canViewAllMessages: true,
    canSendMessages: false,
    canManageChannels: false,
    canBroadcastAlerts: false,
    canViewTorData: false,
    canManageTorData: false,
    canAccessSecurityCenter: false,
    canAccessSafeModes: false,
    canViewAllProfiles: true,
    canManageUsers: false,
    hasFullDashboard: false,
  },
};

export function usePermissions(): RolePermissions & { role: AppRole | null; isLoading: boolean } {
  const { profile, user, isLoading: authLoading } = useAuth();
  const [roleFromDb, setRoleFromDb] = useState<AppRole | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchRole() {
      if (!user?.id) {
        if (isMounted) {
          setRoleFromDb(null);
          setIsRoleLoading(false);
        }
        return;
      }

      try {
        // Fetch role from user_roles table
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (isMounted) {
          if (userRole?.role) {
            setRoleFromDb(userRole.role as AppRole);
          } else if (profile?.role) {
            // Fall back to profile role if user_roles is empty
            setRoleFromDb(profile.role as AppRole);
          } else {
            // Default to officer if no role found
            setRoleFromDb('officer');
          }
          setIsRoleLoading(false);
        }
      } catch (err) {
        console.error('Error fetching role:', err);
        if (isMounted) {
          // Default to officer on error
          setRoleFromDb('officer');
          setIsRoleLoading(false);
        }
      }
    }

    // Only fetch if auth is loaded
    if (!authLoading) {
      fetchRole();
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id, profile?.role, authLoading]);

  // Use roleFromDb first, then profile role, then default to null
  const role = roleFromDb || (profile?.role as AppRole) || null;

  const defaultPermissions: RolePermissions = {
    canAccessSettings: false,
    canAccessAuditLogs: false,
    canAccessUserManagement: false,
    canViewAllMessages: false,
    canSendMessages: false,
    canManageChannels: false,
    canBroadcastAlerts: false,
    canViewTorData: false,
    canManageTorData: false,
    canAccessSecurityCenter: false,
    canAccessSafeModes: false,
    canViewAllProfiles: false,
    canManageUsers: false,
    hasFullDashboard: false,
  };

  const permissions = role ? rolePermissions[role] : defaultPermissions;

  return {
    ...permissions,
    role,
    isLoading: authLoading || isRoleLoading,
  };
}

export function getRoleBadgeColor(role: AppRole): string {
  switch (role) {
    case 'admin':
      return 'bg-destructive/20 text-destructive';
    case 'dispatcher':
      return 'bg-chameleon-purple/20 text-chameleon-purple';
    case 'officer':
      return 'bg-chameleon-blue/20 text-chameleon-blue';
    case 'support':
      return 'bg-status-warning/20 text-status-warning';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function getRoleDisplayName(role: AppRole): string {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'dispatcher':
      return 'Dispatcher';
    case 'officer':
      return 'Officer';
    case 'support':
      return 'Support Staff';
    default:
      return 'Unknown';
  }
}
