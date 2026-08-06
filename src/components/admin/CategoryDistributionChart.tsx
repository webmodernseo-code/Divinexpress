'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const DATA_FR = [
  { name: 'Vêtements', value: 62 },
  { name: 'Accessoires', value: 24 },
  { name: 'Autres', value: 14 }
];

const DATA_EN = [
  { name: 'Clothing', value: 62 },
  { name: 'Accessories', value: 24 },
  { name: 'Others', value: 14 }
];

const COLORS = ['#6366f1', '#ec4899', '#f59e0b'];

export function CategoryDistributionChart() {
  const systemLocale = useLocale() as 'fr' | 'en';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-60 w-full bg-neutral-50 rounded-xl flex items-center justify-center text-xs text-admin-muted">
        {systemLocale === 'fr' ? 'Chargement du graphique...' : 'Loading chart...'}
      </div>
    );
  }

  const chartData = systemLocale === 'fr' ? DATA_FR : DATA_EN;

  return (
    <div className="h-60 w-full flex flex-col md:flex-row items-center gap-6">
      
      {/* Donut PieChart */}
      <div className="h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#F1F5F9',
                borderRadius: '16px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)',
                fontSize: '11px',
                borderWidth: '1px'
              }}
              formatter={(value) => [`${value}%`]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      <div className="flex-1 w-full space-y-3.5 text-xs">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between font-medium">
            <div className="flex items-center gap-2.5">
              <span className="size-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
              <span className="text-admin-muted">{item.name}</span>
            </div>
            <span className="font-bold text-black">{item.value} %</span>
          </div>
        ))}
        <div className="border-t border-admin-border/60 pt-3.5 flex items-center justify-between text-xs font-bold text-black">
          <span>Total</span>
          <span>100 %</span>
        </div>
      </div>

    </div>
  );
}
