import Link from 'next/link';
import React from 'react';

export default function TermsPage() {
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
        <h1>Conditions Générales de Vente (CGV)</h1>
        <div className="last-update">Dernière mise à jour : <span className="placeholder-box">28 Juillet 2026</span></div>

        <section>
          <p>Les présentes Conditions Générales de Vente (CGV) définissent les droits et obligations contractuelles de DivinExpress et de tout client effectuant un achat sur la boutique en ligne DivinExpress.</p>

          <h2>1. Objet et acceptation des CGV</h2>
          <p>Les CGV s'appliquent sans restriction ni réserve à l'ensemble des ventes de produits proposés sur le site internet. Le fait de passer commande implique l'adhésion entière, préalable et sans réserve du client aux présentes CGV.</p>

          <h2>2. Produits et Tarifs</h2>
          <ul>
            <li><strong>Fiches produits :</strong> Les produits proposés à la vente sont décrits avec la plus grande exactitude possible (titre, composition, prix, photos).</li>
            <li><strong>Tarifs :</strong> Les prix de nos produits sont indiqués sur le site en toutes taxes comprises (TTC), hors frais de livraison qui sont spécifiés lors de la validation du panier.</li>
          </ul>

          <h2>3. Processus de Commande</h2>
          <p>Pour passer commande, le client doit suivre les étapes suivantes :</p>
          <ul>
            <li>Sélectionner un ou plusieurs articles et les ajouter au panier.</li>
            <li>Renseigner ses coordonnées complètes de livraison.</li>
            <li>Choisir son mode de paiement (Orange Money, MTN Mobile Money, Wave, Visa, Mastercard).</li>
            <li>Valider la commande et procéder au paiement.</li>
          </ul>

          <h2>4. Conditions de Paiement</h2>
          <p>Le paiement est exigible immédiatement à la commande. Nous proposons les modes de paiement sécurisés suivants :</p>
          <ul>
            <li><strong>Paiement mobile (Afrique / Europe) :</strong> Orange Money, MTN Mobile Money (MoMo), Wave.</li>
            <li><strong>Carte Bancaire :</strong> Visa, Mastercard.</li>
          </ul>

          <h2>5. Livraison et Expédition</h2>
          <ul>
            <li><strong>Zones de livraison :</strong> Europe et Afrique (UEMOA).</li>
            <li><strong>Délais de livraison :</strong> Les délais indicatifs dépendent de la zone choisie (3 à 20 jours).</li>
          </ul>

          <h2>6. Droit de Rétractation et Retours</h2>
          <p>Conformément à la législation en vigueur, le client dispose d'un délai de <strong>14 jours</strong> à compter de la réception de son colis pour exercer son droit de rétractation.</p>
        </section>
      </main>

      <footer>
        <p>&copy; 2026 DivinExpress. Tous droits réservés.</p>
      </footer>
    </>
  );
}
