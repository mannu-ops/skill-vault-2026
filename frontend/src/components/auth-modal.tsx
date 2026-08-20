import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  Sparkles,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { getApiUrl } from '../config';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any, token: string) => void;
  initialMode?: 'login' | 'signup';
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login'
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '135887641730-ce16tu9ed4fumt9ipvrm2lr5l2d3lgee.apps.googleusercontent.com';

  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleInitializedRef = useRef(false);

  /*
   * ============================================================
   * GOOGLE AUTH INITIALIZATION
   * ============================================================
   */
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let initTimer: ReturnType<typeof setTimeout> | null = null;

    const initializeGoogle = () => {
      if (cancelled) return;

      const google = (window as any).google;

      if (
        typeof window === 'undefined' ||
        !google?.accounts?.id ||
        !googleClientId
      ) {
        retryTimer = setTimeout(initializeGoogle, 300);
        return;
      }

      if (googleInitializedRef.current) {
        return;
      }

      try {
        google.accounts.id.initialize({
          client_id: googleClientId,
          auto_select: false,

          callback: async (response: any) => {
            if (!response?.credential) {
              setGoogleLoading(false);
              return;
            }

            setGoogleLoading(true);
            setError('');

            try {
              const res = await fetch(
                getApiUrl('/api/auth/google'),
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    credential: response.credential
                  })
                }
              );

              const data = await res.json();

              if (res.ok && data.token && data.user) {
                localStorage.setItem(
                  'sv_user_token',
                  data.token
                );

                localStorage.setItem(
                  'sv_user_data',
                  JSON.stringify(data.user)
                );

                const uName =
                  data.user.name ||
                  data.user.email?.split('@')[0] ||
                  'User';

                setSuccessMsg(
                  `🚀 Logged in with Google successfully! Welcome, ${uName}.`
                );

                setTimeout(() => {
                  onSuccess(data.user, data.token);
                  onClose();
                }, 1800);

                return;
              }

              setError(
                data.error || 'Google login failed'
              );
            } catch (e: any) {
              setError(
                e?.message ||
                'Failed to verify Google credential'
              );
            } finally {
              setGoogleLoading(false);
            }
          }
        });

        const container = document.getElementById('google-signin-btn-container');
        if (container) {
          container.innerHTML = '';
          google.accounts.id.renderButton(container, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            width: 400,
            text: 'continue_with',
            shape: 'rectangular',
          });
        }

        googleInitializedRef.current = true;
      } catch (err) {
        console.warn(
          'Google Sign-In initialization error:',
          err
        );
      }
    };

    // Defer Google Sign-In script initialization by 250ms so modal animation plays instantly without main-thread jank!
    initTimer = setTimeout(initializeGoogle, 250);

    return () => {
      cancelled = true;

      if (initTimer) {
        clearTimeout(initTimer);
      }

      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [isOpen, googleClientId]);

  /*
   * ============================================================
   * GOOGLE BUTTON
   * ============================================================
   */
  const handleGoogleAuth = () => {
    setError('');

    const google = (window as any).google;

    if (!google?.accounts || !googleClientId) {
      setError('Google Sign-In is still loading. Please try again.');
      return;
    }

    setGoogleLoading(true);

    try {
      if (google.accounts.oauth2) {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              setGoogleLoading(false);
              if (tokenResponse.error !== 'popup_closed_by_user') {
                setError('Google Sign-In failed: ' + tokenResponse.error);
              }
              return;
            }

            if (tokenResponse?.access_token) {
              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const googleUser = await userRes.json();

                if (!googleUser?.email) {
                  throw new Error('Failed to retrieve email profile from Google');
                }

                const res = await fetch(getApiUrl('/api/auth/google'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userInfo: googleUser })
                });

                const data = await res.json();

                if (res.ok && data.token && data.user) {
                  localStorage.setItem('sv_user_token', data.token);
                  localStorage.setItem('sv_user_data', JSON.stringify(data.user));
                  const uName = data.user.name || data.user.email?.split('@')[0] || 'User';
                  setSuccessMsg(`🚀 Logged in with Google successfully! Welcome, ${uName}.`);
                  setTimeout(() => {
                    onSuccess(data.user, data.token);
                    onClose();
                  }, 1500);
                  return;
                }

                setError(data.message || data.error || 'Google login failed');
              } catch (err: any) {
                setError(err?.message || 'Failed to verify Google login');
              } finally {
                setGoogleLoading(false);
              }
            }
          }
        });
        client.requestAccessToken();
      } else if (google.accounts.id) {
        google.accounts.id.prompt((notification: any) => {
          if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
            setGoogleLoading(false);
          }
        });
      }
    } catch (err) {
      console.warn('Google auth error:', err);
      setGoogleLoading(false);
      setError('Unable to open Google Sign-In popup. Please try again.');
    }
  };

  /*
   * ============================================================
   * NORMAL EMAIL LOGIN / SIGNUP
   * ============================================================
   */
  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError('');
    setSuccessMsg('');

    // Client-side Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    const endpoint =
      mode === 'login'
        ? '/api/auth/login'
        : '/api/auth/signup';

    const payload =
      mode === 'login'
        ? {
          email,
          password
        }
        : {
          email,
          password,
          name,
          phone: phone || undefined
        };

    try {
      const res = await fetch(
        getApiUrl(endpoint),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
          'Authentication failed'
        );
      }

      if (data.token && data.user) {
        localStorage.setItem(
          'sv_user_token',
          data.token
        );

        localStorage.setItem(
          'sv_user_data',
          JSON.stringify(data.user)
        );

        const userName =
          data.user.name ||
          data.user.email?.split('@')[0] ||
          'User';

        const msg =
          mode === 'login'
            ? `🎉 Welcome back, ${userName}! Logged in successfully.`
            : `✨ Account created successfully! Welcome to Skill Vault, ${userName}.`;

        setSuccessMsg(msg);

        setTimeout(() => {
          onSuccess(
            data.user,
            data.token
          );

          onClose();
        }, 1800);
      }
    } catch (err: any) {
      setError(
        err?.message ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transform-gpu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/80 cursor-pointer transform-gpu"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      />

      {/* Modal Content */}
      <motion.div
        className="
          bg-[#0b0d19]
          border border-slate-800/90
          rounded-3xl
          w-full
          max-w-md
          min-h-[530px]
          sm:min-h-[550px]
          max-h-[90vh]
          overflow-y-auto
          overflow-x-hidden
          no-scrollbar
          shadow-2xl
          relative
          flex
          flex-col
          justify-between
          z-10
          transform-gpu
        "
        initial={{ opacity: 0, scale: 0.97, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 6 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Glow Effects (Zero GPU filter penalty) */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-600/15 via-transparent to-transparent pointer-events-none" />

        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-600/15 via-transparent to-transparent pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="
            absolute
            top-4
            right-4
            text-slate-400
            hover:text-white
            bg-slate-900/80
            hover:bg-slate-800
            p-2
            rounded-full
            transition-colors
            cursor-pointer
            z-20
          "
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="p-5 pb-3 border-b border-slate-800/80 text-center relative">
          <div
            className="
              inline-flex
              items-center
              justify-center
              gap-1.5
              text-violet-400
              text-[11px]
              font-semibold
              uppercase
              tracking-widest
              bg-violet-500/10
              border
              border-violet-500/20
              px-2.5
              py-0.5
              rounded-full
              mb-2
            "
          >
            <Sparkles className="w-3 h-3" />
            Customer Account Portal
          </div>

          {/* Animated Header Text */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
            >
              <h2 className="text-xl font-black tracking-tight text-white">
                {mode === 'login'
                  ? 'Welcome Back!'
                  : 'Create Your Account'}
              </h2>

              <p className="text-slate-400 text-[11px] mt-0.5">
                {mode === 'login'
                  ? 'Enter your credentials to access your purchased courses'
                  : 'Join thousands of developers and unlock instant access'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Mode Switcher with Sliding Pill Indicator */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 mt-3.5 relative">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              className={`
                relative
                flex-1
                py-1.5
                text-xs
                font-semibold
                rounded-lg
                flex
                items-center
                justify-center
                gap-1.5
                cursor-pointer
                z-10
                transition-colors
                ${mode === 'login'
                  ? 'text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
                }
              `}
            >
              {mode === 'login' && (
                <motion.div
                  layoutId="authModeActiveTab"
                  className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg shadow-lg -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <LogIn className="w-3.5 h-3.5" />
              Log In
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
                setSuccessMsg('');
              }}
              className={`
                relative
                flex-1
                py-1.5
                text-xs
                font-semibold
                rounded-lg
                flex
                items-center
                justify-center
                gap-1.5
                cursor-pointer
                z-10
                transition-colors
                ${mode === 'signup'
                  ? 'text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
                }
              `}
            >
              {mode === 'signup' && (
                <motion.div
                  layoutId="authModeActiveTab"
                  className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg shadow-lg -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <UserPlus className="w-3.5 h-3.5" />
              Sign Up
            </button>
          </div>
        </div>

        {/* Success */}
        {successMsg ? (
          <div className="p-6 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div
              className="
                w-14
                h-14
                rounded-full
                bg-emerald-500/20
                border-2
                border-emerald-500/40
                flex
                items-center
                justify-center
                text-emerald-400
                mx-auto
                animate-bounce
              "
            >
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">
                {mode === 'login'
                  ? '🎉 Welcome Back!'
                  : '✨ Account Created!'}
              </h3>

              <p
                className="
                  text-xs
                  font-semibold
                  text-emerald-400
                  mt-2
                  bg-emerald-500/10
                  border
                  border-emerald-500/20
                  p-3
                  rounded-xl
                  leading-relaxed
                "
              >
                {successMsg}
              </p>
            </div>

            <p className="text-xs text-slate-500 font-mono pt-1">
              Redirecting to your account dashboard...
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-5 space-y-3 transform-gpu flex-1 flex flex-col justify-between"
          >
            {/* Custom Stable Google Button */}
            <div className="relative w-full mb-1">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={googleLoading}
                className="
                  w-full
                  h-10
                  px-4
                  flex
                  items-center
                  justify-center
                  gap-3
                  rounded-xl
                  bg-white
                  hover:bg-slate-100
                  active:bg-slate-200
                  text-slate-900
                  text-xs
                  font-bold
                  border
                  border-slate-300
                  shadow-sm
                  transition-colors
                  cursor-pointer
                  disabled:opacity-60
                  disabled:cursor-wait
                  relative
                  overflow-hidden
                "
              >
                {googleLoading ? (
                  <div
                    className="
                      w-4
                      h-4
                      border-2
                      border-slate-400
                      border-t-slate-900
                      rounded-full
                      animate-spin
                    "
                  />
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.26z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.5z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M6.54 13.59A5.86 5.86 0 0 1 6.23 12c0-.55.1-1.08.31-1.59V7.88H3.3A9.5 9.5 0 0 0 2.25 12c0 1.53.37 2.98 1.05 4.12l3.24-2.53z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 6.38c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.43 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 8.1 9.46 6.38 12 6.38z"
                    />
                  </svg>
                )}

                <span>
                  {googleLoading
                    ? 'Connecting to Google...'
                    : 'Continue with Google'}
                </span>

                {/* Google Official GIS Iframe Overlay */}

              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-1.5">
              <div className="border-t border-slate-800/80 w-full" />
              <span className="bg-[#0b0d19] px-2.5 text-[9px] uppercase font-mono text-slate-500 shrink-0">
                or with email
              </span>
              <div className="border-t border-slate-800/80 w-full" />
            </div>

            {/* Error */}
            {error && (
              <div
                className="
                  bg-red-500/10
                  border
                  border-red-500/30
                  text-red-400
                  p-2.5
                  rounded-xl
                  text-xs
                  flex
                  items-start
                  gap-2
                "
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Fields Container - Fixed alignment */}
            <div className="space-y-3">
              {/* Email Address (Always at exact same position) */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password (With Show/Hide Toggle) */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Extra Signup Fields (Full Name & Phone) with smooth in-place height reveal */}
              <AnimatePresence initial={false}>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-3 overflow-hidden"
                  >
                    {/* Full Name */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required={mode === 'signup'}
                          placeholder="Rahul Sharma"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Phone Number (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transform-gpu mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" /> Log In to Account
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Create Free Account
                </>
              )}
            </motion.button>
          </form>
        )}

        {/* Footer */}
        <div className="p-3.5 bg-slate-900/40 border-t border-slate-800/60 text-center text-xs text-slate-400">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-violet-400 hover:underline font-semibold cursor-pointer"
              >
                Sign Up Now
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-violet-400 hover:underline font-semibold cursor-pointer"
              >
                Log In
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}