import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, where, writeBatch, doc, updateDoc, getCountFromServer } from "firebase/firestore";
import { ref, get, update, runTransaction } from "firebase/database";
import { db, realtimeDb } from "./config";

/**
 * FINANCIAL ACTIONS
 * Sistema de registro y gestión de transacciones financieras
 */

export interface Transaction {
    id?: string;
    timestamp: any;
    type: 'income' | 'expense';
    category: 'ticket_sale' | 'prize_payout' | 'hoya_reset' | 'system_adjustment' | 'referral_bonus';
    amount: number;
    description: string;
    relatedId?: string;
    balance: number;
}

export interface TransactionFilters {
    type?: 'income' | 'expense';
    category?: Transaction['category'];
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
}

/**
 * Registra una transacción financiera en Firestore
 */
export async function recordTransaction(
    type: 'income' | 'expense',
    category: Transaction['category'],
    amount: number,
    description: string,
    relatedId?: string
): Promise<{ success: boolean; error?: any }> {
    try {
        // Obtener balance actual
        const financialsSnapshot = await get(ref(realtimeDb, 'financials'));
        const currentBalance = financialsSnapshot.val()?.totalRevenue || 0;

        // Registrar transacción
        const transactionData: Transaction = {
            timestamp: serverTimestamp(),
            type,
            category,
            amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
            description,
            relatedId: relatedId || undefined,
            balance: currentBalance
        };

        await addDoc(collection(db, 'transactions'), transactionData);

        console.log(`✅ Transacción registrada: ${description} (${amount} Bs)`);
        return { success: true };
    } catch (error) {
        console.error("❌ Error registrando transacción:", error);
        return { success: false, error };
    }
}

/**
 * VERSIÓN SEGURA: Registra transacción con doble escritura y verificación
 * Escribe en Firestore Y Realtime DB para garantizar redundancia
 */
export async function recordTransactionSafe(
    type: 'income' | 'expense',
    category: Transaction['category'],
    amount: number,
    description: string,
    relatedId?: string
): Promise<{ success: boolean; transactionId?: string; error?: any }> {
    let firestoreDocId: string | null = null;

    try {
        // Paso 1: Obtener balance actual
        const financialsSnapshot = await get(ref(realtimeDb, 'financials'));
        const currentBalance = financialsSnapshot.val()?.totalRevenue || 0;

        // Paso 2: Preparar datos de transacción
        const transactionData: Transaction = {
            timestamp: serverTimestamp(),
            type,
            category,
            amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
            description,
            relatedId: relatedId || undefined,
            balance: currentBalance
        };

        // Paso 3: Escribir en Firestore (fuente primaria)
        const firestoreDoc = await addDoc(collection(db, 'transactions'), transactionData);
        firestoreDocId = firestoreDoc.id;

        // Paso 4: Escribir en Realtime DB (respaldo)
        await update(ref(realtimeDb, `financials/ledger/${firestoreDocId}`), {
            ...transactionData,
            timestamp: Date.now(), // RTDB no acepta serverTimestamp de Firestore
            firestoreId: firestoreDocId
        });

        // Paso 5: Actualizar Balance Agregado (SINCRONIZACIÓN CRÍTICA)
        const netAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
        const hoyaInc = type === 'income' ? (netAmount * 0.20) : 0; // 20% Hoya por defecto

        await runTransaction(ref(realtimeDb, 'financials'), (current) => {
            const data = current || { totalRevenue: 0, hoya: 0 };
            return {
                ...data,
                totalRevenue: Number(data.totalRevenue || 0) + netAmount,
                hoya: Number(data.hoya || 0) + hoyaInc
            };
        });

        // Paso 6: Verificación de integridad (ambos existen)
        const [firestoreCheck, rtdbCheck] = await Promise.all([
            getDocs(query(collection(db, 'transactions'), where('__name__', '==', firestoreDocId), limit(1))),
            get(ref(realtimeDb, `financials/ledger/${firestoreDocId}`))
        ]);

        if (firestoreCheck.empty || !rtdbCheck.exists()) {
            throw new Error('CRITICAL: Transaction replication failed');
        }

        console.log(`✅ Transacción SEGURA registrada: ${description} (${amount} Bs)[ID: ${firestoreDocId}]`);
        return { success: true, transactionId: firestoreDocId };

    } catch (error) {
        console.error("❌ Error en recordTransactionSafe:", error);

        // Intentar rollback si Firestore se escribió pero RTDB falló
        if (firestoreDocId) {
            try {
                console.warn("⚠️ Intentando rollback de transacción...");
                // No borramos de Firestore (para auditoría), pero marcamos como fallida
                await update(ref(realtimeDb, `financials/failed_transactions/${firestoreDocId}`), {
                    error: String(error),
                    timestamp: Date.now(),
                    attemptedData: { type, category, amount, description }
                });
            } catch (rollbackError) {
                console.error("❌ Rollback también falló:", rollbackError);
            }
        }

        return { success: false, error };
    }
}

