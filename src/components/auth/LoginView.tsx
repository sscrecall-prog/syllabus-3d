import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthHeader } from './AuthHeader';
import { AuthTextField } from './AuthTextField';
import { PasswordField } from './PasswordField';
import { PrimaryAuthButton } from './PrimaryAuthButton';
import { SocialLoginButton } from './SocialLoginButton';
import { AuthErrorMessage } from './AuthErrorMessage';
import { validateEmail, validatePassword } from '../../utils/authValidation';
import { soundManager } from '../../utils/soundEffects';

export const LoginView: React.FC = () => {
  const { login, loginWithGoogle, setAuthView } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setErrors({});
      await loginWithGoogle();
      soundManager.playCompleteChime();
    } catch (err: any) {
      setErrors({ form: 'Google sign-in was cancelled or encountered an error.' });
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthErrorMessage message={errors.form || null} />

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
          Log In
        </PrimaryAuthButton>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            OR CONTINUE WITH
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
        </div>

        <SocialLoginButton
          onClick={handleGoogleLogin}
          isLoading={isGoogleLoading}
        />
      </form>

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

