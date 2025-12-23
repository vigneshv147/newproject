-- =============================================
-- 🛡️ REUSABLE RATE LIMITER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_requests INTEGER,
  p_window_interval INTERVAL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Cleanup old entries for this specific identifier/action to keep the table clean
  DELETE FROM public.rate_limits 
  WHERE identifier = p_identifier 
  AND action = p_action 
  AND created_at < (now() - p_window_interval);

  -- Count recent attempts
  SELECT count(*) INTO v_count
  FROM public.rate_limits
  WHERE identifier = p_identifier
  AND action = p_action
  AND created_at >= (now() - p_window_interval);

  -- If under limit, record the attempt and return true
  IF v_count < p_max_requests THEN
    INSERT INTO public.rate_limits (identifier, action)
    VALUES (p_identifier, p_action);
    RETURN TRUE;
  ELSE
    -- Rate limit exceeded
    RETURN FALSE;
  END IF;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO anon;
