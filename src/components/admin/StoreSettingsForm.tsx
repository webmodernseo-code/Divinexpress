'use client';

import { useEffect, useMemo, useState } from 'react';
import type { StoreSettings } from '@/server/settings/store-settings';

type Tab = 'general' | 'livraison' | 'paiements' | 'securite';
type Locale = 'fr' | 'en';

type PaymentStatus = {
  europe: string;
  africa: string;
};

export function StoreSettingsForm({
  initialSettings,
  locale,
  save,
}: {
  initialSettings: StoreSettings;
  locale: Locale;
  save: (settings: StoreSettings) => Promise<StoreSettings>;
}) {
  const fr = locale === 'fr';
  const [tab, setTab] = useState<Tab>('general');
  const [serverSettings, setServerSettings] = useState(initialSettings);
  const [draft, setDraft] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ europe: 'loading', africa: 'loading' });
  const [security, setSecurity] = useState({ email: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [securityPending, setSecurityPending] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const dirty = useMemo(() => JSON.stringify(serverSettings) !== JSON.stringify(draft), [serverSettings, draft]);

  useEffect(() => {
    Promise.all((['europe', 'africa'] as const).map(async (region) => {
      const response = await fetch(`/api/checkout?region=${region}`);
      if (!response.ok) throw new Error('PAYMENT_STATUS_FAILED');
      return [region, await response.json()] as const;
    })).then((entries) => {
      const next = { europe: 'unavailable', africa: 'unavailable' };
      for (const [region, payload] of entries) {
        const provider = region === 'europe' ? payload.methods?.stripe : payload.methods?.genius;
        next[region] = provider?.status ?? 'unavailable';
      }
      setPaymentStatus(next);
    }).catch(() => setPaymentStatus({ europe: 'unknown', africa: 'unknown' }));
  }, []);

  useEffect(() => {
    fetch('/api/admin/security')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload: { email: string }) => setSecurity((current) => ({ ...current, email: payload.email })))
      .catch(() => undefined);
  }, []);

  const update = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const persisted = await save(draft);
      setDraft(persisted);
      setServerSettings(persisted);
      setMessage({ type: 'success', text: fr ? 'Modifications enregistrées.' : 'Changes saved.' });
    } catch {
      setMessage({ type: 'error', text: fr ? 'Impossible d’enregistrer les modifications.' : 'Unable to save changes.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSecuritySave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSecurityError('');
    if (security.newPassword !== security.confirmPassword) {
      setSecurityError(fr ? 'Les nouveaux mots de passe ne correspondent pas.' : 'New passwords do not match.');
      return;
    }
    setSecurityPending(true);
    try {
      const response = await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(security),
      });
      if (!response.ok) throw new Error('SECURITY_UPDATE_FAILED');
      window.location.assign(`/${locale}/connexion?credentials=updated`);
    } catch {
      setSecurityError(fr ? 'Impossible de modifier les identifiants.' : 'Unable to update credentials.');
    } finally {
      setSecurityPending(false);
    }
  };

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'general', label: fr ? 'Général' : 'General' },
    { id: 'livraison', label: fr ? 'Livraison' : 'Shipping' },
    { id: 'paiements', label: fr ? 'Paiements' : 'Payments' },
    { id: 'securite', label: fr ? 'Sécurité' : 'Security' },
  ];

  const inputClass = 'mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/40 px-4 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50';
  const cardClass = 'rounded-2xl border border-admin-border bg-white p-6 shadow-xs';

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-admin-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">{fr ? 'Paramètres' : 'Settings'}</h1>
          <p className="mt-1 text-xs text-admin-muted">{fr ? 'Configurez les fonctions actives de votre boutique.' : 'Configure your active store features.'}</p>
        </div>
        {tab !== 'securite' && (
          <div className="flex items-center gap-2">
            <button type="button" disabled={!dirty || saving} onClick={() => { setDraft(serverSettings); setMessage(null); }} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold disabled:opacity-40">
              {fr ? 'Annuler' : 'Cancel'}
            </button>
            <button type="button" disabled={!dirty || saving} onClick={() => void handleSave()} className="h-10 rounded-xl bg-black px-5 text-xs font-bold text-white disabled:opacity-40">
              {saving ? (fr ? 'Enregistrement…' : 'Saving…') : (fr ? 'Enregistrer' : 'Save')}
            </button>
          </div>
        )}
      </header>

      {message && <p role={message.type === 'error' ? 'alert' : 'status'} className={message.type === 'error' ? 'text-sm font-semibold text-red-700' : 'text-sm font-semibold text-green-700'}>{message.text}</p>}

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label={fr ? 'Sections des paramètres' : 'Settings sections'} className="flex gap-2 overflow-x-auto lg:flex-col">
          {tabs.map((item) => (
            <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`min-h-11 whitespace-nowrap rounded-xl px-4 text-left text-xs font-bold ${tab === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              {item.label}
            </button>
          ))}
        </nav>

        {tab === 'general' && (
          <section className={`${cardClass} grid gap-5 md:grid-cols-2`}>
            <Field label={fr ? 'Nom de la boutique' : 'Store name'}><input aria-label={fr ? 'Nom de la boutique' : 'Store name'} className={inputClass} value={draft.shop_name} onChange={(event) => update('shop_name', event.target.value)} /></Field>
            <Field label={fr ? 'E-mail public' : 'Public email'}><input type="email" className={inputClass} value={draft.email} onChange={(event) => update('email', event.target.value)} /></Field>
            <Field label={fr ? 'Téléphone public' : 'Public phone'}><input className={inputClass} value={draft.phone} onChange={(event) => update('phone', event.target.value)} /></Field>
            <Field label={fr ? 'Adresse' : 'Address'}><input className={inputClass} value={draft.address} onChange={(event) => update('address', event.target.value)} /></Field>
            <Field label={fr ? 'Pays' : 'Country'}><input className={inputClass} value={draft.country} onChange={(event) => update('country', event.target.value)} /></Field>
            <Field label={fr ? 'Devise par défaut' : 'Default currency'}><select className={inputClass} value={draft.currency} onChange={(event) => update('currency', event.target.value as StoreSettings['currency'])}><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option></select></Field>
            <Field label={fr ? 'Fuseau horaire' : 'Timezone'}><select className={inputClass} value={draft.timezone} onChange={(event) => update('timezone', event.target.value as StoreSettings['timezone'])}><option value="Europe/Paris">Europe/Paris</option><option value="Europe/London">Europe/London</option></select></Field>
            <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 text-sm font-bold">
              <span>{fr ? 'Boutique ouverte' : 'Store open'}</span>
              <input type="checkbox" checked={draft.shop_enabled} onChange={(event) => update('shop_enabled', event.target.checked)} className="size-5 accent-indigo-600" />
            </label>
          </section>
        )}

        {tab === 'livraison' && (
          <section className={`${cardClass} grid gap-5 md:grid-cols-2`}>
            <Field label={fr ? 'Livraison gratuite à partir de' : 'Free shipping threshold'}><input type="number" min="0" step="0.01" className={inputClass} value={(draft.free_shipping_threshold_minor / 100).toFixed(2)} onChange={(event) => update('free_shipping_threshold_minor', Math.max(0, Math.round(Number(event.target.value) * 100)))} /></Field>
            <Field label={fr ? 'Délai de retour' : 'Return period'}><select className={inputClass} value={draft.return_period_days} onChange={(event) => update('return_period_days', Number(event.target.value) as StoreSettings['return_period_days'])}><option value={14}>14 jours</option><option value={30}>30 jours</option><option value={60}>60 jours</option></select></Field>
          </section>
        )}

        {tab === 'paiements' && (
          <section className="grid gap-5 md:grid-cols-2">
            {(['europe', 'africa'] as const).map((region) => {
              const key = region === 'europe' ? 'payment_europe_enabled' : 'payment_africa_enabled';
              return <article key={region} className={cardClass}><div className="flex items-center justify-between gap-4"><div><h2 className="font-serif text-xl font-bold">{region === 'europe' ? 'Europe' : 'Afrique'}</h2><p className="mt-2 text-xs text-admin-muted">{paymentStatus[region]}</p></div><input aria-label={region === 'europe' ? 'Europe' : 'Afrique'} type="checkbox" checked={draft[key]} onChange={(event) => update(key, event.target.checked)} className="size-5 accent-indigo-600" /></div></article>;
            })}
          </section>
        )}

        {tab === 'securite' && (
          <form onSubmit={handleSecuritySave} className={`${cardClass} max-w-2xl space-y-5`}>
            <h2 className="font-serif text-xl font-bold">{fr ? 'Identifiants administrateur' : 'Administrator credentials'}</h2>
            <Field label={fr ? 'E-mail de connexion' : 'Sign-in email'}><input type="email" required className={inputClass} value={security.email} onChange={(event) => setSecurity((current) => ({ ...current, email: event.target.value }))} /></Field>
            <Field label={fr ? 'Mot de passe actuel' : 'Current password'}><input type="password" required minLength={8} className={inputClass} value={security.currentPassword} onChange={(event) => setSecurity((current) => ({ ...current, currentPassword: event.target.value }))} /></Field>
            <Field label={fr ? 'Nouveau mot de passe' : 'New password'}><input type="password" minLength={12} className={inputClass} value={security.newPassword} onChange={(event) => setSecurity((current) => ({ ...current, newPassword: event.target.value }))} /></Field>
            <Field label={fr ? 'Confirmer le mot de passe' : 'Confirm password'}><input type="password" minLength={security.newPassword ? 12 : undefined} className={inputClass} value={security.confirmPassword} onChange={(event) => setSecurity((current) => ({ ...current, confirmPassword: event.target.value }))} /></Field>
            {securityError && <p role="alert" className="text-sm font-semibold text-red-700">{securityError}</p>}
            <button type="submit" disabled={securityPending} className="h-11 rounded-xl bg-black px-5 text-xs font-bold text-white disabled:opacity-40">{securityPending ? (fr ? 'Enregistrement…' : 'Saving…') : (fr ? 'Mettre à jour les identifiants' : 'Update credentials')}</button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-xs font-bold text-slate-700"><span>{label}</span>{children}</label>;
}
