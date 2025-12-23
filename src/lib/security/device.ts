/**
 * 🛡️ DEVICE TRUST & FINGERPRINTING
 * 
 * Implements:
 * 1. Stable Device Fingerprinting (Canvas + Headers + Screen)
 * 2. Trust Score Calculation
 * 3. Drift Detection (Anti-Cloning)
 */

interface DeviceSignature {
    userAgent: string;
    screenResolution: string;
    timezone: string;
    language: string;
    platform: string;
    canvasHash: string;
    generatedAt: number;
}

export class DeviceTrustEngine {
    private static instance: DeviceTrustEngine;
    private currentSignature: DeviceSignature | null = null;
    private trustScore: number = 100; // 0-100

    private constructor() {
        this.snapshot();
    }

    static getInstance(): DeviceTrustEngine {
        if (!DeviceTrustEngine.instance) {
            DeviceTrustEngine.instance = new DeviceTrustEngine();
        }
        return DeviceTrustEngine.instance;
    }

    /**
     * 1️⃣ FINGERPRINT: Generates a stable browser signature
     */
    private async snapshot(): Promise<DeviceSignature> {
        const canvasHash = await this.getCanvasFingerprint();

        this.currentSignature = {
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            canvasHash,
            generatedAt: Date.now()
        };

        return this.currentSignature;
    }

    private async getCanvasFingerprint(): Promise<string> {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return 'unsupported';

            canvas.width = 200;
            canvas.height = 50;

            // Draw standard text with specific blending
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('TN_POLICE_SECURE_V2', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('TN_POLICE_SECURE_V2', 4, 17);

            const dataUrl = canvas.toDataURL();
            // Simple hash of the data URL
            let hash = 0;
            for (let i = 0; i < dataUrl.length; i++) {
                const char = dataUrl.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash.toString(16);
        } catch (e) {
            return 'error';
        }
    }

    /**
     * 2️⃣ BINDING CHECK: Verifies current device against stored trusted signature
     */
    async verifyTrust(storedSignatureJson: string | null): Promise<boolean> {
        if (!storedSignatureJson) {
            // First time device: Trust but verify
            console.log('🛡️ Device Trust: New Device Binding Created.');
            this.trustScore = 90; // Start high for new bind
            return true;
        }

        const current = await this.snapshot();
        const stored = JSON.parse(storedSignatureJson) as DeviceSignature;
        let driftPoints = 0;

        if (current.userAgent !== stored.userAgent) driftPoints += 40; // Major OS update? Or spoofing.
        if (current.canvasHash !== stored.canvasHash) driftPoints += 60; // Different GPU/Driver = Suspicious
        if (current.screenResolution !== stored.screenResolution) driftPoints += 10; // Monitor change? Accepted.

        // Calculate Score
        this.trustScore = Math.max(0, 100 - driftPoints);

        if (this.trustScore < 60) {
            console.warn(`🚨 SECURITY ALERT: Device Fingerprint Drift Detected! Score: ${this.trustScore}`);
            return false; // Force re-auth
        }

        console.log(`🛡️ Device Trust Verified. Score: ${this.trustScore}`);
        return true;
    }

    getTrustScore() {
        return this.trustScore;
    }

    getCurrentSignature() {
        return JSON.stringify(this.currentSignature);
    }
}

export const deviceTrust = DeviceTrustEngine.getInstance();
