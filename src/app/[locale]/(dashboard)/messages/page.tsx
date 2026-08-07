'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { 
  Send, 
  Search, 
  MapPin, 
  ShoppingBag,
  ExternalLink,
  Plus,
  Paperclip,
  Smile,
  CheckCheck,
  Filter,
  Package,
  Lock,
  Tag,
  Bot
} from 'lucide-react';
import Image from 'next/image';

type Message = {
  id: string;
  sender: 'admin' | 'client' | 'system';
  author?: 'customer' | 'ai' | 'admin' | 'system';
  text: string;
  time: string;
  isRead?: boolean;
};

type Chat = {
  id: string;
  conversationId: string;
  channel: 'whatsapp' | 'email' | 'web';
  customerName: string;
  phone: string;
  email: string;
  avatar: string;
  unread: number;
  lastMsg: string;
  lastTime: string;
  status: 'pending' | 'resolved' | 'none';
  aiEnabled: boolean;
  history: Message[];
  ordersCount: number;
  totalSpent: string;
  returnCount: number;
  linkedOrder?: {
    id: string;
    productName: string;
    productVariant: string;
    productImage: string;
    total: string;
    status: string;
    date: string;
  };
};

const INITIAL_CHATS: Chat[] = [];

export default function MessagesPage() {
  const systemLocale = useLocale() as 'fr' | 'en';
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'unread' | 'pending' | 'resolved'>('all');

  const refreshChats = (nextActiveId?: string) => {
    fetch('/api/admin/messages')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Chat[]) => {
        setChats(data);
        if (data.length > 0) {
          if (nextActiveId) {
            setActiveChatId(nextActiveId);
          } else if (!activeChatId) {
            setActiveChatId(data[0].id);
          }
        }
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    refreshChats();
    // Light polling keeps the inbox in sync with incoming WhatsApp messages.
    const interval = setInterval(() => refreshChats(), 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeChat: Chat = chats.find((c) => c.id === activeChatId) || chats[0] || {
    id: '',
    conversationId: '',
    channel: 'whatsapp',
    customerName: '',
    phone: '',
    email: '',
    avatar: '',
    unread: 0,
    lastMsg: '',
    lastTime: '',
    status: 'none',
    aiEnabled: true,
    history: [],
    ordersCount: 0,
    totalSpent: '0,00 €',
    returnCount: 0,
  };

  // Mark the active conversation as read.
  useEffect(() => {
    if (!activeChat.conversationId) return;
    fetch('/api/admin/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeChat.conversationId, markRead: true }),
    }).catch(() => undefined);
  }, [activeChatId, activeChat.conversationId]);

  const handleSendMessage = async (textToSend = inputText) => {
    if (!textToSend.trim() || !activeChat.conversationId) return;

    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeChat.conversationId, text: textToSend }),
      });
      if (response.ok) {
        setInputText('');
        refreshChats(activeChat.id);
      }
    } catch {
      alert('Error sending message');
    }
  };

  const handleResolveChat = async (conversationId: string) => {
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, status: 'resolved' }),
      });
      if (response.ok) {
        refreshChats(conversationId);
      }
    } catch {
      alert('Error resolving chat');
    }
  };

  const handleToggleAI = async (conversationId: string, aiEnabled: boolean) => {
    // Optimistic update for a snappy toggle.
    setChats((prev) => prev.map((c) => (c.id === conversationId ? { ...c, aiEnabled } : c)));
    try {
      await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, aiEnabled }),
      });
      refreshChats(conversationId);
    } catch {
      refreshChats(conversationId);
    }
  };

  const handleSuggestClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    alert(systemLocale === 'fr' ? 'Note privée sauvegardée !' : 'Private note saved!');
    setNoteText('');
  };

  const filteredChats = chats.filter((c) => {
    const matchesSearch = c.customerName.toLowerCase().includes(search.toLowerCase());
    if (statusTab === 'all') return matchesSearch;
    if (statusTab === 'unread') return matchesSearch && c.unread > 0;
    if (statusTab === 'pending') return matchesSearch && c.status === 'pending';
    if (statusTab === 'resolved') return matchesSearch && c.status === 'resolved';
    return matchesSearch;
  });

  return (
    <div className="space-y-4 animate-fade-in text-admin-text font-sans">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            {systemLocale === 'fr' ? 'Messagerie' : 'Messages'}
          </h1>
          <p className="text-xs text-admin-muted mt-1 flex items-center gap-1.5 font-medium">
            <span className="size-2 bg-admin-success rounded-full animate-pulse" />
            <span className="text-[#247A52] font-semibold">{systemLocale === 'fr' ? 'WhatsApp connecté' : 'WhatsApp connected'}</span>
            <span className="text-admin-border">•</span>
            <span>{systemLocale === 'fr' ? 'Dernière synchronisation : à l\'instant' : 'Last sync: just now'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="h-10 px-4 rounded-xl border border-admin-border bg-white text-xs font-semibold hover:bg-neutral-50 transition cursor-pointer">
            {systemLocale === 'fr' ? 'Modèles de réponse' : 'Response templates'}
          </button>
          <button className="h-10 px-4 bg-black text-white hover:bg-neutral-800 transition font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer">
            <Plus className="size-4" />
            <span>{systemLocale === 'fr' ? 'Nouveau message' : 'New message'}</span>
          </button>
        </div>
      </div>

      {/* 2. Three-Panel Grid */}
      <div className="h-[calc(100vh-170px)] flex border border-admin-border bg-white rounded-2xl shadow-xs overflow-hidden">
        
        {/* Panel 1: Chats List */}
        <section className="w-80 border-r border-admin-border flex flex-col h-full bg-white shrink-0">
          {/* Filters tabs in chat list */}
          <div className="p-4 border-b border-admin-border space-y-3">
            <div className="flex items-center gap-1 bg-admin-ivory/80 p-0.5 rounded-lg border border-admin-border text-[10px] font-bold">
              <button 
                onClick={() => setStatusTab('all')} 
                className={`flex-1 py-1.5 rounded transition ${statusTab === 'all' ? 'bg-white text-black shadow-2xs' : 'text-admin-muted hover:text-black'}`}
              >
                {systemLocale === 'fr' ? 'Toutes' : 'All'}
              </button>
              <button 
                onClick={() => setStatusTab('unread')} 
                className={`flex-1 py-1.5 rounded transition ${statusTab === 'unread' ? 'bg-white text-black shadow-2xs' : 'text-admin-muted hover:text-black'}`}
              >
                {systemLocale === 'fr' ? 'Non lues' : 'Unread'}{' '}
                {chats.some((c) => c.unread > 0) && (
                  <span className="text-[#247A52]">{chats.filter((c) => c.unread > 0).length}</span>
                )}
              </button>
              <button 
                onClick={() => setStatusTab('pending')} 
                className={`flex-1 py-1.5 rounded transition ${statusTab === 'pending' ? 'bg-white text-black shadow-2xs' : 'text-admin-muted hover:text-black'}`}
              >
                {systemLocale === 'fr' ? 'En attente' : 'Pending'}
              </button>
              <button 
                onClick={() => setStatusTab('resolved')} 
                className={`flex-1 py-1.5 rounded transition ${statusTab === 'resolved' ? 'bg-white text-black shadow-2xs' : 'text-admin-muted hover:text-black'}`}
              >
                {systemLocale === 'fr' ? 'Résolues' : 'Resolved'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={systemLocale === 'fr' ? 'Rechercher une conversation...' : 'Search chat...'}
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-admin-border text-[11px] outline-none focus:border-black transition"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-admin-muted" />
              </div>
              <button className="size-10 rounded-xl border border-admin-border flex items-center justify-center hover:bg-neutral-50 transition cursor-pointer text-admin-muted hover:text-black">
                <Filter className="size-4" />
              </button>
              <select className="h-10 px-2 rounded-xl border border-admin-border bg-white text-[11px] font-semibold outline-none cursor-pointer text-admin-muted hover:text-black">
                <option>{systemLocale === 'fr' ? "Toute l'équipe" : "Whole team"}</option>
              </select>
            </div>
          </div>

          {/* Conversations Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-admin-border/30">
            {filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              return (
                <button
                  key={chat.id}
                  onClick={() => {
                    setActiveChatId(chat.id);
                    setChats(chats.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
                  }}
                  className={`w-full p-4 flex items-start gap-3 transition text-left cursor-pointer relative ${
                    isActive ? 'bg-admin-secondary/40' : 'hover:bg-neutral-50/50'
                  }`}
                >
                  <div className="size-9.5 rounded-full bg-admin-secondary text-black font-serif font-bold text-xs flex items-center justify-center border border-admin-border shrink-0 uppercase">
                    {chat.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-black block truncate flex items-center gap-1.5">
                        {chat.customerName}
                        {chat.channel === 'whatsapp' && (
                          <span className="text-[10px] text-green-500 font-bold font-sans" title="WhatsApp">w</span>
                        )}
                      </span>
                      <span className="text-[10px] text-admin-muted shrink-0">{chat.lastTime}</span>
                    </div>
                    <p className={`text-xs mt-1.5 truncate leading-none ${chat.unread > 0 ? 'text-black font-semibold' : 'text-admin-muted'}`}>
                      {chat.lastMsg}
                    </p>
                    
                    {/* Stat status pills */}
                    {chat.status !== 'none' && (
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        chat.status === 'pending' 
                          ? 'bg-amber-50 text-[#B76A16] border-amber-100' 
                          : 'bg-green-50 text-[#247A52] border-green-100'
                      }`}>
                        {chat.status === 'pending' ? (systemLocale === 'fr' ? 'En attente' : 'Pending') : (systemLocale === 'fr' ? 'Résolu' : 'Resolved')}
                      </span>
                    )}
                  </div>

                  {chat.unread > 0 && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 size-4.5 rounded-full bg-[#247A52] text-white text-[9px] font-bold flex items-center justify-center">
                      {chat.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Panel 2: Chat Conversation Thread */}
        <section className="flex-1 flex flex-col h-full bg-admin-ivory/20 relative">
          
          {/* Thread Header */}
          <div className="h-16 border-b border-admin-border bg-white px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-admin-secondary text-black font-bold text-xs flex items-center justify-center border border-admin-border">
                {activeChat.avatar}
              </div>
              <div>
                <h3 className="font-bold text-xs text-black">{activeChat.customerName}</h3>
                <p className="text-[10px] text-admin-success font-semibold flex items-center gap-1 mt-0.5">
                  <span className="size-1.5 bg-admin-success rounded-full animate-pulse" />
                  {systemLocale === 'fr' ? 'En ligne' : 'Online'} · {activeChat.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleAI(activeChat.id, !activeChat.aiEnabled)}
                title={activeChat.aiEnabled
                  ? (systemLocale === 'fr' ? "L'IA répond automatiquement — cliquez pour reprendre la main" : 'AI replies automatically — click to take over')
                  : (systemLocale === 'fr' ? "Vous gérez cette conversation — cliquez pour réactiver l'IA" : 'You are handling this chat — click to re-enable AI')}
                className={`h-9 px-3 rounded-xl border text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeChat.aiEnabled
                    ? 'border-[#247A52] bg-green-50 text-[#247A52]'
                    : 'border-admin-border bg-white text-admin-muted hover:text-black'
                }`}
              >
                <Bot className="size-3.5" />
                {activeChat.aiEnabled
                  ? (systemLocale === 'fr' ? 'IA active' : 'AI on')
                  : (systemLocale === 'fr' ? 'IA en pause' : 'AI paused')}
              </button>
              <button
                onClick={() => handleResolveChat(activeChat.conversationId)}
                className="h-9 px-3 rounded-xl border border-admin-border bg-white text-[11px] font-bold text-admin-text hover:border-black transition cursor-pointer"
              >
                {systemLocale === 'fr' ? 'Marquer résolu' : 'Mark resolved'}
              </button>
            </div>
          </div>

          {/* Linked Order Ribbon */}
          {activeChat.linkedOrder && (
            <div className="bg-admin-ivory/50 border-b border-admin-border px-6 py-2.5 flex items-center justify-between text-xs shrink-0 font-medium">
              <span className="flex items-center gap-2 text-black font-bold">
                <ShoppingBag className="size-3.5 text-black shrink-0" />
                Commande {activeChat.linkedOrder.id}
                <span className="text-[9px] font-bold text-[#247A52] bg-green-50 px-2 py-0.5 rounded-full border border-green-150">
                  {activeChat.linkedOrder.status}
                </span>
              </span>
              <button className="text-[10px] font-bold text-admin-muted hover:text-black flex items-center gap-1 hover:underline">
                <span>Voir la commande</span>
                <ExternalLink className="size-3" />
              </button>
            </div>
          )}

          {/* Messages Flow Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-white border border-admin-border rounded-full text-[10px] font-bold text-admin-muted uppercase tracking-wider">
                {systemLocale === 'fr' ? "Aujourd'hui" : "Today"}
              </span>
            </div>

            {activeChat.history.map((msg) => {
              if (msg.sender === 'system') {
                return (
                  <div key={msg.id} className="text-center py-1">
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-admin-muted font-bold bg-neutral-100/60 px-3 py-1 rounded-full">
                      <Package className="size-3 text-admin-muted shrink-0" />
                      {msg.text}
                    </span>
                  </div>
                );
              }

              const isAdmin = msg.sender === 'admin';
              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col max-w-[65%] ${
                    isAdmin ? 'ml-auto items-end' : 'items-start'
                  }`}
                >
                  <div 
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      isAdmin 
                        ? 'bg-green-100 text-black border border-green-200 rounded-tr-none' 
                        : 'bg-white border border-admin-border text-admin-text rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-admin-muted mt-1 px-1.5 flex items-center gap-1">
                    {msg.author === 'ai' && (
                      <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-[#247A52] bg-green-50 border border-green-100 px-1 py-0.5 rounded uppercase tracking-wide">
                        <Bot className="size-2.5" /> IA
                      </span>
                    )}
                    {msg.time}
                    {isAdmin && (
                      <CheckCheck className="size-3.5 text-green-600" />
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick response suggestions */}
          <div className="px-6 py-2 bg-white/60 border-t border-admin-border flex flex-wrap gap-2 shrink-0">
            {[
              systemLocale === 'fr' ? 'Envoyer le suivi' : 'Send tracking info',
              systemLocale === 'fr' ? 'Politique de retour' : 'Return policy',
              systemLocale === 'fr' ? 'Merci pour votre commande' : 'Thank you for your order'
            ].map((suggest) => (
              <button
                key={suggest}
                onClick={() => handleSuggestClick(suggest)}
                className="h-7 px-3 bg-white border border-admin-border hover:border-black rounded-full text-[10px] font-bold text-admin-text transition cursor-pointer"
              >
                {suggest}
              </button>
            ))}
          </div>

          {/* Msg composer */}
          <div className="p-4 border-t border-admin-border bg-white shrink-0">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-3.5"
            >
              <button type="button" className="text-admin-muted hover:text-black p-1 transition shrink-0" aria-label="Attach file">
                <Paperclip className="size-4.5" />
              </button>
              <button type="button" className="text-admin-muted hover:text-black p-1 transition shrink-0" aria-label="Smileys">
                <Smile className="size-4.5" />
              </button>
              
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={systemLocale === 'fr' ? 'Écrire un message...' : 'Write message...'}
                className="flex-1 h-11 px-4 border border-admin-border rounded-xl text-xs outline-none focus:border-black transition"
              />
              
              <button 
                type="submit"
                className="size-11 rounded-xl bg-[#247A52] text-white hover:bg-[#1a5b3d] flex items-center justify-center transition cursor-pointer shrink-0 shadow-xs"
                aria-label="Send WhatsApp"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </section>

        {/* Panel 3: Customer contextual side panel */}
        <section className="w-80 border-l border-admin-border flex flex-col h-full bg-white shrink-0 p-5 overflow-y-auto">
          <h3 className="font-serif text-xs font-bold border-b border-admin-border pb-3 mb-4">
            {systemLocale === 'fr' ? 'Informations client' : 'Customer info'}
          </h3>

          {/* Profile Card */}
          <div className="flex flex-col items-center text-center pb-4 border-b border-admin-border/50 mb-4">
            <div className="size-14 rounded-full bg-admin-secondary text-black font-serif font-bold text-xl flex items-center justify-center border border-admin-border mb-2.5">
              {activeChat.avatar}
            </div>
            <h4 className="font-bold text-sm text-black flex items-center gap-1.5">
              {activeChat.customerName}
              <span className="text-[10px] text-green-500 font-bold">w</span>
            </h4>
            <p className="text-[10px] text-admin-muted mt-1 flex items-center gap-1">
              <MapPin className="size-3 text-admin-muted" />
              Paris, France
            </p>
            <button className="h-7 px-3 mt-3.5 border border-admin-border bg-white text-[10px] font-bold text-admin-text hover:border-black transition rounded-lg cursor-pointer">
              Voir le profil
            </button>
          </div>

          {/* Associated Linked Order widget */}
          {activeChat.linkedOrder && (
            <div className="border-b border-admin-border/50 pb-4 mb-4 space-y-3.5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Commande liée</h4>
              
              <div className="p-3 border border-admin-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-black">{activeChat.linkedOrder.id}</span>
                  <span className="text-[9px] font-bold text-[#247A52] bg-green-50 px-2 py-0.5 rounded-full border border-green-150">
                    {activeChat.linkedOrder.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative size-10 rounded-lg overflow-hidden border border-admin-border bg-neutral-100 shrink-0">
                    <Image
                      src={activeChat.linkedOrder.productImage}
                      alt={activeChat.linkedOrder.productName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-black truncate">{activeChat.linkedOrder.productName}</p>
                    <p className="text-[10px] text-admin-muted truncate mt-0.5">{activeChat.linkedOrder.productVariant}</p>
                  </div>
                </div>

                <button className="w-full h-8 border border-admin-border bg-white hover:border-black transition text-[10px] font-bold text-admin-text rounded-lg cursor-pointer">
                  Voir la commande
                </button>
              </div>

              {/* Mini shipping tracking timeline */}
              <div className="space-y-3 relative pl-4 text-[11px] font-semibold before:absolute before:left-1 before:top-1.5 before:bottom-1.5 before:w-[1px] before:bg-admin-border/80">
                <div className="relative">
                  <span className="absolute -left-4 top-0.5 size-2 bg-[#247A52] rounded-full border border-white" />
                  <p className="text-black">Commande confirmée</p>
                  <p className="text-[9px] text-admin-muted font-normal mt-0.5">8 mai · 10:12</p>
                </div>
                <div className="relative">
                  <span className="absolute -left-4 top-0.5 size-2 bg-[#247A52] rounded-full border border-white" />
                  <p className="text-black">Expédiée</p>
                  <p className="text-[9px] text-admin-muted font-normal mt-0.5">9 mai · 10:35</p>
                </div>
                <div className="relative">
                  <span className="absolute -left-4 top-0.5 size-2 bg-neutral-300 rounded-full border border-white" />
                  <p className="text-black">En transit</p>
                  <p className="text-[9px] text-admin-muted font-normal mt-0.5">9 mai · 16:20</p>
                </div>
                <div className="relative text-admin-muted">
                  <span className="absolute -left-4 top-0.5 size-2 bg-neutral-200 rounded-full border border-white" />
                  <p className="font-normal">Livraison prévue</p>
                  <p className="text-[9px] font-normal mt-0.5">{activeChat.linkedOrder.date}</p>
                </div>
              </div>
            </div>
          )}

          {/* Customer History totals summary */}
          <div className="border-b border-admin-border/50 pb-4 mb-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-admin-muted mb-3">Historique</h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-admin-ivory/30 border border-admin-border rounded-xl">
                <p className="font-bold text-black text-sm">{activeChat.ordersCount}</p>
                <p className="text-[9px] text-admin-muted mt-1">{systemLocale === 'fr' ? 'commandes' : 'orders'}</p>
              </div>
              <div className="p-2 bg-admin-ivory/30 border border-admin-border rounded-xl col-span-2">
                <p className="font-bold text-black text-sm">{activeChat.totalSpent}</p>
                <p className="text-[9px] text-admin-muted mt-1">{systemLocale === 'fr' ? 'dépensés' : 'spent'}</p>
              </div>
            </div>
          </div>

          {/* Add private team note */}
          <div className="border-b border-admin-border/50 pb-4 mb-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-admin-muted mb-2 flex items-center justify-between">
              <span>Ajouter une note privée</span>
              <Lock className="size-3 text-admin-muted" />
            </h4>
            <form onSubmit={handleSaveNote} className="space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={systemLocale === 'fr' ? 'Écrire une note interne...' : 'Write team note...'}
                className="w-full min-h-16 p-2 border border-admin-border rounded-xl text-[11px] outline-none focus:border-black transition"
              />
              <p className="text-[9px] text-admin-muted leading-none">Visible uniquement par votre équipe</p>
              <button type="submit" className="h-8 px-3 bg-black text-white hover:bg-neutral-800 transition font-semibold rounded-lg text-[10px] cursor-pointer">
                Ajouter
              </button>
            </form>
          </div>

          {/* Tags list */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-admin-muted mb-2.5 flex items-center justify-between">
              <span>Tags</span>
              <Tag className="size-3 text-admin-muted" />
            </h4>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded bg-amber-100 text-[#a05d13] text-[9px] font-bold">VIP</span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-bold">France</span>
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[9px] font-bold">Nouvelle cliente</span>
            </div>
          </div>

        </section>

      </div>

    </div>
  );
}
