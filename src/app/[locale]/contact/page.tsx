'use client';

import { useStoreSettings } from '@/context/StoreSettingsContext';
import { ContactContent } from './ContactContent';

export default function ContactPage() {
  return <ContactContent settings={useStoreSettings()} />;
}
