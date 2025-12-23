import { supabase } from '@/integrations/supabase/client';

export type RateLimitAction = 'login' | 'signup' | 'search' | 'message_send';

/**
 * Utility to check if an action should be rate limited via the database.
 * @param identifier A unique string for the user (e.g., email or 'global_ip')
 * @param action The specific action being performed
 * @param maxRequests Maximum requests allowed in the window
 * @param windowInterval PostgreSQL interval string (e.g., '15 minutes', '1 hour')
 * @returns boolean True if the action is ALLOWED, False if rate limited.
 */
export async function checkRateLimit(
    identifier: string,
    action: RateLimitAction,
    maxRequests: number = 5,
    windowInterval: string = '15 minutes'
): Promise<boolean> {
    try {
        const { data, error } = await (supabase as any).rpc('check_rate_limit', {
            p_identifier: identifier,
            p_action: action,
            p_max_requests: maxRequests,
            p_window_interval: windowInterval
        });

        if (error) {
            console.error('Rate limit RPC error:', error);
            // Fail open in case of RPC error to avoid locking out users, 
            // but you might want to fail closed for high-security scenarios.
            return true;
        }

        return !!data;
    } catch (err) {
        console.error('Rate limit utility exception:', err);
        return true;
    }
}
