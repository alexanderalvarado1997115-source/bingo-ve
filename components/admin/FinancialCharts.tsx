"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface CashFlowData {
    day: string;
    ingresos: number;
    egresos: number;
}

export function CashFlowChart({ data }: { data: CashFlowData[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-[#0f111a] rounded-[2.5rem] border border-white/5 p-8">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                    📈 Flujo de Caja (Últimos 7 días)
                </h3>
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                    No hay datos suficientes para mostrar el gráfico
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#0f111a] rounded-[2.5rem] border border-white/5 p-8">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                📈 Flujo de Caja (Últimos 7 días)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis
                        dataKey="day"
                        stroke="#64748b"
                        style={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <YAxis
                        stroke="#64748b"
                        style={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '12px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                        }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}
                        itemStyle={{ color: '#cbd5e1', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Legend
                        wrapperStyle={{
                            paddingTop: '20px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    />
                    <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="egresos" fill="#ef4444" name="Egresos" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

interface DistributionData {
    name: string;
    value: number;
    color: string;
}

export function DistributionChart({ data }: { data: DistributionData[] }) {
    if (!data || data.length === 0 || data.every(d => d.value === 0)) {
        return (
            <div className="bg-[#0f111a] rounded-[2.5rem] border border-white/5 p-8">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                    🥧 Distribución de Ingresos
                </h3>
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                    No hay datos para mostrar la distribución
                </div>
            </div>
        );
    }

    const COLORS = data.map(d => d.color);

    const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                style={{ fontSize: '14px', fontWeight: 'bold' }}
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="bg-[#0f111a] rounded-[2.5rem] border border-white/5 p-8">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                🥧 Distribución de Ingresos
            </h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={CustomLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '12px'
                        }}
                        itemStyle={{ color: '#cbd5e1', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Legend
                        wrapperStyle={{
                            paddingTop: '20px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
