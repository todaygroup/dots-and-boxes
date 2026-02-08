import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionsService } from './sessions.service';
import { MakeMoveDto } from './dto/make-move.dto';

@WebSocketGateway({ cors: true })
export class SessionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private readonly sessionsService: SessionsService) { }

    handleConnection(client: Socket) {
        // console.log('Client connected:', client.id);
    }

    handleDisconnect(client: Socket) {
        // console.log('Client disconnected:', client.id);
    }

    @SubscribeMessage('join_session')
    async handleJoinSession(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionId: string; playerId: string },
    ) {
        if (!data.sessionId) return;

        try {
            const session = await this.sessionsService.join(data.sessionId, data.playerId);
            client.join(data.sessionId);

            // Notify client of current state immediately
            client.emit('session_state', session);

            // Broadcast that someone joined (optional, or just updated state)
            // If we want to track connection status strictly, we'd need more logic.
        } catch (e) {
            client.emit('error', { message: 'Session not found' });
        }
    }

    @SubscribeMessage('make_move')
    async handleMakeMove(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionId: string; move: MakeMoveDto },
    ) {
        try {
            const session = await this.sessionsService.makeMove(data.sessionId, data.move);
            this.server.to(data.sessionId).emit('session_state', session);

            if (session.status === 'FINISHED') {
                this.server.to(data.sessionId).emit('game_over', {
                    winner: session.board.winner,
                    scores: session.board.scores
                });
            }
        } catch (e: any) {
            client.emit('error', { message: e.message });
        }
    }
}
