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
import { ClassroomService } from './classroom.service';

@WebSocketGateway({ cors: true })
export class ClassroomGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private readonly classroomService: ClassroomService) { }

    handleConnection(client: Socket) { }
    handleDisconnect(client: Socket) { }

    @SubscribeMessage('join_class')
    async handleJoinClass(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { code: string; name: string; isTeacher?: boolean },
    ) {
        try {
            const classSession = await this.classroomService.getClass(data.code);
            if (!classSession) {
                client.emit('error', { message: 'Class not found' });
                return;
            }

            client.join(`class_${data.code}`);

            if (!data.isTeacher) {
                const student = await this.classroomService.joinClass(data.code, data.name, client.id);
                // Notify current client of their ID
                client.emit('joined_class', { studentId: student.id, code: data.code });
            } else {
                client.emit('joined_class', { code: data.code, isTeacher: true });
            }

            // Broadcast updated list to everyone in class (Mainly Teacher)
            const updatedClass = await this.classroomService.getClass(data.code);
            this.server.to(`class_${data.code}`).emit('class_updated', updatedClass);

        } catch (e: any) {
            client.emit('error', { message: e.message });
        }
    }

    @SubscribeMessage('start_class_game')
    async handleStartGame(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { code: string },
    ) {
        try {
            const result = await this.classroomService.startGame(data.code);

            if (!result.success) {
                client.emit('error', { message: result.message });
                return;
            }

            // Notify each student pair
            if (result.games) {
                result.games.forEach(game => {
                    // We need to send 'game_started' event to specific students.
                    // Since we might not have reliable socket mapping if they reconnected,
                    // we can broadcast to the room and let clients check if they are in the game?
                    // Or better, sends to specific socketIds if stored.

                    if (game.p1.socketId) {
                        this.server.to(game.p1.socketId).emit('game_started', { sessionId: game.sessionId, opponent: game.p2.name });
                    }
                    if (game.p2.socketId) {
                        this.server.to(game.p2.socketId).emit('game_started', { sessionId: game.sessionId, opponent: game.p1.name });
                    }
                });
            }

            // Notify teacher
            this.server.to(`class_${data.code}`).emit('class_updated', this.classroomService.getClass(data.code));

        } catch (e: any) {
            client.emit('error', { message: e.message });
        }
    }
}
