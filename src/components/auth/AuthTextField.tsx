import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface AuthTextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
  error?: string;
}

export const AuthTextField = forwardRef<HTMLInputElement, AuthTextFieldProps>(({
  label,
  icon: Icon,
  error,
  id,
  className = '',
  ...props
}, ref) => {
  const inputId = id || 'auth_input_' + Math.random().toString(36).substr(2, 9);

  return (
    <div className="space-y-1.5 text-left">
      <label
        htmlFor={inputId}
        className="block text-xs font-bold text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>

      <div className="relative flex items-center">
        <div className="absolute left-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
          <Icon className="w-4 h-4" />
        </div>

        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
            error
              ? 'border-rose-500 focus:ring-rose-500/30'
              : 'border-slate-200 dark:border-slate-700/80 focus:border-brand-500 focus:ring-brand-500/20'
          } ${className}`}
          {...props}
        />
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

AuthTextField.displayName = 'AuthTextField';