/**
 * Procesa y paga la recompensa por referido (10%)
 */
export async function processReferralReward(payerUserId: string, amountSpent: number, relatedTransactionId: string) {
    try {
        // 1. Buscar al usuario que paga para ver si tiene referente
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', payerUserId), limit(1)));
        if (userDoc.empty) return;

        const userData = userDoc.docs[0].data();
        const referrerId = userData.referredBy;

        if (!referrerId) return; // No tiene referente

        // 2. Calcular 10%
        const bonusAmount = amountSpent * 0.10;
        if (bonusAmount <= 0) return;

        // 3. Pagar al Referente
        // A. Actualizar Wallet del Referente (Firestore)
        const referrerRef = doc(db, 'users', referrerId);
        // Usamos import dinámico para evitar dependencias circulares si las hubiera, o standard
        const { increment } = await import("firebase/firestore");
        await updateDoc(referrerRef, {
            walletBalance: increment(bonusAmount)
        });

        // B. Registrar Transacción Financiera para la empresa (Gasto? o Solo movimiento interno?)
        // En este caso, el dinero sale del "aire" (es un costo de marketing) o se descuenta de la ganancia.
        // Lo registraremos como un Gasto del Sistema (System Expense) para que cuadre la caja.
        // Ojo: Si el totalRevenue es bruto, esto es un gasto.

        await recordTransactionSafe(
            'expense',
            'referral_bonus',
            bonusAmount,
            `Comisión Referido (10%) de usuario ${userData.displayName || 'Anon'}`,
            relatedTransactionId
        );

        console.log(`💰 Comisión de ${bonusAmount} pagada a referente ${referrerId}`);
        return { success: true, bonusAmount };

    } catch (error) {
        console.error("❌ Error procesando referido:", error);
        return { success: false, error };
    }
}

/**
 * Función de generación de alertas automáticas basada en KPIs, proyecciones y comparativas
 */
export async function checkAndGenerateAlerts(
    kpis: {
        roi: number;
        avgTicketPrice: number;
        conversionRate: number;
        salesVelocity: number;
        totalTicketsSold: number;
        totalIncome: number;
        totalExpenses: number;
    },
    projections: {
        ticketsToBreakEven: number;
        ticketsToGoal: number;
        projectedDailyIncome: number;
        projectedWeeklyIncome: number;
        hoursToGoal: number;
        currentProgress: number;
    },
    comparative: {
        weekOverWeek: { currentWeek: number; lastWeek: number; growth: number; growthPercentage: number };
        monthOverMonth: { currentMonth: number; lastMonth: number; growth: number; growthPercentage: number };
        bestDay: { day: string; income: number };
        worstDay: { day: string; income: number };
    }
): Promise<void> {
    try {
        const alerts: any[] = [];
        // 1️⃣ ROI negativo
        if (kpis.roi < 0) {
            alerts.push({
                type: 'NEGATIVE_ROI',
                message: `⚠️ ROI negativo (${kpis.roi.toFixed(2)}%). Revisar gastos.`,
                severity: 'high',
                timestamp: serverTimestamp()
            });
        }
        // 2️⃣ Progreso de meta bajo (< 30%)
        if (projections.currentProgress < 30) {
            alerts.push({
                type: 'LOW_PROGRESS',
                message: `🚨 Progreso de meta diario bajo (${projections.currentProgress.toFixed(1)}%).`,
                severity: 'medium',
                timestamp: serverTimestamp()
            });
        }
        // 3️⃣ Crecimiento semanal negativo
        if (comparative.weekOverWeek.growth < 0) {
            alerts.push({
                type: 'WEEK_NEGATIVE_GROWTH',
                message: `📉 Crecimiento semanal negativo (${comparative.weekOverWeek.growthPercentage.toFixed(1)}%).`,
                severity: 'medium',
                timestamp: serverTimestamp()
            });
        }
        // 4️⃣ Peor día con ingresos muy bajos (< 10% del promedio)
        const avgDaily = kpis.totalIncome / Math.max(1, kpis.totalTicketsSold);
        if (comparative.worstDay.income < avgDaily * 0.1) {
            alerts.push({
                type: 'VERY_LOW_DAY',
                message: `🔻 Día ${comparative.worstDay.day} con ingresos muy bajos (${comparative.worstDay.income} Bs).`,
                severity: 'low',
                timestamp: serverTimestamp()
            });
        }
        // Persistir alertas en Firestore si existen
        if (alerts.length > 0) {
            const batch = writeBatch(db);
            alerts.forEach(alert => {
                const docRef = doc(collection(db, 'system_alerts'));
                batch.set(docRef, alert);
            });
            await batch.commit();
            console.log(`✅ ${alerts.length} alertas generadas y guardadas.`);
        }
    } catch (error) {
        console.error('❌ Error generando alertas automáticas:', error);
    }
}



