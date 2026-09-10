import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { PinLockConfig, PinLockContextType, PinUnlockResult, PinLength } from '../types/pinLock';
import {
  generateSalt,
  hashWithSalt,
  verifyHashWithSalt,
  hashSecurityAnswer,
  verifySecurityAnswer
} from '../utils/pinSecurity';
import { soundManager } from '../utils/soundEffects';
import { haptics } from '../utils/haptics';

const STORAGE_KEY = 'syllabus3d_pin_config';
const MAX_FAILED_ATTEMPTS = 5;
const COOLDOWN_DURATION_MS = 30 * 1000; // 30 seconds

export const DEFAULT_PIN_CONFIG: PinLockConfig = {
  isEnabled: false,
  pinLength: 4,
  pinHash: '',
  salt: '',
  autoLockTimeout: 5, // 5 minutes default
  lockOnTabSwitch: false,
  securityQuestion: 'What is your target exam or dream post?',
  securityAnswerHash: '',
  answerSalt: '',
  failedAttempts: 0,
  lockedUntil: null,
};

const PinLockContext = createContext<PinLockContextType | undefined>(undefined);

export const PinLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load configuration from localStorage
  const [config, setConfig] = useState<PinLockConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PIN_CONFIG, ...parsed };
      }
    } catch (e) {
      console.error('[PinLock] Error loading stored config:', e);
    }
    return DEFAULT_PIN_CONFIG;
  });

  // App is locked by default on startup if PIN is enabled and configured
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: PinLockConfig = JSON.parse(stored);
        return Boolean(parsed.isEnabled && parsed.pinHash);
      }
    } catch {}
    return false;
  });

  // Cooldown countdown state in seconds
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(() => {
    if (config.lockedUntil && config.lockedUntil > Date.now()) {
      return Math.ceil((config.lockedUntil - Date.now()) / 1000);
    }
    return 0;
  });

  // Persist config whenever it changes
  const saveConfig = useCallback((newConfig: PinLockConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error('[PinLock] Error saving config:', e);
    }
  }, []);

  // Maintain latest config in ref to avoid stale closures in stable callbacks
  const configRef = React.useRef<PinLockConfig>(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Cooldown timer interval
  useEffect(() => {
    if (!config.lockedUntil) {
      setCooldownRemaining(0);
      return;
    }

    const checkCooldown = () => {
      const current = configRef.current;
      if (!current.lockedUntil) {
        setCooldownRemaining(0);
        return;
      }
      const remainingMs = current.lockedUntil - Date.now();
      if (remainingMs <= 0) {
        setCooldownRemaining(0);
        saveConfig({ ...current, lockedUntil: null, failedAttempts: 0 });
      } else {
        setCooldownRemaining(Math.ceil(remainingMs / 1000));
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [config.lockedUntil, saveConfig]);

  const isConfigured = Boolean(config.isEnabled && config.pinHash);

  // Lock the application immediately
  const lockApp = useCallback(() => {
    const current = configRef.current;
    if (current.isEnabled && current.pinHash) {
      setIsLocked(true);
    }
  }, []);

  // Unlock application with entered PIN
  const unlockApp = useCallback(
    async (enteredPin: string): Promise<PinUnlockResult> => {
      const current = configRef.current;
      if (!current.isEnabled || !current.pinHash) {
        setIsLocked(false);
        return { success: true };
      }

      // Check brute force cooldown
      if (current.lockedUntil && current.lockedUntil > Date.now()) {
        const remaining = Math.ceil((current.lockedUntil - Date.now()) / 1000);
        return {
          success: false,
          error: `Keypad locked due to too many failed attempts. Try again in ${remaining}s.`,
          cooldownSeconds: remaining
        };
      }

      const isMatch = await verifyHashWithSalt(enteredPin, current.salt, current.pinHash);

      if (isMatch) {
        const updatedConfig: PinLockConfig = {
          ...current,
          failedAttempts: 0,
          lockedUntil: null
        };
        saveConfig(updatedConfig);
        setIsLocked(false);
        soundManager.playSuccess();
        haptics.success();
        return { success: true };
      }

      // Failed attempt handling
      const nextFailed = current.failedAttempts + 1;
      soundManager.playError();
      haptics.error();

      if (nextFailed >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = Date.now() + COOLDOWN_DURATION_MS;
        const updatedConfig: PinLockConfig = {
          ...current,
          failedAttempts: nextFailed,
          lockedUntil
        };
        saveConfig(updatedConfig);
        setCooldownRemaining(30);
        return {
          success: false,
          error: 'Too many incorrect attempts. Keypad locked for 30 seconds.',
          remainingAttempts: 0,
          cooldownSeconds: 30
        };
      }

      const remainingAttempts = MAX_FAILED_ATTEMPTS - nextFailed;
      saveConfig({ ...current, failedAttempts: nextFailed });
      return {
        success: false,
        error: `Incorrect PIN. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
        remainingAttempts
      };
    },
    [saveConfig]
  );

  // Enable and set a new PIN
  const enablePin = useCallback(
    async (
      pin: string,
      length: PinLength,
      securityQuestion: string,
      securityAnswer: string,
      options?: Partial<PinLockConfig>
    ): Promise<boolean> => {
      try {
        const salt = generateSalt();
        const pinHash = await hashWithSalt(pin, salt);

        const answerSalt = generateSalt();
        const securityAnswerHash = await hashSecurityAnswer(securityAnswer, answerSalt);

        const newConfig: PinLockConfig = {
          ...config,
          ...options,
          isEnabled: true,
          pinLength: length,
          pinHash,
          salt,
          securityQuestion,
          securityAnswerHash,
          answerSalt,
          failedAttempts: 0,
          lockedUntil: null
        };

        saveConfig(newConfig);
        setIsLocked(false);
        soundManager.playSuccess();
        haptics.success();
        return true;
      } catch (e) {
        console.error('[PinLock] Error enabling PIN:', e);
        return false;
      }
    },
    [config, saveConfig]
  );

  // Disable PIN Lock
  const disablePin = useCallback(
    async (currentPin: string): Promise<boolean> => {
      const isMatch = await verifyHashWithSalt(currentPin, config.salt, config.pinHash);
      if (!isMatch) {
        soundManager.playError();
        haptics.error();
        return false;
      }

      const updated: PinLockConfig = {
        ...DEFAULT_PIN_CONFIG,
        isEnabled: false
      };
      saveConfig(updated);
      setIsLocked(false);
      soundManager.playSuccess();
      haptics.success();
      return true;
    },
    [config, saveConfig]
  );

  // Change existing PIN
  const changePin = useCallback(
    async (currentPin: string, newPin: string): Promise<boolean> => {
      const isMatch = await verifyHashWithSalt(currentPin, config.salt, config.pinHash);
      if (!isMatch) {
        soundManager.playError();
        haptics.error();
        return false;
      }

      const newSalt = generateSalt();
      const newHash = await hashWithSalt(newPin, newSalt);

      const updated: PinLockConfig = {
        ...config,
        pinHash: newHash,
        salt: newSalt,
        failedAttempts: 0,
        lockedUntil: null
      };
      saveConfig(updated);
      soundManager.playSuccess();
      haptics.success();
      return true;
    },
    [config, saveConfig]
  );

  // Reset PIN using Security Recovery Question & Answer
  const resetPinWithRecovery = useCallback(
    async (securityAnswer: string, newPin: string): Promise<boolean> => {
      const isAnswerValid = await verifySecurityAnswer(
        securityAnswer,
        config.answerSalt,
        config.securityAnswerHash
      );

      if (!isAnswerValid) {
        soundManager.playError();
        haptics.error();
        return false;
      }

      const newSalt = generateSalt();
      const newHash = await hashWithSalt(newPin, newSalt);

      const updated: PinLockConfig = {
        ...config,
        pinHash: newHash,
        salt: newSalt,
        failedAttempts: 0,
        lockedUntil: null
      };
      saveConfig(updated);
      setIsLocked(false);
      soundManager.playSuccess();
      haptics.success();
      return true;
    },
    [config, saveConfig]
  );

  // Update specific configuration options (e.g. timeout, tab switch)
  const updateConfig = useCallback(
    (partial: Partial<PinLockConfig>) => {
      saveConfig({ ...config, ...partial });
    },
    [config, saveConfig]
  );

  const value = useMemo<PinLockContextType>(
    () => ({
      config,
      isLocked,
      isConfigured,
      cooldownRemaining,
      unlockApp,
      lockApp,
      enablePin,
      disablePin,
      changePin,
      resetPinWithRecovery,
      updateConfig
    }),
    [
      config,
      isLocked,
      isConfigured,
      cooldownRemaining,
      unlockApp,
      lockApp,
      enablePin,
      disablePin,
      changePin,
      resetPinWithRecovery,
      updateConfig
    ]
  );

  return <PinLockContext.Provider value={value}>{children}</PinLockContext.Provider>;
};

export const usePinLock = (): PinLockContextType => {
  const context = useContext(PinLockContext);
  if (!context) {
    throw new Error('usePinLock must be used within a PinLockProvider');
  }
  return context;
};
