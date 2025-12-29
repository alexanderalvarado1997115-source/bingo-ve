require('dotenv').config({ path: '../.env.local' });
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, onValue } = require('firebase/database');
const cron = require('node-cron');
const Content = require('./bot-content');

/**
 * BINGO VE - GERENTE DE COMUNIDAD (BOT V2.0)
 * Sistema autónomo para animación, ventas y arbitraje de Bingo.
 */

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- CONFIGURACIÓN WHATSAPP ---
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './session' }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
    }
});

// --- ESTADO DEL BOT ---
let targetGroupId = '120363404003479470@g.us'; // ID del Grupo Oficial
let currentHoyaAmount = 0;
let isOperatingHours = false; // Controla si es hora de trabajar (7am - 10pm)
let lastInteractionTime = Date.now();

// --- INICIALIZACIÓN ---
client.on('qr', (qr) => qrcode.generate(qr, { small: true }));

client.on('ready', () => {
    console.log('\n🚀 BINGO VE BOT 2.0 - ONLINE');
    console.log('🤖 Módulo de Animación: ACTIVO');
    console.log('⏰ Módulo de Horarios: ACTIVO');

    startFiscalMonitoring(); // Escuchar dinero
    startGameMonitoring();   // Escuchar juego
    startTicketMonitoring(); // <--- Nuevo
    setupCronJobs();         // Configurar rutinas
    checkOperationHours();   // Verificar hora actual
});

// --- 1. MÓDULO DE HORARIOS Y RUTINAS (CRON JOBS) ---
function setupCronJobs() {
    console.log('📅 Configurando agenda: 7AM Apertura | 9:30PM Reporte | 10PM Cierre');

    // ☀️ 7:00 AM - APERTURA Y VENTA AGRESIVA
    cron.schedule('0 7 * * *', () => {
        isOperatingHours = true;
        const saludo = getRandom(Content.SALUDOS_DIARIOS);
        const cartonesVendidos = currentTicketsSold || 0;

        broadcast(`${saludo}\n\n📊 *Estado de la Sala:*\n✅ Vendidos: ${cartonesVendidos}\n🎯 Meta del Sorteo: ¡Llenar la sala!\n\n${Content.LLAMADOS_ACCION_VENTA[0]}https://bingo-ve-delta.vercel.app/`);
    });

    // 🌙 9:30 PM - REPORTE DE HOYA (MOTIVACIÓN NOCTURNA)
    cron.schedule('30 21 * * *', () => {
        if (!isOperatingHours) return;
        broadcast(`🚨 *REPORTE DE LA HOYA* 🚨\n\nEl acumulado va por: *${currentHoyaAmount.toFixed(2)} Bs*\n\n¡Cada cartón de 100 Bs hace crecer esto! Mañana seguimos. 💪`);
    });

    // 😴 10:00 PM - CIERRE DE OPERACIONES
    cron.schedule('0 22 * * *', () => {
        const despedida = getRandom(Content.CIERRE_NOCTURNO);
        broadcast(despedida);
        isOperatingHours = false;
    });
}

function checkOperationHours() {
    const hour = new Date().getHours();
    isOperatingHours = (hour >= 7 && hour < 22);
    console.log(`⏰ Hora actual: ${hour}h. ¿Operativo? ${isOperatingHours ? 'SÍ' : 'NO'}`);
}

// --- 2. MÓDULO DE ATENCIÓN Y VENTAS ---
client.on('message_create', async (msg) => {
    if (msg.fromMe) return;
    if (msg.from !== targetGroupId && !msg.from.includes('ME_ESTAS_PROBANDO')) return;

    const text = msg.body.toLowerCase();

    // COMANDOS INTERNOS
    if (text === '!silencio') { isOperatingHours = false; msg.reply('🤫 Modo silencio activado.'); return; }
    if (text === '!hablar') { isOperatingHours = true; msg.reply('🗣️ ¡A trabajar!'); return; }

    // Si estamos fuera de horario, ignoramos todo salvo comandos de admin
    if (!isOperatingHours) return;

    // RESPUESTAS DE VENTA (100 Bs / 500 Bs)
    if (text.includes('precio') || text.includes('cuanto') || text.includes('carton') || text.includes('comprar')) {
        // await simulateTyping(msg.chatId); // ELIMINADO PARA EVITAR CRASH
        msg.reply(`🎫 *INFO CARTÓN:*\n\n📉 Inversión: *100 Bs*\n📈 Ganancia: *500 Bs*\n\nPide el tuyo aquí antes de que se acaben: https://bingo-ve-delta.vercel.app/`);
    }

    if (text === '!status' || text === '!hoya') {
        msg.reply(`🏺 La Hoya está en: *${currentHoyaAmount.toFixed(2)} Bs* y subiendo. 🚀`);
    }

    if (text === '!link' || text === '!web') {
        msg.reply(`🔗 Entra a la sala aquí:\nhttps://bingo-ve-delta.vercel.app/`);
    }

    lastInteractionTime = Date.now();
});

