'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { StoreSettingsForm } from '@/components/admin/StoreSettingsForm';
import type { StoreSettings } from '@/server/settings/store-settings';

export default function ParametresPage() {
  const locale = useLocale() === 'en' ? 'en' : 'fr';
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('SETTINGS_LOAD_FAILED');
      setSettings(await response.json() as StoreSettings);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = async (draft: StoreSettings) => {
    const response = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (!response.ok) throw new Error('SETTINGS_SAVE_FAILED');
    return await response.json() as StoreSettings;
  };

  if (status === 'loading') {
    return <p role="status" className="rounded-2xl border border-admin-border bg-white p-10 text-center text-sm font-semibold text-admin-muted">{locale === 'fr' ? 'Chargement des paramètres…' : 'Loading settings…'}</p>;
  }

  if (status === 'error' || !settings) {
    return <section role="alert" className="rounded-2xl border border-admin-border bg-white p-10 text-center"><h1 className="font-serif text-2xl font-bold">{locale === 'fr' ? 'Impossible de charger les paramètres' : 'Unable to load settings'}</h1><button type="button" onClick={() => void load()} className="mt-5 h-10 rounded-xl bg-black px-5 text-xs font-bold text-white">{locale === 'fr' ? 'Réessayer' : 'Try again'}</button></section>;
  }

  return <StoreSettingsForm initialSettings={settings} locale={locale} save={save} />;
}
