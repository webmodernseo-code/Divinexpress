'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { validateContactForm, type ContactFormValues, type ContactFormErrors } from '@/lib/contactValidation';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Button } from '@/components/ui/Button';

const EMPTY_VALUES: ContactFormValues = { name: '', email: '', message: '' };

export default function ContactPage() {
  const t = useTranslations('contact');
  const [values, setValues] = useState<ContactFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleChange(field: keyof ContactFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateContactForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitted(true);
    }
  }

  if (isSubmitted) {
    return (
      <Container className="max-w-xl py-12 text-center">
        <Heading level={1}>{t('title')}</Heading>
        <p className="mt-4 text-sm text-mist-600">{t('success')}</p>
      </Container>
    );
  }

  return (
    <Container className="max-w-xl py-12">
      <Heading level={1}>{t('title')}</Heading>
      <p className="mt-2 text-sm text-mist-600">{t('intro')}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className="mb-2 block text-xs font-bold tracking-wide">
            {t('fields.name')}
          </label>
          <input
            id="name"
            type="text"
            value={values.name}
            onChange={(event) => handleChange('name', event.target.value)}
            className="block w-full rounded-2xl border border-mist-100 bg-paper px-4 py-3.5 text-sm transition-colors focus:border-accent focus:outline-none"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="mt-1.5 text-xs text-accent">
              {t(`errors.${errors.name}`)}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-xs font-bold tracking-wide">
            {t('fields.email')}
          </label>
          <input
            id="email"
            type="email"
            value={values.email}
            onChange={(event) => handleChange('email', event.target.value)}
            className="block w-full rounded-2xl border border-mist-100 bg-paper px-4 py-3.5 text-sm transition-colors focus:border-accent focus:outline-none"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1.5 text-xs text-accent">
              {t(`errors.${errors.email}`)}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="message" className="mb-2 block text-xs font-bold tracking-wide">
            {t('fields.message')}
          </label>
          <textarea
            id="message"
            rows={5}
            value={values.message}
            onChange={(event) => handleChange('message', event.target.value)}
            className="block w-full rounded-2xl border border-mist-100 bg-paper px-4 py-3.5 text-sm transition-colors focus:border-accent focus:outline-none"
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? 'message-error' : undefined}
          />
          {errors.message && (
            <p id="message-error" className="mt-1.5 text-xs text-accent">
              {t(`errors.${errors.message}`)}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full rounded-2xl">
          {t('submit')}
        </Button>
      </form>
    </Container>
  );
}
