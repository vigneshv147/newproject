import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { securityCore } from '@/lib/security/crypto';
import { deviceTrust } from '@/lib/security/device';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SecurityContextType {
    trustScore: number;
    isKeysInitialized: boolean;
    isDeviceBound: boolean;
    isOffline: boolean;
    initializeSecurity: (password: string) => Promise<boolean>;
    lockSession: () => void;
    performRiskCheck: (actionName: string) => boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: ReactNode }) {
    const { user, logout } = useAuth();
    const { toast } = useToast();

    const [trustScore, setTrustScore] = useState(100);
    const [isKeysInitialized, setIsKeysInitialized] = useState(false);
    const [isDeviceBound, setIsDeviceBound] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    // Monitor Offline Status
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    /**
     * 🚨 CONTINUOUS MONITORING
     * Checks trust score every 30 seconds
     */
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(async () => {
            // 1. Check Device Fingerprint Drift
            const storedSig = localStorage.getItem(`device_sig_${user.id}`);
            const isSafe = await deviceTrust.verifyTrust(storedSig);
            const outputScore = deviceTrust.getTrustScore();

            setTrustScore(outputScore);

            if (!isSafe || outputScore < 60) {
                console.error('🚨 CRITICAL: Device Trust Lost. Terminating Session.');
                toast({
                    title: 'Security Alert',
                    description: 'Device integrity check failed. Session terminated.',
                    variant: 'destructive',
                });
                await lockSession();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [user]);

    /**
     * 1️⃣ INIT: Initialize Security Core
     * Must be called after Login with user's password to derive keys
     */
    const initializeSecurity = useCallback(async (password: string): Promise<boolean> => {
        if (!user) return false;

        try {
            // Initialize Keys
            await securityCore.initialize(password, user.id);
            setIsKeysInitialized(true);

            // Bind Device (If new)
            const storedSig = localStorage.getItem(`device_sig_${user.id}`);
            if (!storedSig) {
                const sig = await deviceTrust.getCurrentSignature(); // ensure snapshot taken
                if (sig) {
                    localStorage.setItem(`device_sig_${user.id}`, sig); // Bind!
                }
            }
            setIsDeviceBound(true);

            return true;
        } catch (e) {
            console.error('Security Init Failed', e);
            return false;
        }
    }, [user]);

    /**
     * 2️⃣ LOCK: Emergency Wipe
     */
    const lockSession = useCallback(async () => {
        securityCore.destoryAllKeys();
        setIsKeysInitialized(false);
        await logout(); // Supabase logout
        window.location.reload(); // Hard reload to clear volatile memory
    }, [logout]);


    /**
     * 3️⃣ GATE: Zero-Trust Action Check
     */
    const performRiskCheck = useCallback((actionName: string): boolean => {
        // Re-eval trust score before sensitive actions
        if (trustScore < 70) {
            toast({
                title: 'Action Blocked',
                description: `Risk score too high (${trustScore}) for ${actionName}`,
                variant: 'destructive'
            });
            return false;
        }
        return true;
    }, [trustScore, toast]);

    return (
        <SecurityContext.Provider
            value={{
                trustScore,
                isKeysInitialized,
                isDeviceBound,
                isOffline,
                initializeSecurity,
                lockSession,
                performRiskCheck
            }}
        >
            {children}
        </SecurityContext.Provider>
    );
}

export function useSecurity() {
    const context = useContext(SecurityContext);
    if (context === undefined) {
        throw new Error('useSecurity must be used within a SecurityProvider');
    }
    return context;
}
