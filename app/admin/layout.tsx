import './admin.css';

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/images/logo-divinexpress.svg" type="image/svg+xml" />
      </head>
      <body style={{ backgroundColor: '#f8fafc', margin: 0, fontFamily: 'Inter, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
