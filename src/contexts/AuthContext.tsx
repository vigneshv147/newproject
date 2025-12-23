import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'dispatcher' | 'officer' | 'support';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string | null;
  badge_number: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendOtp: (email: string) => Promise<boolean>;
  verifyOtp: (email: string, code: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  pendingVerification: boolean;
  pendingEmail: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        // 🔒 Gracefully handle JWT cryptographic errors or other auth failures
        if (error.message.includes('cryptographic') || error.message.includes('JWT')) {
          console.warn('Auth context: Session appears corrupt, ignoring profile fetch');
        } else {
          console.error('Error fetching profile:', error);
        }
        return null;
      }
      return data as Profile | null;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(() => {
            fetchProfile(currentSession.user.id).then(setProfile);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check existing session with robust error handling
    supabase.auth.getSession().then(({ data: { session: existingSession }, error }) => {
      if (error) {
        console.warn('Auth context: Initial session check failed:', error.message);
        // If JWT is corrupt, we might need to clear it, but we'll let onAuthStateChange handle it
        setIsLoading(false);
        return;
      }

      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        fetchProfile(existingSession.user.id).then(setProfile);
      }
      setIsLoading(false);
    }).catch(err => {
      console.warn('Auth context: Exception during getSession:', err.message);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    setIsLoading(false);

    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    if (data.user) {
      // 📝 AUDIT: Log secure login
      await import('@/lib/security/audit').then(({ auditLogger }) =>
        auditLogger.log('LOGIN_SUCCESS', { method: 'password' }, data.user!.id)
      );
    }
    return true;
  }, [toast]);

  const signup = useCallback(async (email: string, password: string, name: string, role: UserRole): Promise<boolean> => {
    setIsLoading(true);

    const redirectUrl = `${window.location.origin}/dashboard`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          role,
        },
      },
    });

    setIsLoading(false);

    if (error) {
      console.error('Signup error:', error);
      toast({
        title: 'Signup Failed',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    // Check if user was created and email confirmation is required
    if (data?.user && !data.session) {
      // Email confirmation is required
      toast({
        title: 'Check Your Email',
        description: 'A confirmation link has been sent to your email. Please verify before logging in.',
        duration: 10000,
      });
      return true;
    }

    // If session exists, user is auto-confirmed
    if (data?.session) {
      // Create profile for new user
      try {
        await (supabase as any).from('profiles').upsert({
          user_id: data.user!.id,
          email: data.user!.email || email,
          name,
          role,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      } catch (e) {
        console.log('Profile creation handled by trigger');
      }

      toast({
        title: 'Account Created',
        description: 'Welcome to Project Chameleon!',
      });
      return true;
    }

    toast({
      title: 'Account Created',
      description: 'You can now login to your account',
    });

    return true;
  }, [toast]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      console.error('Google Sign-In error:', error);
      toast({
        title: 'Google Sign-In Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const sendOtp = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);

    // Generate OTP locally for demo fallback
    const demoOtp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { email },
      });

      if (error) {
        // Fallback: Store OTP locally and show in toast (demo mode)
        sessionStorage.setItem('demo_otp', demoOtp);
        sessionStorage.setItem('demo_otp_email', email);
        sessionStorage.setItem('demo_otp_expires', (Date.now() + 10 * 60 * 1000).toString());

        toast({
          title: '🔐 Demo Mode - Your OTP Code',
          description: `Verification code: ${demoOtp} (valid for 10 min)`,
          duration: 30000,
        });

        setPendingEmail(email);
        setPendingVerification(true);
        setIsLoading(false);
        return true;
      }

      setPendingEmail(email);
      setPendingVerification(true);
      setIsLoading(false);

      toast({
        title: 'OTP Sent',
        description: 'Check your email for the verification code',
      });

      return true;
    } catch (err: any) {
      // Same fallback on exception (demo mode)
      sessionStorage.setItem('demo_otp', demoOtp);
      sessionStorage.setItem('demo_otp_email', email);
      sessionStorage.setItem('demo_otp_expires', (Date.now() + 10 * 60 * 1000).toString());

      toast({
        title: '🔐 Demo Mode - Your OTP Code',
        description: `Verification code: ${demoOtp} (valid for 10 min)`,
        duration: 30000,
      });

      setPendingEmail(email);
      setPendingVerification(true);
      setIsLoading(false);
      return true;
    }
  }, [toast]);

  const verifyOtp = useCallback(async (email: string, code: string): Promise<boolean> => {
    setIsLoading(true);

    // Check demo OTP first (from sessionStorage)
    const demoOtp = sessionStorage.getItem('demo_otp');
    const demoEmail = sessionStorage.getItem('demo_otp_email');
    const demoExpires = sessionStorage.getItem('demo_otp_expires');

    if (demoOtp && demoEmail === email && demoExpires) {
      if (Date.now() < parseInt(demoExpires) && code === demoOtp) {
        // Clear demo OTP
        sessionStorage.removeItem('demo_otp');
        sessionStorage.removeItem('demo_otp_email');
        sessionStorage.removeItem('demo_otp_expires');

        setPendingVerification(false);
        setPendingEmail(null);
        setIsLoading(false);

        toast({
          title: 'OTP Verified',
          description: 'Demo authentication successful',
        });
        return true;
      } else if (Date.now() >= parseInt(demoExpires)) {
        // OTP expired
        sessionStorage.removeItem('demo_otp');
        sessionStorage.removeItem('demo_otp_email');
        sessionStorage.removeItem('demo_otp_expires');

        setIsLoading(false);
        toast({
          title: 'OTP Expired',
          description: 'Please request a new OTP',
          variant: 'destructive',
        });
        return false;
      } else {
        // Wrong code
        setIsLoading(false);
        toast({
          title: 'Invalid OTP',
          description: 'The code you entered is incorrect',
          variant: 'destructive',
        });
        return false;
      }
    }

    // Fall back to edge function verification
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { email, code },
      });

      setIsLoading(false);

      if (error || !data?.valid) {
        toast({
          title: 'Invalid OTP',
          description: data?.error || 'Please check the code and try again',
          variant: 'destructive',
        });
        return false;
      }

      setPendingVerification(false);
      setPendingEmail(null);

      return true;
    } catch (err: any) {
      setIsLoading(false);
      toast({
        title: 'Error',
        description: err.message || 'Failed to verify OTP',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const logout = useCallback(async () => {
    if (user) {
      // 📝 AUDIT: Log secure logout
      await import('@/lib/security/audit').then(({ auditLogger }) =>
        auditLogger.log('LOGOUT', { reason: 'user_action' }, user.id)
      );
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setPendingVerification(false);
    setPendingEmail(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      console.log('Refreshing profile for user:', user.id);
      const updatedProfile = await fetchProfile(user.id);
      console.log('Fetched profile:', updatedProfile);
      if (updatedProfile) {
        setProfile(updatedProfile);
        console.log('Profile state updated');
      } else {
        console.warn('No profile data returned');
      }
    }
  }, [user, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAuthenticated: !!session,
        isLoading,
        login,
        signup,
        logout,
        signInWithGoogle,
        sendOtp,
        verifyOtp,
        refreshProfile,
        pendingVerification,
        pendingEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