/**
 * Obtiene métricas KPI (Últimos 30 días para rendimiento).
 */
export async function getKPIMetrics() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const q = query(
            collection(db, 'transactions'),
            where('timestamp', '>=', thirtyDaysAgo),
            orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);

        let income = 0,
            expenses = 0,
            tickets = 0;

        snapshot.forEach(doc => {
            const data = doc.data() as any;
            if (data.type === 'income') {
                income += data.amount;
                tickets += 1;
            } else if (data.type === 'expense') {
                expenses += Math.abs(data.amount);
            }
        });

        const totalRevenue = income - expenses;
        const roi = totalRevenue !== 0 ? (totalRevenue / (expenses || 1)) * 100 : 0;
        const avgTicketPrice = tickets ? income / tickets : 0;
        const conversionRate = tickets ? (tickets / (snapshot.size || 1)) * 100 : 0;
        const salesVelocity = tickets / (30 * 24); // tickets per hour in last 30 days

        return {
            roi,
            avgTicketPrice,
            conversionRate,
            salesVelocity,
            totalTicketsSold: tickets,
            totalIncome: income,
            totalExpenses: expenses
        };
    } catch (e) {
        console.error('❌ Error en getKPIMetrics', e);
        return {
            roi: 0,
            avgTicketPrice: 0,
            conversionRate: 0,
            salesVelocity: 0,
            totalTicketsSold: 0,
            totalIncome: 0,
            totalExpenses: 0
        };
    }
}

/**
 * Proyecciones basadas en la meta diaria configurada.
 */
export async function getProjections(dailyGoal: number = 1000) {
    const kpis = await getKPIMetrics();
    const ticketsToBreakEven = kpis.totalExpenses > 0 ? Math.ceil(kpis.totalExpenses / (kpis.avgTicketPrice || 1)) : 0;
    const ticketsToGoal = dailyGoal > 0 ? Math.ceil(dailyGoal / (kpis.avgTicketPrice || 1)) : 0;
    const projectedDailyIncome = kpis.salesVelocity * (kpis.avgTicketPrice || 0) * 24;
    const projectedWeeklyIncome = projectedDailyIncome * 7;
    const hoursToGoal = ticketsToGoal > 0 ? (ticketsToGoal / (kpis.salesVelocity || 1)) : 0;
    const currentProgress = ticketsToGoal > 0 ? (kpis.totalTicketsSold / ticketsToGoal) * 100 : 0;
    return {
        ticketsToBreakEven,
        ticketsToGoal,
        projectedDailyIncome,
        projectedWeeklyIncome,
        hoursToGoal,
        currentProgress
    };
}

/**
 * Historial de transacciones (limitado).
 */
export async function getTransactionHistory(limitCount = 50) {
    const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Transaction[];
}

