'use client';

import { useState, useEffect } from 'react';
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

interface CustomerRaw {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: string;
  orderCount: number;
  totalSpentMinor: number;
}

const INITIAL_CLIENTS: ClientItem[] = [];

export default function ClientsPage() {
  const systemLocale = useLocale() as 'fr' | 'en';
  const [clients, setClients] = useState<ClientItem[]>(INITIAL_CLIENTS);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/customers')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        const mapped = (data as CustomerRaw[]).map((c) => {
          const joinedDate = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(c.createdAt));
          const totalSpentFormatted = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(c.totalSpentMinor / 100);
          return {
            id: c.id.slice(0, 8).toUpperCase(),
            name: [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Client invité',
            email: c.email || '',
            phone: c.phone || '',
            country: 'France',
            totalOrders: c.orderCount || 0,
            totalSpent: totalSpentFormatted,
            joined: joinedDate,
          };
        });
        setClients(mapped);
      })
      .catch(() => undefined);
  }, []);

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
