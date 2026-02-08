import { BoardState } from '@dots-game/game-logic';
import { GameStatus } from '@prisma/client';

export interface GameSession {
    id: string;
    board: BoardState;
    players: { [key: number]: string | null };
    status: GameStatus;
    winner: number | null;
    createdAt: Date;
    updatedAt: Date;
}
