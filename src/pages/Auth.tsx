import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurity } from '@/contexts/SecurityContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  loginSchema,
  signupSchema,
  emailSchema,
  otpSchema
} from '@/lib/validation/schemas';
import { checkRateLimit } from '@/lib/rate-limiter';
import { Logo } from '@/components/ui/Logo';

type AuthMode = 'login' | 'signup' | 'forgot-password';
type AuthMethod = 'password' | 'otp';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showBackButton, setShowBackButton] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [selectedRole, setSelectedRole] = useState('officer');
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const roles = [
    { value: 'officer', label: 'Officer' },
    { value: 'dispatcher', label: 'Dispatcher' },
    { value: 'admin', label: 'Administrator' },
    { value: 'support', label: 'Support' },
  ];

  const { login, signup, signInWithGoogle, sendOtp, verifyOtp, isLoading, pendingVerification, pendingEmail, isAuthenticated } = useAuth();
  const { initializeSecurity } = useSecurity();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Show back button after 5 seconds of inactivity or on error
  useEffect(() => {
    const checkInactivity = () => {
      if (Date.now() - lastActivity > 5000) {
        setShowBackButton(true);
      }
    };

    inactivityTimerRef.current = setInterval(checkInactivity, 1000);

    return () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
    };
  }, [lastActivity]);

  // Reset inactivity timer on user interaction
  const resetInactivityTimer = () => {
    setLastActivity(Date.now());
  };

  // Show back button on any error
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setShowBackButton(true);
    }
  }, [errors]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const result = mode === 'login'
      ? loginSchema.safeParse({ email, password })
      : signupSchema.safeParse({ email, password, name, role: selectedRole });

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0]?.toString() || 'general';
        newErrors[field] = issue.message;
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetInactivityTimer();

    if (pendingVerification) {
      try {
        otpSchema.parse(otp);
      } catch {
        setErrors({ otp: 'OTP must be 6 digits' });
        return;
      }

      const success = await verifyOtp(pendingEmail!, otp);
      if (success) {
        toast({ title: 'Welcome to Project Chameleon', description: 'Authentication successful' });
        navigate('/dashboard');
      }
      return;
    }

    if (!validateForm()) return;

    let success: boolean;
    if (mode === 'login') {
      // 🛡️ Rate limit login attempts
      const allowed = await checkRateLimit(email, 'login', 5, '15 minutes');
      if (!allowed) {
        toast({
          title: 'Too many attempts',
          description: 'Please wait a while before trying again.',
          variant: 'destructive',
        });
        return;
      }

      success = await login(email, password);
      if (success) {
        toast({ title: 'Welcome back', description: 'Login successful' });
        // 🛡️ Initialize Security Core (this derives keys from password)
        await initializeSecurity(password);
        navigate('/dashboard');
      } else {
        setShowBackButton(true);
      }
    } else {
      // 🛡️ Rate limit signup attempts
      const allowed = await checkRateLimit(email, 'signup', 3, '1 hour');
      if (!allowed) {
        toast({
          title: 'Too many signups',
          description: 'Please wait a while before trying again.',
          variant: 'destructive',
        });
        return;
      }

      success = await signup(email, password, name, selectedRole as 'admin' | 'dispatcher' | 'officer' | 'support');

      if (success) {
        const loginSuccess = await login(email, password);
        if (loginSuccess) {
          navigate('/dashboard');
        }
      } else {
        setShowBackButton(true);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    resetInactivityTimer();
    await signInWithGoogle();
  };

  const handleSendOtp = async () => {
    resetInactivityTimer();
    try {
      emailSchema.parse(email);
    } catch {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }
    const success = await sendOtp(email);
    if (success) {
      setOtpSent(true);
      toast({ title: 'OTP Sent', description: `A verification code has been sent to ${email}` });
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetInactivityTimer();
    try {
      otpSchema.parse(otp);
    } catch {
      setErrors({ otp: 'OTP must be 6 digits' });
      return;
    }

    const success = await verifyOtp(email, otp);
    if (success) {
      toast({ title: 'Welcome to Project Chameleon', description: 'OTP verification successful' });
      navigate('/dashboard');
    }
  };

  const goBack = () => {
    if (otpSent) {
      setOtpSent(false);
      setOtp('');
    } else if (pendingVerification) {
      // Can't go back from pending verification easily
      setOtp('');
    } else {
      navigate('/');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
      onClick={resetInactivityTimer}
      onKeyDown={resetInactivityTimer}
    >
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back Button - appears after 5s inactivity or on error */}
      {showBackButton && (
        <button
          onClick={goBack}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm text-white rounded-lg hover:bg-slate-700/50 transition-all duration-300 border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
      )}

      {/* Home Button */}
      <Link
        to="/"
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm text-white rounded-lg hover:bg-slate-700/50 transition-all duration-300 border border-slate-700"
      >
        <Home className="w-4 h-4" />
        <span className="text-sm font-medium">Home</span>
      </Link>

      {/* Auth Card */}
      <div className="w-full max-w-md mx-4">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo size="xl" className="w-28 h-28 border-4 border-white shadow-2xl" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-light text-white text-center mb-8 tracking-wide">
          {mode === 'login' ? 'LOGIN' : mode === 'signup' ? 'REGISTER' : 'RESET PASSWORD'}
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name field for signup */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Username"
                  value={name}
                  onChange={(e) => { setName(e.target.value); resetInactivityTimer(); }}
                  className="bg-transparent border-0 border-b-2 border-white/50 rounded-none text-white placeholder:text-white/70 focus:border-white focus-visible:ring-0 py-4 text-lg"
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-200">{errors.name}</p>
              )}
            </div>
          )}

          {/* Role dropdown for signup */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <select
                value={selectedRole}
                onChange={(e) => { setSelectedRole(e.target.value); resetInactivityTimer(); }}
                className="w-full bg-transparent border-0 border-b-2 border-white/50 text-white py-4 text-lg focus:border-white focus:outline-none cursor-pointer"
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value} className="bg-gray-800 text-white">
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); resetInactivityTimer(); }}
                className="bg-transparent border-0 border-b-2 border-white/50 rounded-none text-white placeholder:text-white/70 focus:border-white focus-visible:ring-0 py-4 text-lg"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-200">{errors.email}</p>
            )}
          </div>

          {/* Password field */}
          {(mode === 'signup' || (mode === 'login' && authMethod === 'password')) && (
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); resetInactivityTimer(); }}
                  className="bg-transparent border-0 border-b-2 border-white/50 rounded-none text-white placeholder:text-white/70 focus:border-white focus-visible:ring-0 py-4 text-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-200">{errors.password}</p>
              )}
            </div>
          )}

          {/* OTP Flow */}
          {mode === 'login' && authMethod === 'otp' && (
            <>
              {!otpSent ? (
                <Button
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full bg-white text-purple-600 hover:bg-white/90 rounded-full py-6 text-lg font-medium shadow-xl"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send OTP to Email'}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); resetInactivityTimer(); }}
                      className="bg-transparent border-0 border-b-2 border-white/50 rounded-none text-white placeholder:text-white/70 focus:border-white focus-visible:ring-0 py-4 text-2xl text-center tracking-widest"
                      maxLength={6}
                    />
                    {errors.otp && (
                      <p className="text-sm text-red-200 text-center">{errors.otp}</p>
                    )}
                    <p className="text-sm text-white/70 text-center">
                      Code sent to {email}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleOtpLogin}
                    className="w-full bg-white text-purple-600 hover:bg-white/90 rounded-full py-6 text-lg font-medium shadow-xl"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Login'}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Submit Button (not for OTP flow) */}
          {(mode === 'signup' || (mode === 'login' && authMethod === 'password')) && (
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white rounded-full py-6 text-lg font-semibold shadow-xl mt-8 border-0"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : mode === 'login' ? 'Login' : 'Register'}
            </Button>
          )}
        </form>

        {/* Auth Method Toggle (Login only) */}
        {mode === 'login' && (
          <div className="flex justify-center gap-4 mt-6">
            <button
              type="button"
              onClick={() => { setAuthMethod('password'); setOtpSent(false); }}
              className={cn(
                "px-4 py-2 rounded-full text-sm transition-all",
                authMethod === 'password'
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => { setAuthMethod('otp'); setPassword(''); }}
              className={cn(
                "px-4 py-2 rounded-full text-sm transition-all",
                authMethod === 'otp'
                  ? "bg-white/30 text-white"
                  : "text-white/70 hover:text-white"
              )}
            >
              Email OTP
            </button>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setErrors({});
              setOtpSent(false);
              resetInactivityTimer();
            }}
            className="text-white/80 hover:text-white text-sm transition-colors"
          >
            {mode === 'login'
              ? "Don't have an account? Register"
              : "Already have an account? Login"}
          </button>
        </div>

        {/* Google Sign In */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/30" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 text-white/70 bg-transparent">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            className="w-full mt-4 bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-full py-5"
            onClick={handleGoogleSignIn}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-white/50 text-xs mt-8">
          © 2025 Project Chameleon • Cyber Crime Wing
        </p>
      </div>
    </div>
  );
}
