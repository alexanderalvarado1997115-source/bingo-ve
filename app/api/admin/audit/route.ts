import { NextResponse } from 'next/server';
import { verifyFinancialIntegrity } from '@/lib/firebase/financial-actions';

/**
 * API Endpoint: Auditoría Financiera Manual
 * GET /api/admin/audit
 * 
 * Ejecuta una verificación de integridad financiera comparando
 * Firestore vs Realtime DB y retorna el resultado
 */
export async function GET() {
    try {
        console.log('📊 Ejecutando auditoría financiera desde API...');

        const auditResult = await verifyFinancialIntegrity();

        return NextResponse.json({
            success: true,
            audit: auditResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error en endpoint de auditoría:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
