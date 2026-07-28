'use client';

import React, { useState } from 'react';
import { adminLogin } from '../actions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await adminLogin(formData);

    if (result.success) {
      window.location.href = '/admin/dashboard';
    } else {
      setError(result.error || 'Erreur d\'authentification');
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      padding: '24px'
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        border: '1px solid #334155'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '3px',
            margin: '0 0 8px 0',
            textTransform: 'uppercase'
          }}>
            DivinExpress
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
            Espace d'administration sécurisé
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '0.85rem',
            marginBottom: '24px',
            fontWeight: 500
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label htmlFor="email" style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#94a3b8',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              Adresse e-mail
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="admin@divinexpress.com"
              required
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '12px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                padding: '0 16px',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#94a3b8',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '12px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                padding: '0 16px',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              height: '48px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
