/**
 * Checks if a ticket has a winning condition.
 * NOW STRICTLY 25 NUMBERS (FULL HOUSE).
 */
export const checkWinner = (ticketNumbers: number[], drawnNumbers: number[]) => {
    // 0 is always marked
    const allDrawn = [...drawnNumbers, 0];

    // Check if EVERY number in the ticket is in allDrawn
    const isFullHouse = ticketNumbers.every(num => allDrawn.includes(num));

    return isFullHouse;
};

/**
 * Returns the winning details.
 */
export const getWinningDetails = (ticketNumbers: number[], drawnNumbers: number[]) => {
    const allDrawn = [...drawnNumbers, 0];
    const isFullHouse = ticketNumbers.every(num => allDrawn.includes(num));

    if (isFullHouse) {
        return { type: 'Cartón Lleno', numbers: ticketNumbers };
    }

    return null;
}
