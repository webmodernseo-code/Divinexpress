import Link from 'next/link';
import React from 'react';

export default function PrivacyPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --bg-primary: #ffffff;
          --text-primary: #18181b;
          --text-secondary: #71717a;
          --accent-light: #f4f4f5;
          --border-color: #e4e4e7;
        }

        body {
          margin: 0;
          padding: 0;
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
          line-height: 1.6;
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
        }

        .logo {
          font-size: 1.2rem;
          font-weight: 800;
          letter-spacing: 3px;
          color: var(--text-primary);
          text-decoration: none;
        }

        .btn-back {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          text-decoration: none;
          transition: color 0.2s;
        }

        .btn-back:hover {
          color: var(--text-primary);
        }

        .container {
          max-width: 800px;
          margin: 60px auto;
          padding: 0 24px;
        }

        h1 {
          font-size: 2.2rem;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .last-update {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 40px;
        }

        h2 {
          font-size: 1.4rem;
          font-weight: 700;
          margin-top: 32px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 8px;
        }

        p, li {
          font-size: 0.95rem;
          color: #3f3f46;
          margin-bottom: 16px;
        }

        ul {
          padding-left: 20px;
          margin-bottom: 24px;
        }

        .placeholder-box {
          background-color: #fffbeb;
          border: 1px solid #fef3c7;
          padding: 2px 6px;
          border-radius: 4px;
          color: #b45309;
          font-weight: 600;
          font-family: monospace;
          font-size: 0.9rem;
        }

        footer {
          background: #111111;
          color: #ffffff;
          padding: 30px 24px;
          text-align: center;
          margin-top: 80px;
          border-top: 1px solid #222222;
        }

        footer p {
          font-size: 0.72rem;
          color: #71717a;
          margin: 0;
        }
      `}} />
      <header>
        <Link href="/" className="btn-back">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 18, height: 18, strokeWidth: 2.5 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </Link>
        <Link href="/" className="logo">DivinExpress</Link>
        <div style={{ width: 60 }}></div>
      </header>

      <main className="container">
        <h1>Politique de Confidentialité</h1>
        <div className="last-update">Dernière mise à jour : <span className="placeholder-box">28 Juillet 2026</span></div>

        <section>
          <p>La protection de vos données personnelles est au cœur des engagements de DivinExpress. Cette Politique de Confidentialité décrit comment vos données personnelles sont collectées, utilisées et protégées lorsque vous visitez le site ou effectuez un achat.</p>

          <h2>1. Données Personnelles Collectées</h2>
          <p>Nous collectons les types d'informations suivantes :</p>
          <ul>
            <li><strong>Données d'identification :</strong> Nom et prénom.</li>
            <li><strong>Données de contact :</strong> Adresse e-mail, numéro de téléphone, adresse complète de livraison et de facturation.</li>
            <li><strong>Données de transaction :</strong> Détails des produits commandés, mode de paiement choisi (Orange Money, MTN MoMo, Wave, carte bancaire).</li>
          </ul>

          <h2>2. Utilisation de vos Données (Finalités)</h2>
          <p>Vos données sont traitées pour les finalités suivantes :</p>
          <ul>
            <li>Gestion et livraison de vos commandes.</li>
            <li>Traitement et sécurisation des transactions financières.</li>
            <li>Suivi client et notifications en temps réel du statut du colis.</li>
          </ul>

          <h2>3. Partage des Données avec des Tiers</h2>
          <p>DivinExpress ne vend ni ne loue vos données personnelles à des tiers.</p>
          <p>Pour assurer la livraison de vos colis et le traitement des paiements, nous partageons vos informations avec des prestataires de confiance qualifiés :</p>
          <ul>
            <li><strong>Les transporteurs :</strong> Pour acheminer et livrer votre commande à l'adresse indiquée.</li>
            <li><strong>Les passerelles de paiement sécurisé :</strong> Pour valider et finaliser les paiements mobiles (Orange Money, MoMo, Wave) et bancaires.</li>
          </ul>

          <h2>4. Durée de Conservation des Données</h2>
          <p>Vos données d'identification et de livraison sont conservées pendant toute la durée de la relation commerciale, plus les durées de prescription légales requises (notamment pour des obligations comptables et fiscales).</p>

          <h2>5. Vos Droits</h2>
          <p>Conformément aux réglementations sur la protection des données personnelles (ex: RGPD), vous disposez des droits suivants :</p>
          <ul>
            <li><strong>Droit d'accès :</strong> Obtenir des informations sur la collecte et l'utilisation de vos données.</li>
            <li><strong>Droit de rectification :</strong> Demander la correction d'informations inexactes.</li>
            <li><strong>Droit d'effacement ("Droit à l'oubli") :</strong> Demander la suppression définitive de vos données personnelles sous réserve des contraintes légales.</li>
          </ul>
        </section>
      </main>

      <footer>
        <p>&copy; 2026 DivinExpress. Tous droits réservés.</p>
      </footer>
    </>
  );
}
