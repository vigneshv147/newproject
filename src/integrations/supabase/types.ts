export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    user_id: string
                    email: string
                    name: string
                    role: 'admin' | 'dispatcher' | 'officer' | 'support'
                    department: string | null
                    badge_number: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    email: string
                    name: string
                    role?: 'admin' | 'dispatcher' | 'officer' | 'support'
                    department?: string | null
                    badge_number?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    email?: string
                    name?: string
                    role?: 'admin' | 'dispatcher' | 'officer' | 'support'
                    department?: string | null
                    badge_number?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
