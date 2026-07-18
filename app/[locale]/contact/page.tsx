'use client';

import { useState } from 'react';
import { useToast } from '@/components/Toast/ToastContext';
import styles from './page.module.css';

export default function ContactPage({ params }: { params: { locale: string } }) {
  const { showToast } = useToast();
  const locale = params.locale;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showToast(
        locale === 'fr' 
          ? 'Veuillez saisir votre adresse e-mail.' 
          : 'Please enter your email address.'
      );
      return;
    }

    // Success notification
    showToast(
      locale === 'fr'
        ? 'Message envoyé avec succès ! Nous vous répondrons sous 24h.'
        : 'Message sent successfully! We will get back to you within 24h.'
    );

    // Reset fields
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
  };

  return (
    <main className={styles.container}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <a href="/" className={styles.crumb}>
          {locale === 'fr' ? 'Accueil' : 'Home'}
        </a>
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbActive}>Contact</span>
      </nav>

      <section className={styles.contactSection}>
        <h1 className={styles.title}>Contact</h1>
        
        <div className={styles.headerBlock}>
          <h2 className={styles.subtitle}>
            {locale === 'fr' 
              ? 'Une question ? Un besoin ? Nous sommes là pour vous !' 
              : 'Any questions? Need help? We are here for you!'}
          </h2>
          <p className={styles.description}>
            {locale === 'fr'
              ? "Que vous ayez besoin d'informations supplémentaires sur un produit, d'aide pour finaliser une commande, ou de conseils après-vente, notre équipe est à votre écoute. N'hésitez pas à nous contacter pour toute question ou demande spécifique."
              : "Whether you need additional product details, help finalizing an order, or after-sales assistance, our team is ready to listen. Do not hesitate to contact us for any query or request."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={locale === 'fr' ? 'Nom' : 'Name'}
              className={styles.input}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={locale === 'fr' ? 'E-mail *' : 'Email *'}
              className={styles.input}
              required
            />
          </div>

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={locale === 'fr' ? 'Numéro de téléphone' : 'Phone number'}
            className={styles.input}
          />

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={locale === 'fr' ? 'Commentaire' : 'Comment'}
            rows={6}
            className={styles.textarea}
          />

          <div className={styles.pulseContainer}>
            <button type="submit" className={styles.submitBtn}>
              {locale === 'fr' ? 'Envoyer' : 'Send'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
