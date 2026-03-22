"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

type ChartDataPoint = {
  name: string;
  total: number;
};

export default function DashboardCharts({ data }: { data: ChartDataPoint[] }) {
  if (!data || data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-slate-500 text-sm">Nenhum dado disponível</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4C648B" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#4C648B" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: '#64748b' }} 
          dy={10} 
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: '#64748b' }} 
          tickFormatter={(value) => `R$ ${value}`}
        />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          formatter={(value: number) => [`R$ ${value.toFixed(2).replace('.', ',')}`, 'Vendas']}
          labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
        />
        <Line 
          type="monotone" 
          dataKey="total" 
          stroke="#4C648B" 
          strokeWidth={3}
          dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
          activeDot={{ r: 6, fill: '#4C648B', stroke: '#fff', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
