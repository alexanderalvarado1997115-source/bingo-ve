export interface UserProfile {
    uid: string;
    email: string | null;
    phone: string;
    displayName: string;
    createdAt: number;
    role: 'user' | 'admin';
}

export interface Ticket {
    id: string;
    userId: string;
    drawId: string;
    numbers: number[]; // All numbers on the ticket for quick check
    grid: number[][]; // 5x5 grid representation (0 for empty/free)
    markedNumbers: number[];
    purchaseTime: number;
}

export interface Draw {
    id: string;
    status: 'waiting' | 'active' | 'finished';
    startTime: number;
    drawnNumbers: number[];
    winners: Winner[];
    currentNumber: number | null;
}

export interface Winner {
    userId: string;
    ticketId: string;
    position: number;
    prize: number;
    timestamp: number;
    winningLine: number[]; // The numbers that made the line
}

export interface Payment {
    id: string;
    userId: string;
    phone: string;
    last4Digits?: string;
    reference: string;
    amount: number;
    ticketsCount: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: number;
    reviewedBy?: string;
    reviewedAt?: number;
}
