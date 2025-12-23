import { z } from 'zod';

// =============================================
// 👤 AUTH SCHEMAS
// =============================================

export const emailSchema = z.string().email('Please enter a valid email address');
export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
export const nameSchema = z.string().min(2, 'Name must be at least 2 characters');
export const otpSchema = z.string().length(6, 'OTP must be 6 digits');

export const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
});

export const signupSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
    role: z.enum(['admin', 'dispatcher', 'officer', 'support']),
});

// =============================================
// 📝 PROFILE SCHEMAS
// =============================================

export const profileUpdateSchema = z.object({
    name: nameSchema.optional(),
    department: z.string().min(2).optional(),
    badge_number: z.string().min(2).optional(),
    avatar_url: z.string().url().optional().or(z.literal('')),
});

// =============================================
// 💬 MESSAGING SCHEMAS
// =============================================

export const messageSchema = z.object({
    content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
    channel_id: z.string().uuid(),
    encrypted: z.boolean().default(true),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

export const channelSchema = z.object({
    name: z.string().min(2, 'Channel name too short').max(50, 'Channel name too long'),
    type: z.enum(['direct', 'group', 'broadcast']).default('group'),
    description: z.string().max(200).optional(),
});