/**
 * Transacciones filtradas por rango de fechas.
 */
export async function getTransactionsByDateRange(start: Date, end: Date) {
    const q = query(
        collection(db, 'transactions'),
        where('timestamp', '>=', start),
        where('timestamp', '<=', end),
        orderBy('timestamp', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Transaction[];
}

/**
 * Actualiza la configuración financiera en Realtime DB.
 */
export async function updateFinancialConfig(config: { ticketPrice?: number; bingoReward?: number; hoyaPercentage?: number }) {
    try {
        const updates: any = {};
        if (config.ticketPrice !== undefined) updates['financials/config/ticketPrice'] = config.ticketPrice;
        if (config.bingoReward !== undefined) updates['financials/config/bingoReward'] = config.bingoReward;
        if (config.hoyaPercentage !== undefined) updates['financials/config/hoyaPercentage'] = config.hoyaPercentage;
        await update(ref(realtimeDb), updates);
        return { success: true };
    } catch (e) {
        console.error('❌ Error en updateFinancialConfig', e);
        return { success: false, error: e };
    }
}

/**
 * Verifica integridad entre Firestore y Realtime DB.
 */
export async function verifyFinancialIntegrity() {
    try {
        const firestoreSnap = await getDocs(collection(db, 'transactions'));
        const realtimeSnap = await get(ref(realtimeDb, 'financials'));
        const firestoreTotal = firestoreSnap.docs.reduce((sum, doc) => {
            const data = doc.data() as any;
            return sum + (data.type === 'income' ? data.amount : -Math.abs(data.amount));
        }, 0);
        const realtimeTotal = realtimeSnap.val()?.totalRevenue || 0;
        const match = Math.abs(firestoreTotal - realtimeTotal) < 0.01;
        return { match, firestoreTotal, realtimeTotal };
    } catch (e) {
        console.error('❌ Error en verifyFinancialIntegrity', e);
        return { match: false, error: e };
    }
}

/**
 * Datos semanales para el gráfico de flujo de efectivo.
 * Obtiene las transacciones de los últimos 7 días y las agrupa por día.
 */
export async function getWeeklyChartData() {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);

        const transactions = await getTransactionsByDateRange(startDate, endDate);

        // Inicializar mapa de los últimos 7 días
        const daysMap = new Map<string, { ingresos: number; egresos: number }>();

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayKey = d.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric' }); // Vie. 27
            daysMap.set(dayKey, { ingresos: 0, egresos: 0 });
        }

        transactions.forEach(t => {
            const date = t.timestamp?.toDate ? t.timestamp.toDate() : new Date();
            const dayKey = date.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric' });

            if (daysMap.has(dayKey) || true) { // Permitir claves que coincidan
                // Normalizar key si es necesario o usar lógica de fecha, pero el map ya tiene los keys esperados
                // Para seguridad, regeneramos el key del transaction
                const tKey = date.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric' });
                if (daysMap.has(tKey)) {
                    const current = daysMap.get(tKey)!;
                    if (t.type === 'income') {
                        current.ingresos += t.amount;
                    } else {
                        current.egresos += Math.abs(t.amount);
                    }
                }
            }
        });

        return Array.from(daysMap.entries()).map(([day, values]) => ({
            day,
            ...values
        }));

    } catch (error) {
        console.error("Error obteniendo datos del gráfico semanal:", error);
        return [];
    }
}

/**
 * Comparativas semana/mes y mejores/peores días.
 * Analiza el rendimiento comparando periodos para mostrar crecimiento y puntos destacados.
 */
