import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { GameSession } from './sessions.interface';
import { CreateSessionDto } from './dto/create-session.dto';
import { MakeMoveDto } from './dto/make-move.dto';
import { createBoard, makeMove, BoardState, Move } from '@dots-game/game-logic';
import { PrismaService } from '../prisma/prisma.service';
import { GameStatus, GameMode, UserType } from '@prisma/client';

@Injectable()
export class SessionsService {
    constructor(private prisma: PrismaService) { }

    async create(createSessionDto: CreateSessionDto): Promise<GameSession> {
        const { width = 3, height = 3 } = createSessionDto;
        const board = createBoard(width, height);

        const session = await this.prisma.gameSession.create({
            data: {
                status: 'WAITING',
                mode: GameMode.LOCAL_2P, // Default to LOCAL_2P if not specified
                boardWidth: width,
                boardHeight: height,
                players: { 0: null, 1: null },
                boardState: board as any, // Cast to any for Json type compatibility
            }
        });

        return this.mapToGameSession(session);
    }

    async findAll(): Promise<GameSession[]> {
        const sessions = await this.prisma.gameSession.findMany();
        return sessions.map(s => this.mapToGameSession(s));
    }

    async findOne(id: string): Promise<GameSession> {
        const session = await this.prisma.gameSession.findUnique({
            where: { id }
        });

        if (!session) {
            throw new NotFoundException(`Session with ID ${id} not found`);
        }
        return this.mapToGameSession(session);
    }

    async join(id: string, playerId: string): Promise<GameSession> {
        const session = await this.findOne(id);

        if (session.status === 'FINISHED') {
            throw new BadRequestException('Game is finished');
        }

        const players = session.players;
        // Simple join logic: fill empty slots
        if (!players[0]) {
            players[0] = playerId;
        } else if (!players[1]) {
            players[1] = playerId;
        } else {
            // Check if player is already in
            if (players[0] !== playerId && players[1] !== playerId) {
                throw new BadRequestException('Session is full');
            }
        }

        const updatedSession = await this.prisma.gameSession.update({
            where: { id },
            data: {
                players: players as any,
                status: (players[0] && players[1]) ? 'PLAYING' : 'WAITING'
            }
        });

        return this.mapToGameSession(updatedSession);
    }

    private mapToGameSession(prismaSession: any): GameSession {
        return {
            id: prismaSession.id,
            board: prismaSession.boardState as BoardState,
            players: prismaSession.players as { [key: number]: string | null },
            status: prismaSession.status as GameStatus,
            winner: prismaSession.winner,
            createdAt: prismaSession.createdAt,
            updatedAt: prismaSession.updatedAt,
        };
    }

    async makeMove(id: string, moveDto: MakeMoveDto): Promise<GameSession> {
        const session = await this.findOne(id);

        if (session.status !== 'PLAYING') {
            throw new BadRequestException('Game is not active');
        }

        // Check turn
        if (session.board.currentPlayer !== moveDto.playerIndex) {
            throw new BadRequestException('Not your turn');
        }

        const move: Move = {
            type: moveDto.type,
            row: moveDto.row,
            col: moveDto.col
        };

        const result = makeMove(session.board, move);

        if (!result.isValid) {
            throw new BadRequestException('Invalid move');
        }

        const newState = result.newState;
        let newStatus: GameStatus = session.status as GameStatus;
        let winner = session.winner;

        if (newState.winner !== null || (newState.scores[0] + newState.scores[1] === (newState.width - 1) * (newState.height - 1))) {
            newStatus = GameStatus.FINISHED;
            winner = newState.winner;
        }

        // Use transaction to ensure atomicity
        const [updatedSession] = await this.prisma.$transaction([
            this.prisma.gameSession.update({
                where: { id },
                data: {
                    boardState: newState as any,
                    status: newStatus,
                    winner: winner,
                    currentTurn: newState.currentPlayer // Assuming we track whose turn it is
                }
            }),
            this.prisma.move.create({
                data: {
                    sessionId: id,
                    playerIndex: moveDto.playerIndex,
                    turnNumber: 0, // We need to track turn number properly if needed, or just auto-increment
                    edgeKey: `${move.type}-${move.row}-${move.col}`,
                }
            })
        ]);

        return this.mapToGameSession(updatedSession);
    }
}
