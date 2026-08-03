'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Search } from 'lucide-react';

type ClientItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  totalOrders: number;
  totalSpent: string;
  joined: string;
};

const INITIAL_CLIENTS: ClientItem[] = [
  { id: 'CUST-001', name: 'Alice Martin', email: 'alice.martin@email.com', phone: '+33 6 12 34 56 78', country: 'France', totalOrders: 3, totalSpent: '272,00 €', joined: 'Mai 2025' },
  { id: 'CUST-002', name: 'Lucas Bernard', email: 'lucas.bernard@email.com', phone: '+33 6 98 76 54 32', country: 'France', totalOrders: 1, totalSpent: '89,90 €', joined: 'Juin 2025' },
  { id: 'CUST-003', name: 'Chloé Dubois', email: 'chloe.dubois@email.com', phone: '+33 7 45 67 89 01', country: 'Belgique', totalOrders: 2, totalSpent: '162,50 €', joined: 'Mai 2025' },
  { id: 'CUST-004', name: 'Thomas Leroy', email: 'thomas.leroy@email.com', phone: '+33 6 32 14 58 79', country: 'France', totalOrders: 1, totalSpent: '49,00 €', joined: 'Avril 2025' }
];

export default function ClientsPage() {
  const systemLocale = useLocale() as 'fr' | 'en';
  const [clients] = useState<ClientItem[]>(INITIAL_CLIENTS);
  const [search, setSearch] = useState('');

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in text-admin-text font-sans">
      
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          {systemLocale === 'fr' ? 'Clients' : 'Customers'}
        </h1>
        <p className="text-sm text-admin-muted mt-1.5">
          {systemLocale === 'fr' 
            ? 'Consultez la liste des clients de votre boutique Reign.' 
            : 'View the list of customers of your Reign boutique.'}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-admin-border p-4 rounded-2xl shadow-xs">
        <div className="relative max-w-xs">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={systemLocale === 'fr' ? 'Rechercher un client...' : 'Search customer...'}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-admin-border text-xs outline-none focus:border-black transition"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-admin-muted" />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white border border-admin-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-admin-border bg-admin-ivory/30 text-admin-muted font-semibold">
                <th className="p-4">{systemLocale === 'fr' ? 'Nom' : 'Name'}</th>
                <th className="p-4">{systemLocale === 'fr' ? 'Email' : 'Email'}</th>
                <th className="p-4">{systemLocale === 'fr' ? 'Téléphone' : 'Phone'}</th>
                <th className="p-4">{systemLocale === 'fr' ? 'Pays' : 'Country'}</th>
                <th className="p-4 text-center">{systemLocale === 'fr' ? 'Commandes' : 'Orders'}</th>
                <th className="p-4">{systemLocale === 'fr' ? 'Total dépensé' : 'Total spent'}</th>
                <th className="p-4">{systemLocale === 'fr' ? 'Inscrit' : 'Joined'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border/50 font-medium">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-neutral-50/50 transition">
                  <td className="p-4 text-black font-semibold">{client.name}</td>
                  <td className="p-4 text-admin-muted">{client.email}</td>
                  <td className="p-4">{client.phone}</td>
                  <td className="p-4">{client.country}</td>
                  <td className="p-4 text-center font-bold text-black">{client.totalOrders}</td>
                  <td className="p-4 text-black font-semibold">{client.totalSpent}</td>
                  <td className="p-4 text-admin-muted">{client.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