export async function getComparativeData() {
    try {
        const now = new Date();

        // Rangos de Tiempo
        const endThisWeek = now;
        const startThisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startLastWeek = new Date(startThisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);

        const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0); // Ultimo dia del mes pasado

        // Obtener datos (Paralelizar para velocidad)
        const [thisWeekTxns, lastWeekTxns, thisMonthTxns, lastMonthTxns] = await Promise.all([
            getTransactionsByDateRange(startThisWeek, endThisWeek),
            getTransactionsByDateRange(startLastWeek, startThisWeek),
            getTransactionsByDateRange(startThisMonth, now),
            getTransactionsByDateRange(startLastMonth, endLastMonth)
        ]);

        // Helper para sumar ingresos
        const sumIncome = (txns: any[]) => txns
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);

        const thisWeekIncome = sumIncome(thisWeekTxns);
        const lastWeekIncome = sumIncome(lastWeekTxns);
        const thisMonthIncome = sumIncome(thisMonthTxns);
        const lastMonthIncome = sumIncome(lastMonthTxns);

        // Calcular crecimientos
        const calcGrowth = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        // Encontrar Mejor/Peor día de la semana actual
        const dailyIncomes = new Map<string, number>();
        thisWeekTxns.forEach(t => {
            if (t.type === 'income') {
                const day = t.timestamp?.toDate ? t.timestamp.toDate().toLocaleDateString('es-VE', { weekday: 'long' }) : 'Hoy';
                const val = dailyIncomes.get(day) || 0;
                dailyIncomes.set(day, val + t.amount);
            }
        });

        let bestDay = { day: 'N/A', income: 0 };
        let worstDay = { day: 'N/A', income: Infinity };

        if (dailyIncomes.size > 0) {
            for (const [day, income] of dailyIncomes.entries()) {
                if (income > bestDay.income) bestDay = { day, income };
                if (income < worstDay.income) worstDay = { day, income };
            }
        } else {
            worstDay.income = 0;
        }

        return {
            weekOverWeek: {
                currentWeek: thisWeekIncome,
                lastWeek: lastWeekIncome,
                growth: thisWeekIncome - lastWeekIncome,
                growthPercentage: calcGrowth(thisWeekIncome, lastWeekIncome)
            },
            monthOverMonth: {
                currentMonth: thisMonthIncome,
                lastMonth: lastMonthIncome,
                growth: thisMonthIncome - lastMonthIncome,
                growthPercentage: calcGrowth(thisMonthIncome, lastMonthIncome)
            },
            bestDay,
            worstDay: dailyIncomes.size > 0 ? worstDay : { day: 'N/A', income: 0 }
        };

    } catch (error) {
        console.error("Error en getComparativeData:", error);
        return {
            weekOverWeek: { currentWeek: 0, lastWeek: 0, growth: 0, growthPercentage: 0 },
            monthOverMonth: { currentMonth: 0, lastMonth: 0, growth: 0, growthPercentage: 0 },
            bestDay: { day: 'N/A', income: 0 },
            worstDay: { day: 'N/A', income: 0 }
        };
    }
}

/**
 * Obtiene transacciones filtradas para la tabla con paginación REAL.
 */
export async function getFilteredTransactions({ page = 1, pageSize = 20, ...filters }: any): Promise<{ transactions: Transaction[]; total: number; hasMore: boolean }> {
    let qBase = collection(db, 'transactions') as any;

    // 1. Construir filtros
    if (filters.type) qBase = query(qBase, where('type', '==', filters.type));
    if (filters.category) qBase = query(qBase, where('category', '==', filters.category));

    // 2. Obtener Conteo Total de forma eficiente (Metadata only)
    const countSnapshot = await getCountFromServer(qBase);
    const total = countSnapshot.data().count;

    // 3. Obtener Datos Paginados
    // Nota: El SDK de cliente no tiene offset. Para páginas específicas, cargamos hasta la página actual.
    const qData = query(qBase, orderBy('timestamp', 'desc'), limit(page * pageSize));
    const snap = await getDocs(qData);

    const start = (page - 1) * pageSize;
    const allDocs = snap.docs;
    const paginatedDocs = allDocs.slice(start);

    const transactions = paginatedDocs.map(d => ({ id: d.id, ...(d.data() as any) } as Transaction));

    return {
        transactions,
        total,
        hasMore: start + pageSize < total
    };
}

/**
 * Estadísticas de hoy (ingresos, egresos, neto).
 */
export async function getTodayStats(): Promise<{ income: number; expenses: number; net: number; transactionCount: number }> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const transactions = await getTransactionsByDateRange(start, end);
    let income = 0,
        expenses = 0;
    transactions.forEach(t => {
        if (t.type === 'income') income += t.amount;
        else expenses += Math.abs(t.amount);
    });
    return { income, expenses, net: income - expenses, transactionCount: transactions.length };
}
