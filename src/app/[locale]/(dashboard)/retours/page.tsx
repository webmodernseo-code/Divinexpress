'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { 
  Check, 
  X, 
  Search, 
  RotateCcw
} from 'lucide-react';

type ReturnItem = {
  id: string;
  orderId: string;
  customer: string;
  reason: string;
  reasonEn: string;
  status: 'pending' | 'accepted' | 'refused' | 'refunded';
  date: string;
};

const INITIAL_RETURNS: ReturnItem[] = [];

export default function RetoursPage() {
  const systemLocale = useLocale() as 'fr' | 'en';
  const [returns, setReturns] = useState<ReturnItem[]>(INITIAL_RETURNS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  interface ReturnRaw {
    id: string;
    orderNumber: string;
    customer: string;
    reason: string;
    status: 'requested' | 'approved' | 'rejected' | 'received' | 'refunded';
    createdAt: string;
  }

  const refreshReturns = () => {
    fetch('/api/admin/returns')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        const mapped = (data as ReturnRaw[]).map((r) => {
          let frontendStatus: ReturnItem['status'] = 'pending';
          if (r.status === 'approved') frontendStatus = 'accepted';
          if (r.status === 'rejected') frontendStatus = 'refused';
          if (r.status === 'refunded') frontendStatus = 'refunded';
          
          const returnDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(r.createdAt));
          
          return {
            id: r.id,
            orderId: r.orderNumber,
            customer: r.customer,
            reason: r.reason,
            reasonEn: r.reason,
            status: frontendStatus,
            date: returnDate,
          };
        });
        setReturns(mapped);
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    refreshReturns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredReturns = returns.filter((r) => {
    const matchesSearch = 
      r.customer.toLowerCase().includes(search.toLowerCase()) || 
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.orderId.toLowerCase().includes(search.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ReturnItem['status']) => {
    const config = {
      pending: { bg: 'bg-amber-50 text-[#B76A16] border-amber-100', label: systemLocale === 'fr' ? 'À examiner' : 'Pending review' },
      accepted: { bg: 'bg-blue-50 text-blue-700 border-blue-100', label: systemLocale === 'fr' ? 'Accepté' : 'Accepted' },
      refused: { bg: 'bg-red-50 text-[#B53A35] border-red-150', label: systemLocale === 'fr' ? 'Refusé' : 'Refused' },
      refunded: { bg: 'bg-green-50 text-[#247A52] border-green-150', label: systemLocale === 'fr' ? 'Remboursé' : 'Refunded' }
    };
    const active = config[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${active.bg}`}>
        {active.label}
      </span>
    );
  };

  const handleStatusUpdate = async (id: string, newStatus: ReturnItem['status']) => {
    try {
      const response = await fetch('/api/admin/returns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (response.ok) {
        refreshReturns();
      } else {
        alert(systemLocale === 'fr' ? 'Échec de la mise à jour' : 'Update failed');
      }
    } catch {
      alert(systemLocale === 'fr' ? 'Erreur réseau' : 'Network error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-admin-text font-sans">
      
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          {systemLocale === 'fr' ? 'Retours Clients' : 'Customer Returns'}
        </h1>
        <p className="text-sm text-admin-muted mt-1.5">
          {systemLocale === 'fr' 
            ? 'Gérez et traitez les demandes de retours ou remboursements.' 
            : 'Manage and process return or refund requests.'}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={systemLocale === 'fr' ? 'Rechercher un retour...' : 'Search return...'}
            className="w-full h-11 pl-10 pr-4 border border-slate-200 bg-slate-50/40 hover:bg-slate-50/70 focus:bg-white rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all duration-200 text-xs text-black shadow-2xs"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        </div>

        {/* Filters */}
        <div className="w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 border border-slate-200 bg-slate-50/40 hover:bg-slate-50/70 focus:bg-white rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all duration-200 text-xs font-bold cursor-pointer text-slate-700 shadow-2xs"
          >
            <option value="all">{systemLocale === 'fr' ? 'Tous les statuts' : 'All statuses'}</option>
            <option value="pending">{systemLocale === 'fr' ? 'À examiner' : 'Pending review'}</option>
            <option value="accepted">{systemLocale === 'fr' ? 'Accepté' : 'Accepted'}</option>
            <option value="refused">{systemLocale === 'fr' ? 'Refusé' : 'Refused'}</option>
            <option value="refunded">{systemLocale === 'fr' ? 'Remboursé' : 'Refunded'}</option>
          </select>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white border border-admin-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-admin-border bg-admin-ivory/30 text-admin-muted font-semibold">
                <th className="p-4">{systemLocale === 'fr' ? 'Retour ID' : 'Return ID'}</th>
                <th className="p-4">{systemLocale === 'fr' ? 'Commande' : 'Order'}</th>
                <th className="p-4">{systemLocale === 'fr' ? 'Client' : 'Customer'}</th>
                <th className="p-4">{systemLocale === 'fr' ? 'Motif' : 'Reason'}</th>
                <th className="p-4">Date</th>
                <th className="p-4">{systemLocale === 'fr' ? 'Statut' : 'Status'}</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border/50 font-medium">
              {filteredReturns.length > 0 ? (
                filteredReturns.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 transition">
                    <td className="p-4 text-black font-semibold">{item.id}</td>
                    <td className="p-4 font-semibold">{item.orderId}</td>
                    <td className="p-4">{item.customer}</td>
                    <td className="p-4 italic text-admin-muted">
                      &ldquo;{systemLocale === 'fr' ? item.reason : item.reasonEn}&rdquo;
                    </td>
                    <td className="p-4 text-admin-muted">{item.date}</td>
                    <td className="p-4">{getStatusBadge(item.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(item.id, 'accepted')}
                              className="size-8 rounded-lg border border-admin-border hover:border-black text-admin-muted hover:text-black flex items-center justify-center transition cursor-pointer bg-white"
                              title={systemLocale === 'fr' ? 'Accepter' : 'Accept'}
                            >
                              <Check className="size-4 text-admin-success" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(item.id, 'refused')}
                              className="size-8 rounded-lg border border-admin-border hover:border-black text-admin-muted hover:text-black flex items-center justify-center transition cursor-pointer bg-white"
                              title={systemLocale === 'fr' ? 'Refuser' : 'Refuse'}
                            >
                              <X className="size-4 text-admin-error" />
                            </button>
                          </>
                        )}
                        {item.status === 'accepted' && (
                          <button
                            onClick={() => handleStatusUpdate(item.id, 'refunded')}
                            className="h-8 px-2.5 rounded-lg bg-black text-white hover:bg-neutral-800 flex items-center gap-1 transition text-[10px] font-semibold cursor-pointer"
                          >
                            <RotateCcw className="size-3.5" />
                            <span>{systemLocale === 'fr' ? 'Rembourser' : 'Refund'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-admin-muted">
                    {systemLocale === 'fr' ? 'Aucun retour trouvé' : 'No returns found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
