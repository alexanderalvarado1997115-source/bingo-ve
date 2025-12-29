# Plan Maestro de Transformación: Juega y Gana

Este documento detalla el plan de ejecución por fases para transformar la plataforma de "5-en-línea" a "Juega y Gana", incorporando automatización financiera, sistema de referidos y estructura multi-juego.

---

## 🏗️ Fase 1: Identidad y Estructura Base (El Nuevo Lobby)
**Objetivo:** Cambiar la identidad de la marca y reestructurar la navegación para soportar múltiples juegos.
*Esta fase no altera la lógica de dinero ni juegos, es puramente estructural y visual.*

### 1.1 Rebranding Global
- [ ] Actualizar metadatos `metadata` en `layout.tsx` (Título, Descripción).
- [ ] Cambiar textos visibles de "5-en-línea" a "Juega y Gana" en:
    - Login/Registro.
    - Navbar y Footers.
    - Correos/Mensajes del sistema (si existen plantillas visuales).
- [ ] Ajustar variables de entorno públicas si contienen el nombre de la app.

### 1.2 Dashboard Multi-Juego (Lobby)
- [ ] Crear nueva vista `Lobby` como página principal del Dashboard.
- [ ] Diseñar tarjetas de selección de juego:
    - **Bingo** (Estado: Activo).
    - **Tragamonedas/Slots** (Estado: Próximamente/Demo).
    - **Ruleta** (Estado: Próximamente/Demo).
- [ ] Mover la vista actual del Bingo a una sub-ruta `/game/bingo`.

---

## 🤝 Fase 2: Motor de Crecimiento (Referidos)
**Objetivo:** Implementar la lógica para que los usuarios ganen el 10% de las inversiones de sus invitados.

### 2.1 Estructura de Datos de Usuario
- [ ] Añadir campo `referralCode` único al crear usuario (en `auth-actions.ts`).
- [ ] Añadir campo `referredBy` (ID del referente) al perfil del usuario.
- [ ] Crear interfaz visual "Mi Red" para que el usuario vea su código y sus referidos.

### 2.2 Lógica de Comisiones (Trigger)
- [ ] Modificar `game-actions.ts` o `payment-listener.ts` (donde se procesa la compra de tickets).
- [ ] Implementar función `processReferralReward(userId, amount)`:
    - Buscar al `referredBy` del usuario.
    - Calcular el 10%.
    - Ejecutar `recordTransactionSafe` para abonar al saldo del referente (Tipo: `income`, Categoría: `referral_bonus`).

---

## 🤖 Fase 3: Automatización de Sala (Bingo)
**Objetivo:** Que el juego arranque solo cuando se cumplan las condiciones, sin intervención del admin.

### 3.1 Observador de Sala
- [ ] Modificar `game-actions.ts` para incluir chequeo de condiciones en `processPayment` o `buyTicket`.
- [ ] Implementar lógica: `if (totalSoldTickets >= 20 && currentState == 'waiting') -> startCountdown()`.

---

## 💳 Fase 4: Autonomía Financiera (Binance Pay)
**Objetivo:** Reemplazar la validación manual de capturas por validación automática vía API.

### 4.1 Backend de Integración
- [ ] Crear Endpoints API (`/api/payments/binance/create-order` y `/api/payments/binance/webhook/`).
- [ ] Implementar firma criptográfica para validar que el webhook viene realmente de Binance.

### 4.2 Frontend de Pagos
- [ ] Modificar el modal de "Recargar Saldo".
- [ ] Añadir opción "Pagar con Binance".
- [ ] Mostrar QR generado por la API.

---

## 📝 Registro de Progreso

| Fase | Tarea | Estado |
|------|-------|--------|
| **1.1** | Rebranding Global | ⬜ Pendiente |
| **1.2** | Nuevo Lobby Multi-juego | ⬜ Pendiente |
| **2.1** | Datos de Usuario (Referidos) | ⬜ Pendiente |
| **2.2** | Lógica de Comisiones 10% | ⬜ Pendiente |
| **3.1** | Automatización Inicio Bingo (>20) | ⬜ Pendiente |
| **4.1** | Backend Binance API | ⬜ Pendiente |
| **4.2** | Frontend Binance QR | ⬜ Pendiente |
