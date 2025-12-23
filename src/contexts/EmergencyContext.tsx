import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { auditLogger } from '@/lib/security/audit';
import { permissionEngine, Permission } from '@/lib/security/permissions';
import { useToast } from '@/hooks/use-toast';

interface EmergencyContextType {
    isEmergencyActive: boolean;
    activeOverrides: string[];
    activateEmergency: (reason: string) => Promise<boolean>;
    deactivateEmergency: () => Promise<void>;
    requestBreakGlass: (action: Permission, justification: string) => Promise<boolean>;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export function EmergencyProvider({ children }: { children: ReactNode }) {
    const { user, profile } = useAuth();
    const { toast } = useToast();

    const [isEmergencyActive, setIsEmergencyActive] = useState(false);
    const [activeOverrides, setActiveOverrides] = useState<string[]>([]);

    // In real app, sync emergency state with Supabase Realtime
    // For now, local state simulation

    const activateEmergency = useCallback(async (reason: string) => {
        if (!user || !profile) return false;

        // Check permission
        const canActivate = await permissionEngine.can(
            { role: profile.role, id: user.id },
            'activate_emergency',
            { trustScore: 100, isEmergency: isEmergencyActive } // Context
        );

        if (!canActivate) {
            toast({ title: 'Access Denied', description: 'You lack authority to declare emergency.', variant: 'destructive' });
            return false;
        }

        setIsEmergencyActive(true);
        await auditLogger.log('EMERGENCY_DECLARED', { reason }, user.id);

        toast({
            title: '🚨 EMERGENCY DECLARED',
            description: 'Global Priority Override Active. All actions logged.'
        });

        return true;
    }, [user, profile, isEmergencyActive, toast]);

    const deactivateEmergency = useCallback(async () => {
        if (!user) return;
        setIsEmergencyActive(false);
        await auditLogger.log('EMERGENCY_CLEARED', {}, user.id);
        toast({ title: 'Standard Operation Restored', description: 'Emergency mode deactivated.' });
    }, [user, toast]);

    const requestBreakGlass = useCallback(async (action: Permission, justification: string) => {
        if (!user || !profile) return false;

        // Force audit log even if approved
        const success = await permissionEngine.breakGlass(
            { role: profile.role, id: user.id },
            action,
            justification
        );

        if (success) {
            setActiveOverrides(prev => [...prev, action]);
            toast({
                title: '🔨 Break-Glass Active',
                description: `Override allowed for: ${action}. This ID has been flagged.`
            });

            // Auto-clear override after 5 mins?
            setTimeout(() => {
                setActiveOverrides(prev => prev.filter(a => a !== action));
            }, 5 * 60 * 1000);
        }

        return success;
    }, [user, profile, toast]);

    return (
        <EmergencyContext.Provider
            value={{
                isEmergencyActive,
                activeOverrides,
                activateEmergency,
                deactivateEmergency,
                requestBreakGlass
            }}
        >
            {children}
        </EmergencyContext.Provider>
    );
}

export function useEmergency() {
    const context = useContext(EmergencyContext);
    if (context === undefined) {
        throw new Error('useEmergency must be used within an EmergencyProvider');
    }
    return context;
}