// BIENVENIDA A NUEVOS (Gancho de Venta)
client.on('group_join', async (notification) => {
    if (notification.chatId !== targetGroupId) return;
    // Esperar un poco para no parecer bot spammer inmediato
    setTimeout(async () => {
        try {
            const contact = await client.getContactById(notification.recipientIds[0]);
            const name = contact.pushname || "Nuevo Ganador";
            broadcast(`👋 ¡Bienvenido/a @${name}! 🎱\n\nAquí la regla es simple:\nInviertes *100 Bs* ➡️ Ganas *500 Bs*.\n\nCompra tu primer cartón aquí: https://bingo-ve-delta.vercel.app/`, false); // false = con delay humano suave
        } catch (e) { console.error("Error bienvenida", e); }
    }, 5000);
});

// --- 3. MÓDULO DE ÁRBITRO (JUEGO) ---
let currentTicketsSold = 0;

function startTicketMonitoring() {
    // Escuchar conteo de tickets en tiempo real (Sincronizado con Admin)
    const configRef = ref(db, 'game/active/config');

    onValue(configRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.totalTickets !== undefined) {
            currentTicketsSold = Number(data.totalTickets);
            // console.log(`🎫 Tickets vendidos actualizados: ${currentTicketsSold}`);
        }
    });
}

function startGameMonitoring() {
    const gameRef = ref(db, 'game/active');
    let lastStatus = '';
    let lastBall = null;

    onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        if (data.status !== lastStatus) {
            handleStatusChange(data.status, data);
            lastStatus = data.status;
        }

        // NARRACIÓN DE BOLAS + EMOCIÓN
        if (data.status === 'active' && data.currentNumber && data.currentNumber !== lastBall) {
            let mensaje = `${Content.NARRACION_JUEGO.resumen_bola} *${data.currentNumber}*`;

            // 30% de probabilidad de lanzar una frase de animación extra
            if (Math.random() > 0.7) {
                const fraseExtra = getRandom(Content.NARRACION_JUEGO.animacion_extra);
                mensaje += `\n\n${fraseExtra}`;
            }

            broadcast(mensaje, true); // TRUE = Inmediato
            lastBall = data.currentNumber;
        }

        if (data.status === 'validating' && lastStatus === 'active') {
            broadcast("🛑 ¡PAREN TODO! ¡TENEMOS UN POSIBLE GANADOR! 🛑\n\nValidando cartón...", true);
        }
    });
}

function handleStatusChange(status, data) {
    if (!isOperatingHours) return; // Respetar horario salvo juego en vivo? 
    // Si hay juego en vivo a las 11PM, debería narrarlo igual. 
    // Ajuste: Forzar horario si status es active.. pero dejémoslo simple por ahora.

    switch (status) {
        case 'waiting':
            if (data.history && data.history.length > 0) {
                broadcast("🔄 Sala lista para nueva ronda. ¡A comprar cartones! (100 Bs -> 500 Bs)");
            }
            break;
        case 'countdown':
            broadcast(Content.NARRACION_JUEGO.aviso_previo);
            break;
        case 'active':
            broadcast(Content.NARRACION_JUEGO.inicio);
            break;
        case 'finished':
            const winner = data.winners ? data.winners[data.winners.length - 1] : null;
            if (winner) {
                const text = Content.NARRACION_JUEGO.ganador.replace('#TICKET_ID', winner.ticketId.slice(-5));
                broadcast(text);
            }
            break;
    }
}

// --- 4. MÓDULO FISCAL (HOYA) ---
function startFiscalMonitoring() {
    const hoyaRef = ref(db, 'game/hoya');
    onValue(hoyaRef, (snapshot) => {
        const hoya = snapshot.val();
        if (hoya !== null) {
            currentHoyaAmount = hoya;
            console.log(`💰 Hoya actualizada: ${currentHoyaAmount} Bs`);
        }
    });
}

// --- UTILIDADES ---
function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function broadcast(text) {
    if (!targetGroupId) return;
    try {
        // ENVÍO DIRECTO (Sin simulación de escritura para evitar lags y baneos por comportamiento extraño)
        await client.sendMessage(targetGroupId, text);
        console.log(`📤 Enviado: ${text.slice(0, 30)}...`);
    } catch (e) {
        console.error('Error enviando mensaje:', e.message);
    }
}

// --- SISTEMA ANTI-CAÍDAS ---
client.on('disconnected', (reason) => {
    console.log('⚠️ WhatsApp desconectado:', reason);
    console.log('🔄 Intentando reconexión automática...');
    client.initialize();
});

async function simulateTyping(chatId) {
    // Función mantenida por compatibilidad, pero ya no se usa en broadcast
    const chat = await client.getChatById(chatId);
    await chat.sendStateTyping();
    await new Promise(r => setTimeout(r, 2000));
}

// MANEJO DE ERRORES GLOBAL
process.on('uncaughtException', err => console.error('💥 Error Crítico:', err));

client.initialize();


