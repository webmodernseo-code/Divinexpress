'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const DATA_FR = [
  { date: 'Lun', ventes: 1200 },
  { date: 'Mar', ventes: 1850 },
  { date: 'Mer', ventes: 1400 },
  { date: 'Jeu', ventes: 2200 },
  { date: 'Ven', ventes: 1950 },
  { date: 'Sam', ventes: 2800 },
  { date: 'Dim', ventes: 2480 }
];

const DATA_EN = [
  { date: 'Mon', ventes: 1200 },
  { date: 'Tue', ventes: 1850 },
  { date: 'Wed', ventes: 1400 },
  { date: 'Thu', ventes: 2200 },
  { date: 'Fri', ventes: 1950 },
  { date: 'Sat', ventes: 2800 },
  { date: 'Sun', ventes: 2480 }
];

export function SalesChart() {
  const systemLocale = useLocale() as 'fr' | 'en';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-80 w-full bg-neutral-50 rounded-xl flex items-center justify-center text-xs text-admin-muted">
        {systemLocale === 'fr' ? 'Chargement du graphique...' : 'Loading chart...'}
      </div>
    );
  }

  const chartData = systemLocale === 'fr' ? DATA_FR : DATA_EN;

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            stroke="#94A3B8"
            fontSize={11}
            tickMargin={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            stroke="#94A3B8"
            fontSize={11}
            tickMargin={10}
            tickFormatter={(v) => `${v}€`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#FFFFFF', 
              borderColor: '#F1F5F9', 
              borderRadius: '16px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              borderWidth: '1px'
            }}
            formatter={(value) => [`${value} €`, systemLocale === 'fr' ? 'Ventes' : 'Sales']}
            labelFormatter={(label) => `${systemLocale === 'fr' ? 'Jour' : 'Day'} : ${label}`}
          />
          <Area
            type="monotone"
            dataKey="ventes"
            stroke="#6366F1"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#salesGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
