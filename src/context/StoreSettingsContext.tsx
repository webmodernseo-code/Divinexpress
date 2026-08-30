'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_STORE_SETTINGS, type PublicStoreSettings } from '@/server/settings/store-settings';

const StoreSettingsContext = createContext<PublicStoreSettings>(DEFAULT_STORE_SETTINGS);

export function StoreSettingsProvider({ settings, children }: { settings: PublicStoreSettings; children: ReactNode }) {
  return <StoreSettingsContext.Provider value={settings}>{children}</StoreSettingsContext.Provider>;
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
