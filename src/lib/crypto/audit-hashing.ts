import { supabase } from '@/integrations/supabase/client';

/**
 * 🛡️ AUDIT LOG HASHING UTILITY
 * 
 * Implements cryptographic hash-chaining for audit logs.
 * Each log entry contains a hash of (prev_hash + current_data).
 */

async function sha256(message: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Logs an action with cryptographic hash-chaining.
 */
export async function logSecureAudit(
    action: string,
    details: any = {},
    userId?: string
) {
    try {
        // 1. Fetch the most recent log's hash to use as prev_hash
        const { data: lastLog, error: fetchError } = await supabase
            .from('audit_logs')
            .select('hash')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching last log for hashing:', fetchError);
        }

        const prevHash = (lastLog && lastLog.hash) ? lastLog.hash : '0'.repeat(64); // Anchor for the first log


        // 2. Prepare data for hashing
        const logData = JSON.stringify({
            action,
            details,
            user_id: userId,
            timestamp: new Date().toISOString() // We use a fixed timestamp for hashing
        });

        const currentHash = await sha256(prevHash + logData);

        // 3. Insert the new log
        const { error: insertError } = await (supabase as any).from('audit_logs').insert({
            user_id: userId,
            action,
            details,
            prev_hash: prevHash,
            hash: currentHash
        });

        if (insertError) {
            console.error('Error inserting hashed audit log:', insertError);
        }

        return !insertError;
    } catch (err) {
        console.error('Audit logging exception:', err);
        return false;
    }
}
