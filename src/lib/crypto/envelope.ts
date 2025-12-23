/**
 * 🛡️ ENVELOPE ENCRYPTION UTILITY
 * 
 * Implements per-record encryption using:
 * 1. AES-GCM for data encryption (using a unique Data Encryption Key - DEK)
 * 2. AES-KW or AES-GCM for key wrapping (wrapping the DEK with a Master Key - KEK)
 */

const MASTER_KEY_STR = import.meta.env.VITE_ENCRYPTION_MASTER_KEY || 'development_master_key_32_chars_!!';

// Helper to convert string to key bits
async function getMasterKey(): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyData = enc.encode(MASTER_KEY_STR.padEnd(32, '0').slice(0, 32));
    return crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

export interface EncryptedEnvelope {
    ciphertext: string; // Base64
    wrappedKey: string; // Base64
    iv: string;         // Base64
}

/**
 * Encrypts data using envelope encryption.
 */
export async function encryptEnvelope(data: string | object): Promise<EncryptedEnvelope> {
    const enc = new TextEncoder();
    const plainText = typeof data === 'string' ? data : JSON.stringify(data);
    const plainTextData = enc.encode(plainText);

    // 1. Generate a random Data Encryption Key (DEK)
    const dek = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    // 2. Encrypt data with DEK
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertextBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        dek,
        plainTextData
    );

    // 3. Export DEK to wrap it
    const dekRaw = await crypto.subtle.exportKey('raw', dek);

    // 4. Wrap DEK with Master Key (KEK)
    const masterKey = await getMasterKey();
    const keyIv = crypto.getRandomValues(new Uint8Array(12));
    const wrappedKeyBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: keyIv },
        masterKey,
        dekRaw
    );

    // 5. Package results as Base64
    return {
        ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer))),
        wrappedKey: btoa(String.fromCharCode(...new Uint8Array(wrappedKeyBuffer))) + '.' + btoa(String.fromCharCode(...keyIv)),
        iv: btoa(String.fromCharCode(...iv))
    };
}

/**
 * Decrypts data using envelope encryption.
 */
export async function decryptEnvelope(envelope: EncryptedEnvelope): Promise<string> {
    const masterKey = await getMasterKey();

    // 1. Unwrap the DEK
    const [wrappedKeyB64, keyIvB64] = envelope.wrappedKey.split('.');

    const wrappedKeyData = new Uint8Array(atob(wrappedKeyB64).split('').map(c => c.charCodeAt(0)));
    const keyIv = new Uint8Array(atob(keyIvB64).split('').map(c => c.charCodeAt(0)));

    const dekRaw = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: keyIv },
        masterKey,
        wrappedKeyData
    );

    const dek = await crypto.subtle.importKey(
        'raw',
        dekRaw,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    // 2. Decrypt the data with the unwrapped DEK
    const iv = new Uint8Array(atob(envelope.iv).split('').map(c => c.charCodeAt(0)));
    const ciphertext = new Uint8Array(atob(envelope.ciphertext).split('').map(c => c.charCodeAt(0)));

    const plainTextBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        dek,
        ciphertext
    );

    return new TextDecoder().decode(plainTextBuffer);
}
