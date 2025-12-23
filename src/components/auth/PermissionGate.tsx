import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmergency } from '@/contexts/EmergencyContext';
import { permissionEngine, Permission } from '@/lib/security/permissions';
import { useSecurity } from '@/contexts/SecurityContext';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PermissionGateProps {
    children: React.ReactNode;
    action: Permission;
    fallback?: React.ReactNode;
    requireBreakGlass?: boolean;
}

export function PermissionGate({ children, action, fallback, requireBreakGlass }: PermissionGateProps) {
    const { user, profile } = useAuth();
    const { isEmergencyActive, activeOverrides, requestBreakGlass } = useEmergency();
    const { trustScore } = useSecurity();
    const { toast } = useToast();
    const [isAuthorized, setIsAuthorized] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    // Re-check permissions on context change
    React.useEffect(() => {
        const check = async () => {
            if (!user || !profile) {
                setIsAuthorized(false);
                setIsLoading(false);
                return;
            }

            // Check if explicitly overridden (Break Glass)
            if (activeOverrides.includes(action)) {
                setIsAuthorized(true);
                setIsLoading(false);
                return;
            }

            const canPerform = await permissionEngine.can(
                { role: profile.role, id: user.id },
                action,
                { trustScore, isEmergency: isEmergencyActive }
            );

            setIsAuthorized(canPerform);
            setIsLoading(false);
        };
        check();
    }, [user, profile, action, isEmergencyActive, trustScore, activeOverrides]);

    const handleBreakGlass = async () => {
        const justification = prompt("⚠️ BREAK GLASS PROTOCOL\n\nPlease provide justification for this emergency override. This action will be irrevocably logged.");

        if (justification) {
            const success = await requestBreakGlass(action, justification);
            if (!success) {
                toast({ title: 'Override Denied', description: 'System rejected the break-glass request.', variant: 'destructive' });
            }
        }
    };

    if (isLoading) return null; // Or skeleton

    if (isAuthorized) {
        return <>{children}</>;
    }

    if (requireBreakGlass) {
        return (
            <div className="p-4 border border-red-500/30 bg-red-500/5 rounded-lg flex flex-col items-center gap-3 text-center">
                <Lock className="w-6 h-6 text-red-500 mb-1" />
                <div>
                    <h4 className="text-sm font-bold text-red-400">Restricted Access</h4>
                    <p className="text-xs text-red-300/70">Authorization required for {action}</p>
                </div>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBreakGlass}
                    className="w-full bg-red-900/50 hover:bg-red-800 border border-red-500/50"
                >
                    🔨 Emergency Override
                </Button>
            </div>
        );
    }

    return <>{fallback}</>;
}
