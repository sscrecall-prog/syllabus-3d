import React, { useState, useEffect } from 'react';
import { Mail, Smartphone, ArrowLeft, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthHeader } from './AuthHeader';
import { AuthTextField } from './AuthTextField';
import { PasswordField } from './PasswordField';
import { PrimaryAuthButton } from './PrimaryAuthButton';
import { SocialLoginButton } from './SocialLoginButton';
import { AuthErrorMessage } from './AuthErrorMessage';
import { validateEmail, validatePassword } from '../../utils/authValidation';
import { soundManager } from '../../utils/soundEffects';

type LoginMethod = 'phone' | 'email';
type PhoneStep = 'number' | 'otp';

export const LoginView: React.FC = () => {
  const { login, loginWithGoogle, sendPhoneOtp, verifyPhoneOtp, setAuthView } = useAuth();

  // Mode & Tabs
  const [method, setMethod] = useState<LoginMethod>('phone');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('number');

  // Phone State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Email State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Status & Errors
  const [errors, setErrors] = useState<{ email?: string; password?: string; phone?: string; otp?: string; form?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Resend countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (phoneStep === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phoneStep, resendTimer]);

  // Handle Email Submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const emailVal = validateEmail(email);
    const pwdVal = validatePassword(password);

    if (!emailVal.isValid || !pwdVal.isValid) {
      setErrors({
        email: emailVal.error,
        password: pwdVal.error
      });
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      soundManager.playCompleteChime();
    } catch (err: any) {
      setErrors({ form: err.message || 'Incorrect email or password' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrors({ phone: 'Please enter a valid 10-digit mobile number' });
      return;
    }

    try {
      setIsLoading(true);
      await sendPhoneOtp(cleanPhone);
      soundManager.playClick();
      setPhoneStep('otp');
      setResendTimer(30);
      setCanResend(false);
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to send OTP. Please check the mobile number.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setErrors({});
    try {
      setIsLoading(true);
      const cleanPhone = phone.replace(/\D/g, '');
      await sendPhoneOtp(cleanPhone);
      soundManager.playClick();
      setResendTimer(30);
      setCanResend(false);
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to resend OTP.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const cleanOtp = otp.trim();
    if (cleanOtp.length < 6) {
      setErrors({ otp: 'Please enter the 6-digit OTP code' });
      return;
    }

    try {
      setIsLoading(true);
      const formattedPhone = `+91${phone.replace(/\D/g, '')}`;
      await verifyPhoneOtp(cleanOtp, formattedPhone);
      soundManager.playCompleteChime();
    } catch (err: any) {
      setErrors({ form: err.message || 'Invalid verification code. Please check and re-enter.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setErrors({});
      await loginWithGoogle();
      soundManager.playCompleteChime();
    } catch (err: any) {
      setErrors({ form: err.message || 'Google sign-in was cancelled or encountered an error.' });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div>
      <AuthHeader
        title="Welcome Back"
        subtitle="Continue your smart preparation journey"
      />

      {/* Invisible Recaptcha Container for Firebase */}
      <div id="recaptcha-container" />

      {/* Segmented Tab: Phone OTP vs Email */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/60 p-1 mb-5 border border-slate-200/80 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            setMethod('phone');
            setErrors({});
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            method === 'phone'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mobile Number (OTP)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            setMethod('email');
            setErrors({});
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            method === 'email'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email & Password</span>
        </button>
      </div>

      <AuthErrorMessage message={errors.form || null} />

      {/* ── METHOD 1: MOBILE NUMBER OTP ── */}
      {method === 'phone' && (
        <>
          {phoneStep === 'number' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mobile Number
                </label>
                <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                  <div className="flex items-center gap-1.5 px-3 bg-slate-50 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold shrink-0">
                    <span className="text-sm">🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="Enter 10-digit mobile number"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(val);
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
                    }}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white bg-transparent outline-none tracking-wider"
                    required
                    autoFocus
                  />
                </div>
                {errors.phone && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">{errors.phone}</p>
                )}
                <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>Standard 6-digit OTP will be sent to this number.</span>
                </p>
              </div>

              <PrimaryAuthButton isLoading={isLoading}>
                Send OTP via SMS
              </PrimaryAuthButton>
            </form>
          ) : (
            /* STEP 2: ENTER OTP */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Enter 6-Digit OTP
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setPhoneStep('number');
                      setOtp('');
                    }}
                    className="text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Change (+91 {phone})</span>
                  </button>
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="• • • • • •"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(val);
                    if (errors.otp) setErrors(prev => ({ ...prev, otp: undefined }));
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-center font-mono text-lg font-black tracking-[0.5em] text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  autoFocus
                  required
                />
                {errors.otp && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">{errors.otp}</p>
                )}

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Didn't receive code?</span>
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Resend OTP</span>
                    </button>
                  ) : (
                    <span className="font-mono font-semibold text-slate-400">
                      Resend in {resendTimer}s
                    </span>
                  )}
                </div>
              </div>

              <PrimaryAuthButton isLoading={isLoading}>
                Verify & Continue
              </PrimaryAuthButton>
            </form>
          )}
        </>
      )}

      {/* ── METHOD 2: EMAIL & PASSWORD ── */}
      {method === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <AuthTextField
            label="Email Address"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Enter your email (e.g. rahul@aspirant.com)"
            icon={Mail}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
            }}
            error={errors.email}
            required
          />

          <PasswordField
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            showForgotPassword
            onForgotPasswordClick={() => setAuthView('forgot_password')}
            required
          />

          <PrimaryAuthButton isLoading={isLoading}>
            Log In with Email
          </PrimaryAuthButton>
        </form>
      )}

      {/* ── OR CONTINUE WITH GOOGLE ── */}
      <div className="relative flex py-3 items-center mt-2">
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
        <span className="flex-shrink mx-3 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          OR CONTINUE WITH
        </span>
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
      </div>

      <SocialLoginButton
        onClick={handleGoogleLogin}
        isLoading={isGoogleLoading}
      />

      {/* Switch to Sign Up */}
      <div className="mt-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            setAuthView('signup');
          }}
          className="font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};
