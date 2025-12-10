'use client';
import React, { createContext, useContext, ReactNode } from 'react';
import { useHiveKeychain } from '@/hooks/useHiveKeychain';
import { KeychainSDK } from 'keychain-sdk';

interface KeychainContextType {
  user: string | null;
  isLoggedIn: boolean;
  isKeychainInstalled: boolean;
  login: (username: string) => Promise<boolean>;
  logout: () => void;
  getKeychain: () => KeychainSDK;
}

const KeychainContext = createContext<KeychainContextType | undefined>(undefined);

export function KeychainProvider({ children }: { children: ReactNode }) {
  const keychainState = useHiveKeychain();

  return (
    <KeychainContext.Provider value={keychainState}>
      {children}
    </KeychainContext.Provider>
  );
}

export function useKeychain() {
  const context = useContext(KeychainContext);
  if (context === undefined) {
    throw new Error('useKeychain must be used within a KeychainProvider');
  }
  return context;
}
