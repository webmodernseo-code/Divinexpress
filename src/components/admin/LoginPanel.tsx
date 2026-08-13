'use client';

/* eslint-disable @next/next/no-img-element */

import { useActionState, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import type { LoginState } from '@/app/[locale]/(auth)/connexion/actions';

export function LoginPanel({ locale, action }: {
  locale: 'fr' | 'en';
  action: (state: LoginState, formData: FormData) => Promise<LoginState>;
}) {
  const fr = locale === 'fr';
  const [show, setShow] = useState(false);
  const [state, formAction, pending] = useActionState(action, { error: '' });

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Editorial left panel */}
      <section className="relative hidden w-1/2 overflow-hidden bg-slate-950 text-white lg:block">
        <img src="/image/reign-admin-hoodie.png" alt="Hoodie noir DivinExpress suspendu" className="absolute inset-0 h-full w-full object-cover object-center opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-slate-900/30 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-14">
          <div className="flex items-center gap-2.5">
            <p className="font-serif text-[44px] tracking-[.16em]">DIVINEXPRESS</p>
            <span className="rounded-md bg-white/10 border border-white/20 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white uppercase">
              Admin
            </span>
          </div>
          <div className="max-w-xl pb-14">
            <p className="text-xs font-bold tracking-[.3em] text-indigo-400">DIVINEXPRESS BACK OFFICE</p>
            <h1 className="mt-6 font-serif text-6xl leading-[1.08]">
              Pilotez votre boutique<br />avec précision.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-300">
              Produits, commandes, retours et conversations clients réunis dans un seul espace sécurisé.
            </p>
            <p className="mt-10 flex items-center gap-4 text-sm font-semibold text-slate-200">
              <ShieldCheck className="size-7 text-indigo-400" />
              Accès réservé aux membres autorisés.
            </p>
          </div>
        </div>
      </section>

      {/* Login panel Form */}
      <section className="relative flex min-h-screen flex-1 items-center justify-center px-6 py-12">
        <a href={fr ? '/en/connexion' : '/fr/connexion'} className="absolute right-7 top-6 text-sm font-bold text-slate-500 hover:text-slate-800">
          {fr ? 'EN' : 'FR'}
        </a>
        <div className="w-full max-w-[500px]">
          <div className="text-center">
            {/* Real Logo in login panel */}
            <div className="flex justify-center mb-6">
              <Image
                src="/branding/logo-reign.png"
                alt="DivinExpress"
                width={120}
                height={42}
                priority
                className="h-9 w-auto"
              />
            </div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
              {fr ? 'Connexion' : 'Sign in'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {fr ? "Accédez à votre espace d’administration." : 'Access your administration space.'}
            </p>
          </div>

          <form action={formAction} className="mt-10 space-y-5" noValidate>
            {state.error && (
              <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50/80 p-3.5 text-xs font-semibold text-rose-700">
                {state.error}
              </p>
            )}
            
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {fr ? 'Identifiant' : 'Username'}
              </span>
              <span className="flex h-14 items-center gap-3.5 rounded-xl border border-slate-200 bg-white px-4.5 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100/30 transition-all duration-200 shadow-sm">
                <UserRound className="size-5 text-slate-400 stroke-[1.8]" />
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                  placeholder={fr ? "Email ou nom d’utilisateur" : 'Email or username'}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {fr ? 'Mot de passe' : 'Password'}
              </span>
              <span className="flex h-14 items-center gap-3.5 rounded-xl border border-slate-200 bg-white px-4.5 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100/30 transition-all duration-200 shadow-sm">
                <LockKeyhole className="size-5 text-slate-400 stroke-[1.8]" />
                <input
                  aria-label={fr ? 'Mot de passe' : 'Password'}
                  name="password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                  placeholder="••••••••••••"
                />
                <button type="button" aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} onClick={() => setShow(!show)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </span>
            </label>

            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input name="remember" type="checkbox" className="size-4 rounded border-slate-300 accent-indigo-600 focus:ring-indigo-500/20" />
                {fr ? 'Se souvenir de moi' : 'Remember me'}
              </label>
              <a href="#forgot" className="hover:text-indigo-600 transition-colors">
                {fr ? 'Mot de passe oublié ?' : 'Forgot password?'}
              </a>
            </div>

            <button
              disabled={pending}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/10 active:scale-[0.98] font-bold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {pending ? (fr ? 'CONNEXION...' : 'SIGNING IN...') : (fr ? 'SE CONNECTER' : 'SIGN IN')}
              <ArrowRight className="size-4" />
            </button>
          </form>

          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400 font-semibold">
            <LockKeyhole className="size-3.5 text-slate-400" />
            {fr ? 'Connexion sécurisée et chiffrée.' : 'Secure encrypted connection.'}
          </p>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-xs font-semibold text-slate-600">
              <b>{fr ? "Besoin d’aide ?" : 'Need help?'}</b>
              <a href="mailto:support@divinexpress.fr" className="ml-4 text-indigo-600 hover:text-indigo-700 transition-colors">
                {fr ? "Contacter l’administrateur" : 'Contact administrator'}
              </a>
            </p>
            <div className="mt-4 flex gap-3.5 rounded-2xl border border-indigo-150/40 bg-indigo-50/30 p-4 text-[12px] text-indigo-800 leading-relaxed font-semibold">
              <ShieldCheck className="size-5 shrink-0 text-indigo-600 mt-0.5" />
              <p>{fr ? "L’authentification à deux facteurs (2FA) peut être requise après la saisie de vos identifiants." : 'Two-factor authentication (2FA) may be required after sign in.'}</p>
            </div>
          </div>

          <footer className="mt-10 flex justify-between text-[11px] text-slate-400 font-bold">
            <span>© 2026 DivinExpress</span>
            <span className="flex gap-4">
              <a href={`/${locale}/confidentialite`} className="hover:text-slate-600 transition-colors">Confidentialité</a>
              <a href={`/${locale}/mentions-legales`} className="hover:text-slate-600 transition-colors">Sécurité</a>
            </span>
          </footer>
        </div>
      </section>
    </div>
  );
}
