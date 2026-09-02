import React, { useState } from 'react';
import { User, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthHeader } from './AuthHeader';
import { AuthTextField } from './AuthTextField';
import { PasswordField } from './PasswordField';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { PrimaryAuthButton } from './PrimaryAuthButton';
import { SocialLoginButton } from './SocialLoginButton';
import { AuthErrorMessage } from './AuthErrorMessage';
import { LegalModal } from './LegalModal';
import {
  validateFullName,
  validateEmail,
  validatePassword,
  validatePasswordsMatch,
  checkPasswordStrength
} from '../../utils/authValidation';
import { soundManager } from '../../utils/soundEffects';

export const SignUpView: React.FC = () => {
  const { signup, loginWithGoogle, setAuthView } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);

  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
    form?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const passwordStrength = checkPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const nameVal = validateFullName(fullName);
    const emailVal = validateEmail(email);
    const pwdVal = validatePassword(password);
    const matchVal = validatePasswordsMatch(password, confirmPassword);

    if (!nameVal.isValid || !emailVal.isValid || !pwdVal.isValid || !matchVal.isValid || !agreeToTerms) {
      setErrors({
        fullName: nameVal.error,
        email: emailVal.error,
        password: pwdVal.error,
        confirmPassword: matchVal.error,
        terms: !agreeToTerms ? 'You must agree to the Terms & Privacy Policy to proceed.' : undefined
      });
      return;
    }

    try {
      setIsLoading(true);
      await signup(fullName, email, password);
      soundManager.playCompleteChime();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to create account.' });
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
      setErrors({ form: 'Google sign-in encountered an error.' });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div>
      <AuthHeader
        title="Create Account"
        subtitle="Start tracking your preparation smarter"
      />

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <AuthErrorMessage message={errors.form || null} />

        <AuthTextField
          label="Full Name"
          type="text"
          autoComplete="name"
          placeholder="Enter your full name"
          icon={User}
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (errors.fullName) setErrors(prev => ({ ...prev, fullName: undefined }));
          }}
          error={errors.fullName}
          required
        />

        <AuthTextField
          label="Email Address"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Enter your email"
          icon={Mail}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
          }}
          error={errors.email}
          required
        />

        <div>
          <PasswordField
            label="Password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            required
          />
          <PasswordStrengthIndicator
            strength={passwordStrength}
            passwordLength={password.length}
          />
        </div>

        <PasswordField
          label="Confirm Password"
          autoComplete="new-password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
          }}
          error={errors.confirmPassword}
          required
        />

        {/* Terms Checkbox */}
        <div className="pt-1 text-left">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => {
                setAgreeToTerms(e.target.checked);
                if (errors.terms) setErrors(prev => ({ ...prev, terms: undefined }));
              }}
              className="mt-0.5 w-4 h-4 rounded text-brand-500 focus:ring-brand-500/30 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-pointer"
            />
            <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setLegalModalType('terms')}
                className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => setLegalModalType('privacy')}
                className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
              >
                Privacy Policy
              </button>
            </span>
          </label>

          {errors.terms && (
            <p className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 pl-6 pt-1">
              {errors.terms}
            </p>
          )}
        </div>

        <div className="pt-2">
          <PrimaryAuthButton isLoading={isLoading}>
            Create Account
          </PrimaryAuthButton>
        </div>

        {/* Divider */}
        <div className="relative flex py-1.5 items-center">
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

      {/* Switch to Log In */}
      <div className="mt-5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            setAuthView('login');
          }}
          className="font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
        >
          Log In
        </button>
      </div>

      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
};

