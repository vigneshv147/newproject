import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  email: string;
  code: string;
}

// Rate limiting constants
const MAX_VERIFY_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_THRESHOLD = 10;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerifyRequest = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "Email and code are required", valid: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate input format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Invalid email format", valid: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OTP should be exactly 6 digits
    if (!/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP format", valid: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for lockout (too many failed attempts)
    const lockoutWindowStart = new Date(Date.now() - LOCKOUT_DURATION_MS).toISOString();
    const { data: lockoutAttempts } = await supabase
      .from("rate_limits")
      .select("id")
      .eq("identifier", email)
      .eq("action", "verify_otp_failed")
      .gte("created_at", lockoutWindowStart);

    if (lockoutAttempts && lockoutAttempts.length >= LOCKOUT_THRESHOLD) {
      console.log(`Account locked for email: ${email}`);
      return new Response(
        JSON.stringify({ error: "Account temporarily locked due to too many failed attempts. Try again in 1 hour.", valid: false }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit for verification attempts
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { data: recentAttempts } = await supabase
      .from("rate_limits")
      .select("id")
      .eq("identifier", email)
      .eq("action", "verify_otp")
      .gte("created_at", windowStart);

    if (recentAttempts && recentAttempts.length >= MAX_VERIFY_ATTEMPTS) {
      console.log(`Verification rate limit exceeded for email: ${email}`);
      return new Response(
        JSON.stringify({ error: "Too many verification attempts. Please try again later.", valid: false }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record this verification attempt
    await supabase.from("rate_limits").insert({
      identifier: email,
      action: "verify_otp"
    });

    // Find valid OTP
    const { data: otpData, error: otpError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.error("Error verifying OTP:", otpError);
      return new Response(
        JSON.stringify({ error: "Failed to verify OTP", valid: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!otpData) {
      // Record failed attempt for lockout tracking
      await supabase.from("rate_limits").insert({
        identifier: email,
        action: "verify_otp_failed"
      });

      console.log(`Invalid OTP attempt for email: ${email}`);
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP", valid: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as used
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("id", otpData.id);

    // Clear failed attempts on successful verification
    await supabase
      .from("rate_limits")
      .delete()
      .eq("identifier", email)
      .eq("action", "verify_otp_failed");

    console.log(`OTP verified successfully for email: ${email}`);

    return new Response(
      JSON.stringify({ valid: true, message: "OTP verified successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message, valid: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});