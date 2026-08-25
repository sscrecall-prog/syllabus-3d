import React from 'react';
import { PasswordStrength } from '../../types/auth';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
  passwordLength: number;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  strength,
  passwordLength
}) => {
  if (passwordLength === 0) return null;

  const { score, label, color, criteria } = strength;

  return (
    <div className="space-y-2 pt-1 animate-fade-in text-left">
      {/* 3-segment strength bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 grid grid-cols-3 gap-1.5 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ backgroundColor: score >= 1 ? color : '#e2e8f0' }}
          />
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ backgroundColor: score >= 2 ? color : '#e2e8f0' }}
          />
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ backgroundColor: score >= 3 ? color : '#e2e8f0' }}
          />
        </div>

        <span
          className="text-[11px] font-bold tracking-wide transition-colors duration-300 shrink-0"
          style={{ color }}
        >
          {label}
        </span>
      </div>

      {/* Real-time Checklist Chips */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {[
          { met: criteria.minLength, label: '8+ chars' },
          { met: criteria.hasUpper, label: 'Uppercase' },
          { met: criteria.hasLower, label: 'Lowercase' },
          { met: criteria.hasNumber, label: 'Number' },
          { met: criteria.hasSpecial, label: 'Special char' },
        ].map((item, idx) => (
          <span
            key={idx}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${
              item.met
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-transparent'
            }`}
          >
            {item.met ? <Check className="w-2.5 h-2.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />}
            <span>{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
};
