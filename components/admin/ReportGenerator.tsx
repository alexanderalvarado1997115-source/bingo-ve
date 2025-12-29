"use client";
import { useState } from "react";
import { FileText, Calendar, Download, Printer } from "lucide-react";
import { Transaction } from "@/lib/firebase/financial-actions";

interface ReportGeneratorProps {
    transactions: Transaction[];
    financials: {
        totalRevenue: number;
        hoya: number;
        totalPaid: number;
    };
    todayStats: {
        income: number;
        expenses: number;
        net: number;
    };
}

export default function ReportGenerator({ transactions, financials, todayStats }: ReportGeneratorProps) {
    const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [isGenerating, setIsGenerating] = useState(false);

    const generateReport = () => {
        setIsGenerating(true);

        // Crear ventana de reporte
        const reportWindow = window.open('', '_blank');
        if (!reportWindow) {
            alert('Por favor permite ventanas emergentes para generar el reporte');
            setIsGenerating(false);
            return;
        }

        const reportHTML = createReportHTML();
        reportWindow.document.write(reportHTML);
        reportWindow.document.close();

        // Auto-abrir diálogo de impresión
        setTimeout(() => {
            reportWindow.print();
            setIsGenerating(false);
        }, 500);
    };

    const createReportHTML = () => {
        const now = new Date();
        const reportTitle = reportType === 'daily' ? 'Reporte Diario' :
            reportType === 'weekly' ? 'Reporte Semanal' :
                'Reporte Mensual';

        const utilidad = financials.totalRevenue - financials.hoya - financials.totalPaid;

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${reportTitle} - BingoVE</title>
    <style>
        @media print {
            @page { margin: 2cm; }
            body { margin: 0; }
            .no-print { display: none; }
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #fff;
            color: #1e293b;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #6366f1;
        }
        
        .logo {
            font-size: 32px;
            font-weight: 900;
            color: #6366f1;
            margin-bottom: 10px;
        }
        
        .report-title {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 5px;
        }
        
        .report-date {
            font-size: 14px;
            color: #64748b;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .summary-card {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #6366f1;
        }
        
        .summary-card.green { border-left-color: #10b981; }
        .summary-card.red { border-left-color: #ef4444; }
        .summary-card.blue { border-left-color: #3b82f6; }
        
        .summary-label {
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        
        .summary-value {
            font-size: 28px;
            font-weight: 900;
            color: #1e293b;
        }
        
        .summary-subtitle {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 4px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        thead {
            background: #f1f5f9;
        }
        
        th {
            padding: 12px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #cbd5e1;
        }
        
        td {
            padding: 12px;
            font-size: 13px;
            color: #334155;
            border-bottom: 1px solid #e2e8f0;
        }
        
        tbody tr:hover {
            background: #f8fafc;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
        }
        
        .badge.income {
            background: #d1fae5;
            color: #065f46;
        }
        
        .badge.expense {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .amount {
            font-weight: 700;
            font-size: 14px;
        }
        
        .amount.positive { color: #10b981; }
        .amount.negative { color: #ef4444; }
        
        .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
        }
        
        .print-button {
            background: #6366f1;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            font-size: 14px;
            margin: 20px auto;
            display: block;
        }
        
        .print-button:hover {
            background: #4f46e5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎰 BINGOVE</div>
            <div class="report-title">${reportTitle}</div>
            <div class="report-date">Generado el ${now.toLocaleDateString('es-VE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })} a las ${now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>

        <div class="summary-grid">
            <div class="summary-card blue">
                <div class="summary-label">La Hoya (20%)</div>
                <div class="summary-value">${financials.hoya.toFixed(2)} Bs</div>
                <div class="summary-subtitle">Acumulado semanal</div>
            </div>
            <div class="summary-card green">
                <div class="summary-label">Caja Total</div>
                <div class="summary-value">${financials.totalRevenue.toFixed(2)} Bs</div>
                <div class="summary-subtitle">Ingresos totales</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Utilidad Neta</div>
                <div class="summary-value">${utilidad.toFixed(2)} Bs</div>
                <div class="summary-subtitle">Ganancia real</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">📊 Resumen del Día</div>
            <div class="summary-grid">
                <div class="summary-card green">
                    <div class="summary-label">Ingresos</div>
                    <div class="summary-value">${todayStats.income.toFixed(2)} Bs</div>
                </div>
                <div class="summary-card red">
                    <div class="summary-label">Egresos</div>
                    <div class="summary-value">${todayStats.expenses.toFixed(2)} Bs</div>
                </div>
                <div class="summary-card blue">
                    <div class="summary-label">Balance</div>
                    <div class="summary-value">${todayStats.net.toFixed(2)} Bs</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">📋 Historial de Transacciones (Últimas ${transactions.length})</div>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Tipo</th>
                        <th>Descripción</th>
                        <th style="text-align: right;">Monto</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(tx => {
            const date = tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date();
            const isIncome = tx.type === 'income';
            return `
                        <tr>
                            <td>${date.toLocaleDateString('es-VE')}</td>
                            <td>${date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</td>
                            <td><span class="badge ${isIncome ? 'income' : 'expense'}">${isIncome ? 'Ingreso' : 'Egreso'}</span></td>
                            <td>${tx.description}</td>
                            <td style="text-align: right;"><span class="amount ${isIncome ? 'positive' : 'negative'}">${isIncome ? '+' : ''}${tx.amount.toFixed(2)} Bs</span></td>
                        </tr>
                        `;
        }).join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p><strong>BingoVE</strong> - Sistema de Gestión Financiera</p>
            <p>Este reporte es confidencial y solo debe ser usado para fines internos</p>
            <p>© ${new Date().getFullYear()} BingoVE. Todos los derechos reservados.</p>
        </div>

        <button class="print-button no-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
    </div>
</body>
</html>
        `;
    };

    return (
        <div className="bg-[#0f111a] rounded-[2.5rem] border border-white/5 p-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                    <FileText size={24} className="text-indigo-400" />
                    Generar Reporte
                </h3>
            </div>

            <div className="space-y-6">
                {/* Selector de tipo de reporte */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        Tipo de Reporte
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            onClick={() => setReportType('daily')}
                            className={`p-4 rounded-xl border transition-all ${reportType === 'daily'
                                    ? 'bg-indigo-600 border-indigo-500 text-white'
                                    : 'bg-[#161822] border-white/5 text-slate-400 hover:border-indigo-500/50'
                                }`}
                        >
                            <Calendar size={20} className="mx-auto mb-2" />
                            <div className="text-xs font-black uppercase">Diario</div>
                        </button>
                        <button
                            onClick={() => setReportType('weekly')}
                            className={`p-4 rounded-xl border transition-all ${reportType === 'weekly'
                                    ? 'bg-indigo-600 border-indigo-500 text-white'
                                    : 'bg-[#161822] border-white/5 text-slate-400 hover:border-indigo-500/50'
                                }`}
                        >
                            <Calendar size={20} className="mx-auto mb-2" />
                            <div className="text-xs font-black uppercase">Semanal</div>
                        </button>
                        <button
                            onClick={() => setReportType('monthly')}
                            className={`p-4 rounded-xl border transition-all ${reportType === 'monthly'
                                    ? 'bg-indigo-600 border-indigo-500 text-white'
                                    : 'bg-[#161822] border-white/5 text-slate-400 hover:border-indigo-500/50'
                                }`}
                        >
                            <Calendar size={20} className="mx-auto mb-2" />
                            <div className="text-xs font-black uppercase">Mensual</div>
                        </button>
                    </div>
                </div>

                {/* Botón de generar */}
                <button
                    onClick={generateReport}
                    disabled={isGenerating}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-black uppercase text-sm tracking-widest rounded-xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
                >
                    {isGenerating ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Generando...
                        </>
                    ) : (
                        <>
                            <Printer size={20} />
                            Generar Reporte {reportType === 'daily' ? 'Diario' : reportType === 'weekly' ? 'Semanal' : 'Mensual'}
                        </>
                    )}
                </button>

                {/* Instrucciones */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">
                        💡 Cómo guardar como PDF
                    </div>
                    <ul className="text-xs text-slate-400 space-y-1">
                        <li>1. Haz clic en "Generar Reporte"</li>
                        <li>2. Se abrirá una nueva ventana con el reporte</li>
                        <li>3. Presiona <strong>Ctrl + P</strong> (o haz clic en el botón "Imprimir")</li>
                        <li>4. Selecciona "Guardar como PDF" como destino</li>
                        <li>5. Haz clic en "Guardar"</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
