export type PinLength = 4 | 6;

export interface PinLockConfig {
  isEnabled: boolean;
  pinLength: PinLength;
  pinHash: string;
  salt: string;
  autoLockTimeout: number; // in minutes (0 = immediately on blur/idle, 1, 5, 15, 30, -1 = never)
  lockOnTabSwitch: boolean;
  securityQuestion: string;
  securityAnswerHash: string;
  answerSalt: string;
  failedAttempts: number;
  lockedUntil: number | null; // epoch timestamp when cooldown ends
}

export interface PinUnlockResult {
  success: boolean;
  error?: string;
  remainingAttempts?: number;
  cooldownSeconds?: number;
}

export interface PinLockContextType {
  config: PinLockConfig;
  isLocked: boolean;
  isConfigured: boolean;
  cooldownRemaining: number;
  unlockApp: (pin: string) => Promise<PinUnlockResult>;
  lockApp: () => void;
  enablePin: (
    pin: string,
    length: PinLength,
    securityQuestion: string,
    securityAnswer: string,
    options?: Partial<PinLockConfig>
  ) => Promise<boolean>;
  disablePin: (currentPin: string) => Promise<boolean>;
  changePin: (currentPin: string, newPin: string) => Promise<boolean>;
  resetPinWithRecovery: (securityAnswer: string, newPin: string) => Promise<boolean>;
  updateConfig: (partial: Partial<PinLockConfig>) => void;
}
