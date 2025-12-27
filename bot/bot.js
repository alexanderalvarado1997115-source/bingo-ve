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

console.log('--- Configurando Firebase ---');
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
console.log('✅ Firebase listo.');

console.log('--- Preparando motor de WhatsApp (Chrome) ---');
// Configuración del Cliente de WhatsApp optimizada para Windows
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './session' }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
        executablePath: process.env.CHROME_PATH || undefined // Opcional por si falla el descargado
    }
});

console.log('⏳ Inicializando cliente... (Esto puede tardar 30-60 segundos la primera vez)');

// ID del Grupo de WhatsApp (Se obtiene escribiendo !id en el grupo)
// Alexander, ya tenemos tu ID: 120363404003479470@g.us
let targetGroupId = '120363404003479470@g.us';

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

// Comandos de Utilidad - Usamos message_create para que detecte tus propios mensajes de prueba
client.on('message_create', async (msg) => {
    // 🔥 REGLA DE ORO: Si el mensaje lo envió el bot (fromMe), ignorarlo para evitar bucles
    if (msg.fromMe) return;

    const text = msg.body.toLowerCase().trim();

    // Solo logueamos si empieza con ! para no llenar la consola de spam
    if (text.startsWith('!')) {
        console.log(`📩 [COMANDO DETECTADO]: "${msg.body}" de ${msg.from}`);
    }

    // --- 1. COMANDOS MANUALES ---

    if (text === '!id') {
        try {
            const chat = await msg.getChat();
            if (chat.isGroup) {
                await msg.reply(`📍 ID de este grupo: ${chat.id._serialized}\nCopia esto y pégalo en bot.js`);
            }
        } catch (err) { console.error(err); }
    }

    if (text === '!ayuda' || text === '!menu') {
        const manual = `*🌐 BINGO VE - MENÚ DE AYUDA* 🤖
        
¡Hola! Soy tu asistente virtual. Usa estos comandos para aprender a jugar:

👉 *!web* - Enlace oficial del Bingo.
👉 *!comprar* - Cómo comprar tus cartones.
👉 *!jugar* - Cómo jugar y cantar BINGO.
👉 *!status* - Estado actual del sorteo.

_Escribe el comando que necesites y te guiaré paso a paso._`;
        broadcast(manual);
    }

    if (text === '!web' || text === '!link') {
        broadcast(`*🔗 ENLACE OFICIAL:*
https://bingo-ve-delta.vercel.app/

*Nota:* Regístrate con tu correo de Google para que el sistema guarde tus cartones automáticamente.`);
    }

    if (text === '!comprar' || text === '!pago') {
        broadcast(`*💰 ¿CÓMO COMPRAR CARTONES?*

1️⃣ Entra a la Web y haz clic en *"+ Comprar Cartones"*.
2️⃣ Realiza el *Pago Móvil* con los datos que aparecen en pantalla.
3️⃣ Pega el número de referencia y confirma tu compra.
4️⃣ ¡Listo! El Admin aprobará tu pago en minutos y verás tus cartones en el Dashboard.`);
    }

    if (text === '!jugar' || text === '!como_jugar') {
        broadcast(`*🎮 ¿CÓMO SE JUEGA?*

✅ *Automático:* Los números de tus cartones se marcan solos a medida que salen las bolas.
✅ *Tensión:* El bot avisará cuando alguien esté a punto de ganar.
✅ *Ganar:* Si completas tu cartón, aparecerá un botón gigante de *¡CANTAR BINGO!*. ¡Prensa ese botón rápido!`);
    }

    if (text === '!ping') {
        msg.reply('🏓 ¡Pong! El bot está activo y vigilando.');
    }

    if (msg.body === '!status') {
        msg.reply('🤖 El Árbitro de BingoVE está activo y vigilando el sorteo.');
    }

    // --- 2. AUTO-RESPONDER POR PALABRAS CLAVE (HUMANIZADO) ---

    const keywords = {
        pago: [
            // Calle / Informal
            "como pago", "donde pago", "precio", "cuanto vale", "pago movil", "cuenta", "banco", "transferencia", "bs", "bolos", "bolivares", "cuesta", "compro", "comprar", "compras", "carton", "cartones", "ticket", "tickets", "tique", "tikes", "pagar", "plata", "presio", "vane", "valen", "cuanto es", "deposito", "transfer", "billete", "chirola", "pago movi", "cuanto sale", "dale el precio", "pasa los datos",
            // Educado / Formal
            "podría decirme el precio", "quisiera comprar", "métodos de pago", "costo del cartón", "adquirir", "información de compra", "deseo realizar el pago",
            // Super Educado
            "estimado, deseo información sobre la adquisición de boletos", "proceder con el pago", "solicito los datos bancarios para la transacción", "agradecería los detalles de facturación", "procedimientos de adquisición", "formalizar mi participación"
        ],
        link: [
            // Calle / Informal
            "pasa el link", "cual es la web", "donde entro", "url", "pagina", "sitio", "link de la sala", "entrar", "enlace", "paguina", "pasa el lin", "pasen el lin", "direcion", "pasa la vaina", "link por fa", "mandame el link",
            // Educado / Formal
            "me proporciona el enlace", "quisiera el link de la sala para ingresar", "página oficial", "dirección web", "acceso a la plataforma",
            // Super Educado
            "le agradecería que me facilitara el portal oficial de acceso", "solicito el hipervínculo para la plataforma de juego", "portal de participación", "plataforma tecnológica", "podría suministrar la dirección electrónica"
        ],
        instrucciones: [
            // Calle / Informal
            "como se juega", "ayuda", "no entiendo", "tutorial", "instrucciones", "reglas", "que hay que hacer", "como gano", "esplicame", "esplica", "intrucion", "intruciones", "como e", "explicacion", "dime q hago", "no se como es", "una mano aqui", "ayudame", "pasos",
            // Educado / Formal
            "podría explicarme la dinámica", "necesito asistencia para entender las reglas", "funcionamiento del bingo", "instrucciones de juego", "guía para participar",
            // Super Educado
            "solicito orientación sobre el funcionamiento del sistema", "le agradecería una explicación detallada de los procedimientos", "normativas del sorteo", "técnicas de juego", "manual de usuario"
        ],
        premios: [
            // Calle / Informal
            "cuanto gano", "que premios hay", "premio", "cuanto pagan", "premios de hoy", "dinero", "ganancia", "cuanto hay", "morocho", "cuanto es el premio", "el pote", "cuanto es el acumulado", "que dan", "premios reales",
            // Educado / Formal
            "monto del premio", "premios se entregarán", "tabla de premios", "incentivos de hoy", "premio mayor",
            // Super Educado
            "solicito información sobre la bolsa de premios acumulada", "quisiera conocer la escala de compensación para los ganadores", "detalles de la premiación", "incentivos económicos", "compensación oficial"
        ]
    };

    if (keywords.pago.some(k => text.includes(k))) {
        broadcast("💰 *Info de Pagos:* Veo que tienes dudas con el pago. Escribe *!comprar* para que te pase los datos del Pago Móvil y el manual paso a paso.");
    } else if (keywords.link.some(k => text.includes(k))) {
        broadcast("🔗 *Link de Salida:* ¡Aquí tienes el acceso! Escribe *!web* y te responderé con el enlace directo para entrar a jugar.");
    } else if (keywords.instrucciones.some(k => text.includes(k))) {
        broadcast("📖 *Tutorial Rápido:* ¿Deseas aprender a jugar? Escribe *!jugar* para explicarte cómo funciona nuestra tecnología automática.");
    } else if (keywords.premios.some(k => text.includes(k))) {
        broadcast("🏆 *Premios:* Los premios varían cada día según la cantidad de cartones. Escribe *!status* para ver el acumulado de hoy.");
    }
});

