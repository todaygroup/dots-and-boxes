import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Sessions API (e2e)', () => {
    let app: INestApplication<App>;
    let prisma: PrismaService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);
    });

    afterAll(async () => {
        await prisma.$disconnect();
        await app.close();
    });

    beforeEach(async () => {
        // Clean up database before each test
        await prisma.gameSession.deleteMany({});
        await prisma.move.deleteMany({});
    });

    describe('/sessions (POST)', () => {
        it('should create a new game session', () => {
            return request(app.getHttpServer())
                .post('/sessions')
                .send({ width: 3, height: 3 })
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body.width).toBe(3);
                    expect(res.body.height).toBe(3);
                    expect(res.body.status).toBe('WAITING');
                    expect(res.body.players).toEqual([]);
                });
        });

        it('should create session with default dimensions', () => {
            return request(app.getHttpServer())
                .post('/sessions')
                .send({})
                .expect(201)
                .expect((res) => {
                    expect(res.body.width).toBe(3);
                    expect(res.body.height).toBe(3);
                });
        });

        it('should persist session to database', async () => {
            const response = await request(app.getHttpServer())
                .post('/sessions')
                .send({ width: 4, height: 4 });

            const sessionId = response.body.id;
            const dbSession = await prisma.gameSession.findUnique({
                where: { id: sessionId },
            });

            expect(dbSession).toBeDefined();
            expect(dbSession?.boardWidth).toBe(4);
            expect(dbSession?.boardHeight).toBe(4);
        });
    });

    describe('/sessions/:id (GET)', () => {
        it('should get session by id', async () => {
            const createRes = await request(app.getHttpServer())
                .post('/sessions')
                .send({ width: 3, height: 3 });

            const sessionId = createRes.body.id;

            return request(app.getHttpServer())
                .get(`/sessions/${sessionId}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.id).toBe(sessionId);
                    expect(res.body.width).toBe(3);
                });
        });

        it('should return 404 for non-existent session', () => {
            return request(app.getHttpServer())
                .get('/sessions/non-existent-id')
                .expect(404);
        });
    });

    describe('/sessions/:id/join (POST)', () => {
        it('should join a session as player', async () => {
            const createRes = await request(app.getHttpServer())
                .post('/sessions')
                .send({ width: 3, height: 3 });

            const sessionId = createRes.body.id;

            return request(app.getHttpServer())
                .post(`/sessions/${sessionId}/join`)
                .send({ playerId: 'player1' })
                .expect(200)
                .expect((res) => {
                    expect(res.body.players).toContain('player1');
                });
        });

        it('should allow two players to join', async () => {
            const createRes = await request(app.getHttpServer())
                .post('/sessions')
                .send({ width: 3, height: 3 });

            const sessionId = createRes.body.id;

            await request(app.getHttpServer())
                .post(`/sessions/${sessionId}/join`)
                .send({ playerId: 'player1' });

            return request(app.getHttpServer())
                .post(`/sessions/${sessionId}/join`)
                .send({ playerId: 'player2' })
                .expect(200)
                .expect((res) => {
                    expect(res.body.players).toHaveLength(2);
                    expect(res.body.status).toBe('ACTIVE');
                });
        });
    });

    describe('/sessions/:id/move (POST)', () => {
        it('should make a valid move', async () => {
            const createRes = await request(app.getHttpServer())
                .post('/sessions')
                .send({ width: 3, height: 3 });

            const sessionId = createRes.body.id;

            await request(app.getHttpServer())
                .post(`/sessions/${sessionId}/join`)
                .send({ playerId: 'player1' });

            await request(app.getHttpServer())
                .post(`/sessions/${sessionId}/join`)
                .send({ playerId: 'player2' });

            return request(app.getHttpServer())
                .post(`/sessions/${sessionId}/move`)
                .send({
                    playerId: 'player1',
                    move: { type: 'horizontal', row: 0, col: 0 }
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body.isValid).toBe(true);
                });
        });

        it('should reject invalid move', async () => {
            const createRes = await request(app.getHttpServer())
                .post('/sessions')
                .send({ width: 3, height: 3 });

            const sessionId = createRes.body.id;

            await request(app.getHttpServer())
                .post(`/sessions/${sessionId}/join`)
                .send({ playerId: 'player1' });

            await request(app.getHttpServer())
                .post(`/sessions/${sessionId}/join`)
                .send({ playerId: 'player2' });

            return request(app.getHttpServer())
                .post(`/sessions/${sessionId}/move`)
                .send({
                    playerId: 'player1',
                    move: { type: 'horizontal', row: 10, col: 10 } // Out of bounds
                })
                .expect(400);
        });

        it('should persist moves to database', async () => {
            const createRes = await request(app.getHttpServer())
                .post('/sessions')
                .send({ width: 3, height: 3 });

            const sessionId = createRes.body.id;

            await request(app.getHttpServer())
                .post(`/sessions/${sessionId}/join`)
                .send({ playerId: 'player1' });

            await request(app.getHttpServer())
                .post(`/sessions/${sessionId}/join`)
                .send({ playerId: 'player2' });

            await request(app.getHttpServer())
                .post(`/sessions/${sessionId}/move`)
                .send({
                    playerId: 'player1',
                    move: { type: 'horizontal', row: 0, col: 0 }
                });

            const moves = await prisma.move.findMany({
                where: { sessionId },
            });

            expect(moves).toHaveLength(1);
            expect(moves[0].edgeKey).toBeDefined();
            expect(moves[0].sessionId).toBe(sessionId);
        });
    });

    describe('Game Flow', () => {
        it('should complete a full game', async () => {
            const createRes = await request(app.getHttpServer())
                .post('/sessions')
                .send({ width: 3, height: 3 }); // 2x2 boxes

            const sessionId = createRes.body.id;

            await request(app.getHttpServer())
                .post(`/sessions/${sessionId}/join`)
                .send({ playerId: 'player1' });

            await request(app.getHttpServer())
                .post(`/sessions/${sessionId}/join`)
                .send({ playerId: 'player2' });

            // Play all moves to complete the game
            const moves = [
                { type: 'horizontal', row: 0, col: 0 },
                { type: 'horizontal', row: 0, col: 1 },
                { type: 'horizontal', row: 1, col: 0 },
                { type: 'horizontal', row: 1, col: 1 },
                { type: 'horizontal', row: 2, col: 0 },
                { type: 'horizontal', row: 2, col: 1 },
                { type: 'vertical', row: 0, col: 0 },
                { type: 'vertical', row: 0, col: 1 },
                { type: 'vertical', row: 0, col: 2 },
                { type: 'vertical', row: 1, col: 0 },
                { type: 'vertical', row: 1, col: 1 },
                { type: 'vertical', row: 1, col: 2 },
            ];

            for (const move of moves) {
                await request(app.getHttpServer())
                    .post(`/sessions/${sessionId}/move`)
                    .send({ playerId: 'player1', move });
            }

            const finalState = await request(app.getHttpServer())
                .get(`/sessions/${sessionId}`)
                .expect(200);

            expect(finalState.body.status).toBe('FINISHED');
            expect(finalState.body.state.winner).not.toBeNull();
        });
    });
});
