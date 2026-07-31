import Link from 'next/link';

export default function GlobalNotFound() {
  return (
    <html lang="fr">
      <head>
        <title>404 — Page introuvable</title>
      </head>
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#FFFFFF', color: '#0D0D0D', textAlign: 'center', padding: '4rem 2rem' }}>
        <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0', fontWeight: 700 }}>404</h1>
        <p style={{ fontSize: '1rem', color: '#555555', margin: '0 0 2rem 0' }}>Page not found. / Page introuvable.</p>
        <Link href="/fr" style={{ display: 'inline-block', backgroundColor: '#0D0D0D', color: '#FFFFFF', padding: '0.75rem 1.5rem', textDecoration: 'none', fontSize: '0.875rem', letterSpacing: '0.05em', transition: 'background-color 0.2s' }}>
          Retour à l&apos;accueil / Home
        </Link>
      </body>
    </html>
  );
}
