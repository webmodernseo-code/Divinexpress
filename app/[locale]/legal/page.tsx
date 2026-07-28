import Link from 'next/link';
import React from 'react';

export default function LegalPage() {
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
        <h1>Mentions Légales</h1>
        <div className="last-update">Dernière mise à jour : <span className="placeholder-box">28 Juillet 2026</span></div>

        <section>
          <p>Conformément aux dispositions de la législation en vigueur, nous portons à la connaissance des utilisateurs et visiteurs du site DivinExpress les informations suivantes pour l'édition et l'hébergement du site.</p>

          <h2>1. Éditeur du Site</h2>
          <p>Le site internet DivinExpress est édité et exploité par :</p>
          <ul>
            <li><strong>Forme juridique :</strong> SAS</li>
            <li><strong>Raison sociale / Nom :</strong> DivinExpress SAS</li>
            <li><strong>Siège social :</strong> Abidjan, Côte d’Ivoire</li>
            <li><strong>Capital social :</strong> 1 000 000 FCFA</li>
            <li><strong>Immatriculation (RCS) :</strong> Registre du commerce d'Abidjan</li>
            <li><strong>Numéro de TVA intracommunautaire :</strong> Non applicable</li>
            <li><strong>Directeur de la publication :</strong> Directeur DivinExpress</li>
            <li><strong>Contact email :</strong> contact@divinexpress.com</li>
          </ul>

          <h2>2. Hébergeur du Site</h2>
          <p>Le site est hébergé par :</p>
          <ul>
            <li><strong>Nom de l'hébergeur :</strong> Vercel Inc.</li>
            <li><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</li>
            <li><strong>Site internet :</strong> vercel.com</li>
            <li><strong>Contact hébergeur :</strong> support@vercel.com</li>
          </ul>

          <h2>3. Propriété Intellectuelle</h2>
          <p>L'ensemble des contenus de ce site (textes, images, photographies, logos, graphismes, icônes) sont la propriété exclusive de DivinExpress ou de leurs auteurs respectifs.</p>
          <p>Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de DivinExpress.</p>
          <p>Toute exploitation non autorisée du site ou de l'un quelconque des éléments qu'il contient sera considérée comme constitutive d'une contrefaçon et poursuivie conformément aux dispositions légales en vigueur.</p>

          <h2>4. Limitation de Responsabilité</h2>
          <p>L'éditeur s'efforce d'assurer au mieux de ses possibilités l'exactitude et la mise à jour des informations diffusées sur le site. Toutefois, il ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition.</p>
          <p>En conséquence, l'éditeur décline toute responsabilité pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur le site, ainsi que pour tout dommage résultant d'une intrusion frauduleuse d'un tiers ayant entraîné une modification des informations.</p>

          <h2>5. Droit Applicable</h2>
          <p>Les présentes mentions légales sont régies par le droit national. Tout litige relatif à l'utilisation du site DivinExpress sera soumis à la juridiction exclusive des tribunaux compétents.</p>
        </section>
      </main>

      <footer>
        <p>&copy; 2026 DivinExpress. Tous droits réservés.</p>
      </footer>
    </>
  );
}
