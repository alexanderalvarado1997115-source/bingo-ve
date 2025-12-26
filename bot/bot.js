require('dotenv').config({ path: '../.env.local' });
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, onValue } = require('firebase/database');

/**
 * BINGO VE - WHATSAPP ARBITRATOR BOT
 * Este bot sincroniza el estado del juego con un grupo de WhatsApp.
 */

// Configuración de Firebase (Se extrae del .env.local del proyecto principal)
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log('--- Iniciando Conexión con Firebase ---');
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Configuración del Cliente de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './session' }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        handleSIGINT: false
    }
});

// ID del Grupo de WhatsApp (Se obtiene escribiendo !id en el grupo)
// Alexander, una vez que el bot esté listo, escribe !id en tu grupo y pega el resultado aquí.
let targetGroupId = '';

client.on('qr', (qr) => {
    console.log('\n--- ESCANEA ESTE CÓDIGO QR CON TU WHATSAPP ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ ¡WHATSAPP BOT CONECTADO Y LISTO!');
    console.log('1. Escribe !id en el grupo de WhatsApp para obtener su identificador.');
    console.log('2. Pega ese ID en la variable targetGroupId dentro de este archivo bot.js');
    console.log('--------------------------------------------------\n');
    startMonitoring();
});

// Comandos de Utilidad
client.on('message', async (msg) => {
    if (msg.body === '!id') {
        const chat = await msg.getChat();
        if (chat.isGroup) {
            msg.reply(`📍 ID de este grupo: ${chat.id._serialized}\nCopia esto y pégalo en bot.js`);
        } else {
            msg.reply('Este comando solo funciona dentro de grupos.');
        }
    }

    if (msg.body === '!status') {
        msg.reply('🤖 El Árbitro de BingoVE está activo y vigilando el sorteo.');
    }
});

/**
 * MONITOR DE FIREBASE
 * Escucha cambios en el estado del juego y los anuncia en WhatsApp.
 */
function startMonitoring() {
    const gameRef = ref(db, 'game/active');
    let lastStatus = '';
    let lastBall = null;
    let lastSocialMsg = '';
    let countdownInterval = null;

    onValue(gameRef, async (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // 1. Cambios de Estado (Transiciones)
        if (data.status !== lastStatus) {
            handleStatusChange(data.status, data);
            lastStatus = data.status;

            // Gestionar recordatorios de cuenta regresiva
            if (data.status === 'countdown') {
                startCountdownAnnouncements(data.countdownStartTime);
            } else {
                if (countdownInterval) clearInterval(countdownInterval);
            }
        }

        // 2. Anuncio de Bolitas
        if (data.currentNumber && data.currentNumber !== lastBall) {
            if (data.status === 'active') {
                broadcast(`🔴 *Bola # ${data.history.length}:* [ *${data.currentNumber}* ]`);
            }
            lastBall = data.currentNumber;
        }

        // 3. Mensajes del Árbitro (Tensión / Bingo)
        if (data.socialStatus?.message && data.socialStatus.message !== lastSocialMsg) {
            // Solo enviamos mensajes de alta tensión o eventos especiales para no saturar
            if (data.socialStatus.tensionLevel === 'high' || data.socialStatus.tensionLevel === 'imminent' || data.status === 'validating') {
                broadcast(`⚖️ *ARBITRO:* ${data.socialStatus.message}`);
            }
            lastSocialMsg = data.socialStatus.message;
        }
    });
}

/**
 * LÓGICA DE ANUNCIOS POR ESTADO
 */
function handleStatusChange(status, data) {
    switch (status) {
        case 'waiting':
            broadcast("🔄 *SISTEMA REINICIADO:* Mesa limpia. Ya pueden comprar cartones para la siguiente jugada. ¡Mucha suerte!");
            break;
        case 'active':
            broadcast("🎰 *¡SORTEO EN VIVO!* El juego ha comenzado. ¡Silencio en la sala y buena suerte a todos!");
            break;
        case 'validating':
            broadcast("🏆 *¡ALERTA DE BINGO!* Un jugador reclama la victoria. El sorteo se congela para validación técnica.");
            break;
        case 'finished':
            const winner = data.winners?.[data.winners.length - 1];
            broadcast(`🏁 *¡JUEGO FINALIZADO!* ${winner ? 'Tenemos un ganador oficial.' : 'El sorteo ha terminado.'}`);
            break;
    }
}

/**
 * ANUNCIOS DE CUENTA REGRESIVA MINUTO A MINUTO
 */
function startCountdownAnnouncements(startTime) {
    if (!startTime) return;

    // Anuncio inicial
    broadcast("⚠️ *ATENCIÓN:* El sorteo inicia en *5 minutos*. ¡Entren a la sala de inmediato!");

    const announcePoints = [4, 3, 2, 1];
    let pointsIndex = 0;

    const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remainingMins = Math.floor((300 - elapsed) / 60);

        if (remainingMins === announcePoints[pointsIndex]) {
            broadcast(`⏳ *CRONÓMETRO:* Faltan *${remainingMins} minutos* para empezar. ¡Última oportunidad para entrar!`);
            pointsIndex++;
        }

        if (elapsed >= 300) {
            clearInterval(interval);
        }
    }, 10000); // Revisar cada 10 segundos
}

/**
 * FUNCIÓN DE ENVÍO MASIVO
 */
async function broadcast(text) {
    if (!targetGroupId) {
        console.log(`[SIMULACIÓN WHATSAPP]: ${text}`);
        return;
    }
    try {
        await client.sendMessage(targetGroupId, text);
    } catch (err) {
        console.error("❌ Error al enviar mensaje:", err.message);
    }
}

client.initialize();
