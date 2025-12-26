/**
 * Checks if a ticket has a winning condition (Row, Column, or Diagonal).
 * Supports 5x5 Matrix (25 cells) with 0 as FREE Space.
 * ticketNumbers SHOULD be the row-major flat array of 25 numbers.
 */
export const checkWinner = (ticketNumbers: number[], drawnNumbers: number[]) => {
    // 0 is always marked
    const allDrawn = [...drawnNumbers, 0];

    // Check Rows
    for (let r = 0; r < 5; r++) {
        const row = [
            ticketNumbers[r * 5],
            ticketNumbers[r * 5 + 1],
            ticketNumbers[r * 5 + 2],
            ticketNumbers[r * 5 + 3],
            ticketNumbers[r * 5 + 4]
        ];
        if (row.every(num => allDrawn.includes(num))) return true;
    }

    // Check Columns
    for (let c = 0; c < 5; c++) {
        const col = [
            ticketNumbers[c],
            ticketNumbers[c + 5],
            ticketNumbers[c + 10],
            ticketNumbers[c + 15],
            ticketNumbers[c + 20]
        ];
        if (col.every(num => allDrawn.includes(num))) return true;
    }

    // Check Diagonals
    const d1 = [ticketNumbers[0], ticketNumbers[6], ticketNumbers[12], ticketNumbers[18], ticketNumbers[24]];
    const d2 = [ticketNumbers[4], ticketNumbers[8], ticketNumbers[12], ticketNumbers[16], ticketNumbers[20]];

    if (d1.every(num => allDrawn.includes(num))) return true;
    if (d2.every(num => allDrawn.includes(num))) return true;

    return false;
};

/**
 * Returns the winning numbers if any.
 */
export const getWinningDetails = (ticketNumbers: number[], drawnNumbers: number[]) => {
    const allDrawn = [...drawnNumbers, 0];

    // Rows
    for (let r = 0; r < 5; r++) {
        const indices = [r * 5, r * 5 + 1, r * 5 + 2, r * 5 + 3, r * 5 + 4];
        const row = indices.map(i => ticketNumbers[i]);
        if (row.every(num => allDrawn.includes(num))) return { type: 'row', numbers: row };
    }

    // Cols
    for (let c = 0; c < 5; c++) {
        const indices = [c, c + 5, c + 10, c + 15, c + 20];
        const col = indices.map(i => ticketNumbers[i]);
        if (col.every(num => allDrawn.includes(num))) return { type: 'column', numbers: col };
    }

    // Diagonals
    const d1Indices = [0, 6, 12, 18, 24];
    const d1 = d1Indices.map(i => ticketNumbers[i]);
    if (d1.every(num => allDrawn.includes(num))) return { type: 'diagonal', numbers: d1 };

    const d2Indices = [4, 8, 12, 16, 20];
    const d2 = d2Indices.map(i => ticketNumbers[i]);
    if (d2.every(num => allDrawn.includes(num))) return { type: 'diagonal', numbers: d2 };

    return null;
}
