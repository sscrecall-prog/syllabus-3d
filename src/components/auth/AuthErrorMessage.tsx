import React from 'react';
import { AlertCircle } from 'lucide-react';

interface AuthErrorMessageProps {
  message: string | null;
}

export const AuthErrorMessage: React.FC<AuthErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2.5 animate-fade-in text-left"
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span className="leading-snug">{message}</span>
    </div>
  );
};