// Captura de Errores Globales del Cliente
client.on('auth_failure', (msg) => console.error('❌ Error de Autenticación:', msg));
client.on('disconnected', (reason) => console.log('❌ El Bot se desconectó:', reason));

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
    let gameStartTimeRef = null; // Para medir la hora desde el primer ticket

    // --- Lógica de Horarios y Finanzas (7:00 AM - 10:00 PM) ---
    let isBotActive = true;
    let currentHoyaAmount = 0;

    // Escuchamos la Hoya en tiempo real para tener el dato fresco
    onValue(ref(db, 'financials'), (snapshot) => {
        if (snapshot.exists()) {
            currentHoyaAmount = snapshot.val().hoya || 0;
        }
    });

    setInterval(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentSecond = now.getSeconds();

        // 7:00 AM - ACTIVACIÓN
        if (currentHour === 7 && currentMinute === 0 && currentSecond === 0) {
            isBotActive = true;
            broadcast(`☀️ *¡BUENOS DÍAS BINGUEROS!* ☕
            
La mesa ya está abierta. Hoy *La Hoya* inicia con: *${currentHoyaAmount.toFixed(2)} Bs*. 💎

¿Quién se atreve a llevarse el premio hoy? 🍀
🔗 Entra aquí: https://bingo-ve-delta.vercel.app/`);
        }

        // 9:30 PM - REPORTE DE LA HOYA
        if (currentHour === 21 && currentMinute === 30 && currentSecond === 0) {
            broadcast(`📢 *¡REPORTE DE LA HOYA!* 🏺
            
Nuestra bolsa semanal sigue creciendo. Al cierre de hoy tenemos acumulados:
💰 *${currentHoyaAmount.toFixed(2)} Bs*

Recuerden que mañana seguimos sumando. El Viernes... ¡alguien se lo lleva TODO! 🔥🎰`);
        }

        // 10:00 PM - CIERRE
        if (currentHour === 22 && currentMinute === 0 && currentSecond === 0) {
            broadcast(`🌙 *HORA DE DESCANSAR...*
            
Cerrando transmisiones por hoy. Mañana volvemos a las 7:00 AM. ¡Feliz noche! 💤`);
            isBotActive = false;
        }
    }, 1000);

    let isFirstRun = true;

    onValue(gameRef, async (snapshot) => {
        if (!isBotActive) return; // Si el bot está dormido, no procesa cambios de juego

        const data = snapshot.val();
        if (!data) return;

        // --- ANTI-ECO: Sincronización silenciosa al arrancar ---
        if (isFirstRun) {
            lastStatus = data.status;
            lastBall = data.currentNumber || null;
            isFirstRun = false;
            console.log(`📡 [BOT]: Sincronización inicial completada. Estado: ${data.status}`);
            return;
        }

        const totalSold = data.config?.totalTickets || 0;
        const status = data.status;

        // --- Lógica de Motivación Dinámica y Auto-Start ---
        if (status === 'waiting' && totalSold > 0) {
            if (!gameStartTimeRef) gameStartTimeRef = Date.now(); // Marcamos inicio de venta

            const elapsedMins = Math.floor((Date.now() - gameStartTimeRef) / 60000);

            // Regla de Oro: 10+ jugadores y 60 mins de espera -> INICIO FORZADO
            if (totalSold >= 10 && elapsedMins >= 60) {
                broadcast(`🔥 *¡VÁMONOS RECIO!* Ya tenemos ${totalSold} valientes y ha pasado una hora. ¡Iniciamos sorteo con los que estamos! 🎰`);
                // Aquí podrías disparar el inicio en la base de datos si quieres automatizarlo total:
                // update(gameRef, { status: 'countdown', countdownStartTime: Date.now() });
                gameStartTimeRef = null;
            }

            // Recordatorios Motivadores cada 20 tickets
            if (totalSold % 20 === 0 && totalSold > 0) {
                broadcast(`📈 *¡Esto se está calentando!* Ya son ${totalSold} cartones en juego. ¡Faltan menos para la meta! 🚀`);
            }
        } else {
            gameStartTimeRef = null; // Reiniciamos si el juego empezó o se reseteó
        }

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
 * FUNCIÓN DE ENVÍO MASIVO - VERSIÓN SEGURA (ANTIBAN)
 * Simula comportamiento humano: Marca el chat como "Escribiendo..." 
 * y añade un retraso aleatorio basado en la longitud del mensaje.
 */
async function broadcast(text) {
    if (!targetGroupId) {
        console.log(`[SIMULACIÓN WHATSAPP]: ${text}`);
        return;
    }

    try {
        const chat = await client.getChatById(targetGroupId);

        // 1. Simular "Escribiendo..."
        await chat.sendStateTyping();

        // 2. Calcular tiempo humano (Escribiría a unos 20ms por carácter + pausa al azar)
        const writingTime = Math.min(Math.max(text.length * 15, 1500), 4000);
        const humanJitter = Math.floor(Math.random() * 1000) + 500; // Entre 0.5s y 1.5s extra al azar

        // 3. Esperar antes de enviar
        await new Promise(resolve => setTimeout(resolve, writingTime + humanJitter));

        // 4. Enviar mensaje y limpiar estado
        await client.sendMessage(targetGroupId, text);
        await chat.clearState();

        console.log(`✅ [BOT]: Mensaje enviado con éxito (${writingTime + humanJitter}ms delay)`);
    } catch (err) {
        console.error("❌ Error al enviar mensaje:", err.message);
    }
}

client.initialize();
