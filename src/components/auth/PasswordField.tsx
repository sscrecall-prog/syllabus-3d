import React, { useState, forwardRef } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  showForgotPassword?: boolean;
  onForgotPasswordClick?: () => void;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(({
  label,
  error,
  id,
  showForgotPassword,
  onForgotPasswordClick,
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || 'pwd_input_' + Math.random().toString(36).substr(2, 9);

  return (
    <div className="space-y-1.5 text-left">
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>

        {showForgotPassword && onForgotPasswordClick && (
          <button
            type="button"
            onClick={onForgotPasswordClick}
            className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
          >
            Forgot Password?
          </button>
        )}
      </div>

      <div className="relative flex items-center">
        <div className="absolute left-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
          <Lock className="w-4 h-4" />
        </div>

        <input
          ref={ref}
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
            error
              ? 'border-rose-500 focus:ring-rose-500/30'
              : 'border-slate-200 dark:border-slate-700/80 focus:border-brand-500 focus:ring-brand-500/20'
          } ${className}`}
          {...props}
        />

        <button
          type="button"
          onClick={() => setShowPassword(p => !p)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {error && (
        <p
          id={`${inputId}-error`}
          className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 pl-1 animate-fade-in"
        >
          {error}
        </p>
      )}
    </div>
  );
});

PasswordField.displayName = 'PasswordField';
