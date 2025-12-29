/**
 * CEREBRO DE CONTENIDOS DEL BOT - BINGOVE
 * Este archivo contiene todas las frases, preguntas y dinámicas que el bot usará.
 */

const SALUDOS_DIARIOS = [
    "☀️ ¡Buenos días, familia BingoVE! Arrancamos el día con oportunidades de ganar. 💵\n\nRecuerden la matemática del éxito:\n🎟️ Inversión: *100 Bs*\n🏆 Ganancia: *500 Bs* por cartón.\n\n¿Quién se anota el primero?",
    "🌅 ¡Arriba ganadores! La sala está abierta. Con solo *100 Bs* puedes multiplicar tu dinero hoy.\n\nFaltan pocos cartones para la meta. ¡Activos!",
    "🚀 ¡Despierten! El sistema está listo. Cada cartón te da la chance de ganarte *500 Bs* netos. ¿Vas a dejar pasar esa oportunidad por solo 100 bolos?"
];

const CIERRE_NOCTURNO = [
    "🌙 ¡Cerramos operación por hoy! Gracias a todos los que jugaron e invirtieron.\nMañana volvemos a las 7 AM para repartir más ganancias de 500 Bs. 💤",
    "😴 El Bot se va a dormir. Recuerden: *100 Bs* hoy pueden ser *500 Bs* mañana. ¡Buenas noches y descansen!",
    "💤 ¡Hasta mañana equipo! La Hoya sigue engordando. Nos vemos en la mañana para seguir ganando."
];

const DINAMICAS_INTERACTIVAS = [
    {
        type: "venta",
        text: "💡 *Dato Financiero:* Si compras 5 cartones inviertes 500 Bs... ¡pero si ganas UNO solo recuperas y ganas! ¿Quién tiene esa mentalidad de tiburón hoy? 🦈"
    },
    {
        type: "pregunta",
        text: "🔥 ¿Qué harías con los *500 Bs* del premio de hoy? 🤔\n\nA) Re-invertir en más cartones 🎟️\nB) Una buena comida 🍔\nC) Guardarlos bajo el colchón 🛏️\n\n¡Los leo!"
    }
];

const LLAMADOS_ACCION_VENTA = [
    "👉 ¡Multiplica tu dinero! Compra a *100 Bs* y gana *500 Bs* aquí: ",
    "🎟️ Quedan cartones disponibles. Inversión mínima, ganancia máxima (500 Bs). Entra ya: ",
    "💰 ¿Ves a otros ganar 500 Bs y tú no? ¡Únete a la acción por solo 100 Bs! Link: "
];

const NARRACION_JUEGO = {
    inicio: "🚨 ¡SILENCIO EN LA SALA! 🚨\n\n🎱 COMIENZA EL SORTEO 🎱\n\nCartones en mano. Vamos por esos 500 Bs. ¡Suerte a todos! 🍀",
    aviso_previo: "⏳ ¡Atentos! Faltan 5 minutos. El que no compró a 100 Bs se va a perder la emoción de ganar 500. 🏃💨",
    ganador: "🏆 ¡¡¡BINGO CONFIRMADO!!! 🏆\n\nEl cartón *#TICKET_ID* se acaba de llevar el premio gordo. 🎉\n\n💵 Inversión: 100 Bs\n💰 Ganancia: 500 Bs\n\n¿Quién quiere la revancha en el próximo?",
    resumen_bola: "🎱 Salió el: ",
    animacion_extra: [
        "🔥 ¡Esto está que arde! ¿Te falta una? ¡Pídela con fe!",
        "👀 ¡Busquen bien! No se coman las bolas.",
        "🎟️ ¿Solo estás mirando? ¡Para el próximo únete! Son solo 100 Bs para entrar.",
        "📢 ¡El que no juega no gana! Mira lo emocionante que está esto."
    ]
};

module.exports = {
    SALUDOS_DIARIOS,
    CIERRE_NOCTURNO,
    DINAMICAS_INTERACTIVAS,
    LLAMADOS_ACCION_VENTA,
    NARRACION_JUEGO
};
