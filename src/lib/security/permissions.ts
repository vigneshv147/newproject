import { User } from '@supabase/supabase-js';
import { auditLogger } from './audit';
import { deviceTrust } from './device';

/**
 * 👮 POLICE operational ROLES
 */
export type PoliceRole = 'constable' | 'inspector' | 'dsp' | 'admin' | 'control_room';

export type Permission =
    | 'broadcast_message'
    | 'view_sensitive_intel'
    | 'access_location_history'
    | 'activate_emergency'
    | 'override_lockdown'
    | 'delete_evidence' // Only Admin
    | 'delete_evidence' // Only Admin
    | 'remote_wipe'
    | 'view_audit_logs';

interface PermissionContext {
    trustScore: number;
    isEmergency: boolean;
    locationLocked?: boolean;
}

/**
 * 🛡️ PERMISSION ENGINE
 * Enforces:
 * 1. Role-Based Limits (Hard Gates)
 * 2. Contextual Limits (Trust Score, Location)
 * 3. Break-Glass / Emergency Overrides
 */
export class PermissionEngine {
    private static instance: PermissionEngine;

    // Role Definitions
    private rolePermissions: Record<PoliceRole, Permission[]> = {
        'constable': ['broadcast_message'], // Basic access
        'inspector': ['broadcast_message', 'view_sensitive_intel', 'access_location_history', 'activate_emergency'],
        'dsp': ['broadcast_message', 'view_sensitive_intel', 'access_location_history', 'activate_emergency', 'override_lockdown', 'view_audit_logs'],
        'control_room': ['broadcast_message', 'view_sensitive_intel', 'access_location_history', 'activate_emergency', 'override_lockdown', 'remote_wipe'],
        'admin': ['broadcast_message', 'view_sensitive_intel', 'access_location_history', 'activate_emergency', 'override_lockdown', 'remote_wipe', 'delete_evidence', 'view_audit_logs']
    };

    // 🎖️ AUTHORITY HIERARCHY
    private roleRanks: Record<PoliceRole, number> = {
        'admin': 100,       // System Root
        'dsp': 90,         // Field Commander
        'inspector': 70,   // Unit Leader
        'control_room': 60,// Dispatcher (Higher than Constable, lower than Inspector usually, but has special permissions)
        'constable': 10    // Field Agent
    };


    private constructor() { }

    static getInstance(): PermissionEngine {
        if (!PermissionEngine.instance) {
            PermissionEngine.instance = new PermissionEngine();
        }
        return PermissionEngine.instance;
    }

    /**
     * 1️⃣ CHECK PERMISSION (The Gatekeeper)
     */
    async can(
        user: { role: string; id: string } | null,
        action: Permission,
        context: PermissionContext
    ): Promise<boolean> {
        if (!user) return false;

        // 1. Validate Role Existence
        const role = user.role as PoliceRole;
        if (!this.rolePermissions[role]) {
            console.warn(`Denied: Unknown role ${user.role}`);
            return false;
        }

        // 2. Check Role Definition
        const allowedActions = this.rolePermissions[role];
        const isRoleAllowed = allowedActions.includes(action);

        // 3. Contextual Overrides
        // Emergency Mode expands permissions for Inspectors and above
        if (context.isEmergency && !isRoleAllowed) {
            if (['inspector', 'dsp', 'control_room'].includes(role)) {
                // Allow specific emergency actions even if not normally allowed? 
                // (Currently using strict allow-list, but could add dynamic expansion here)
            }
        }

        if (!isRoleAllowed) {
            // Log Denial
            await auditLogger.log('PERMISSION_DENIED', { role, action, reason: 'role_mismatch' }, user.id);
            return false;
        }

        // 4. Trust Score Gate (Zero Trust)
        if (context.trustScore < 60) {
            console.warn(`Denied: Trust Score ${context.trustScore} too low for ${action}`);
            await auditLogger.log('PERMISSION_DENIED', { role, action, reason: 'low_trust', score: context.trustScore }, user.id);
            return false;
        }

        // 5. Critical Action Logging
        if (['activate_emergency', 'remote_wipe', 'delete_evidence'].includes(action)) {
            await auditLogger.log('CRITICAL_ACTION_ATTEMPT', { role, action }, user.id);
        }

        return true;
    }

    /**
     * 2️⃣ BREAK-GLASS (Emergency Escalation)
     */
    /**
     * 2️⃣ BREAK-GLASS (Emergency Escalation)
     */
    async breakGlass(
        user: { role: string; id: string },
        action: Permission,
        justification: string
    ): Promise<boolean> {
        // Log the Break Glass Event first (Non-repudiation)
        await auditLogger.log('BREAK_GLASS_INIT', {
            requested_action: action,
            justification
        }, user.id);

        console.log(`🔨 BREAK GLASS: ${user.role} forcing ${action}`);

        // In a real system, this might trigger an alert to the SP/Admin immediately
        // For now, we allow it but mark it heavily

        return true;
    }

    /**
     * 3️⃣ HIERARCHY CHECKS
     */
    getRank(role: string): number {
        return this.roleRanks[role as PoliceRole] || 0;
    }

    canOverride(actorRole: string, targetRole: string): boolean {
        const actorRank = this.getRank(actorRole);
        const targetRank = this.getRank(targetRole);
        return actorRank > targetRank;
    }
}

export const permissionEngine = PermissionEngine.getInstance();
