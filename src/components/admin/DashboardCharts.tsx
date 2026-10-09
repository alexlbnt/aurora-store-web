"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

type ChartDataPoint = {
  name: string;
  total: number;
};

export default function DashboardCharts({ data }: { data: ChartDataPoint[] }) {
  if (!data || data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-primary/70 text-sm">Sem vendas neste período</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4b5a8c" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#4b5a8c" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e0ec" />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: '#6b6f85' }} 
          dy={10} 
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: '#64748b' }} 
          tickFormatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
        />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          formatter={(value) => [Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'Vendas']}
          labelStyle={{ color: '#232a3e', fontWeight: 600, marginBottom: '4px' }}
        />
        <Line 
          type="monotone" 
          dataKey="total" 
          stroke="#4b5a8c" 
          strokeWidth={3}
          dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
          activeDot={{ r: 6, fill: '#4b5a8c', stroke: '#fff', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
