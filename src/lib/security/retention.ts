/**
 * ⏳ DATA RETENTION & LEGAL HOLD ENGINE
 * 
 * Enforces:
 * 1. Automatic Data Expiry (Retention Policy)
 * 2. Legal Hold Locking (Prevent deletion of evidence)
 * 3. Secure Deletion (Crypto-shredding)
 */

import { auditLogger } from './audit';
import { permissionEngine } from './permissions';

export type RetentionPolicy = 'standard_logs' | 'criminal_evidence' | 'communication_meta' | 'temporary_cache';

export const RETENTION_SCHEDULE: Record<RetentionPolicy, number> = {
    'standard_logs': 365 * 2, // 2 Years
    'criminal_evidence': 365 * 10, // 10 Years
    'communication_meta': 365 * 1, // 1 Year
    'temporary_cache': 7 // 7 Days
};

export class RetentionEngine {
    private static instance: RetentionEngine;

    private constructor() { }

    static getInstance(): RetentionEngine {
        if (!RetentionEngine.instance) {
            RetentionEngine.instance = new RetentionEngine();
        }
        return RetentionEngine.instance;
    }

    /**
     * Check if a record is eligible (and legally allowed) for deletion
     */
    async canDelete(
        recordType: RetentionPolicy,
        creationDate: Date,
        isUnderLegalHold: boolean,
        userRole: string
    ): Promise<{ allowed: boolean; reason: string }> {

        // 1. Legal Hold Logic (Absolute Blocker)
        if (isUnderLegalHold) {
            await auditLogger.log('DELETION_BLOCKED', { reason: 'legal_hold_active', type: recordType }, 'system');
            return { allowed: false, reason: 'Record is under Active Legal Hold.' };
        }

        // 2. Retention Period Check
        const retentionDays = RETENTION_SCHEDULE[recordType];
        const expiryDate = new Date(creationDate);
        expiryDate.setDate(expiryDate.getDate() + retentionDays);

        const now = new Date();
        const isExpired = now > expiryDate;

        // 3. Early Deletion (Privileged Action)
        if (!isExpired) {
            // Only Admin can delete before expiry, and requires explicit permission
            const canEarlyDelete = permissionEngine.canOverride(userRole, 'constable') && userRole === 'admin';

            if (canEarlyDelete) {
                // Allow, but log heavily
                return { allowed: true, reason: 'Admin Early Deletion Override' };
            }

            return { allowed: false, reason: `Retention period active. Expires on ${expiryDate.toISOString()}` };
        }

        return { allowed: true, reason: 'Retention period expired' };
    }

    /**
     * Crypto-Shredding (Simulation)
     * In a real app, this would delete the encryption key for the record
     */
    async secureDelete(recordId: string, type: RetentionPolicy, userId: string): Promise<boolean> {
        // Log destruction
        await auditLogger.log('DATA_DESTRUCTION', { recordId, type, method: 'crypto_shred' }, userId);
        return true;
    }
}

export const retentionEngine = RetentionEngine.getInstance();
