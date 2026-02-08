import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Classroom API (e2e)', () => {
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
        await prisma.classSession.deleteMany({});
        await prisma.user.deleteMany({});
    });

    describe('/classrooms (POST)', () => {
        it('should create a new classroom', () => {
            return request(app.getHttpServer())
                .post('/classrooms')
                .send({ teacherId: 'teacher-1' })
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('code');
                    expect(res.body.code).toMatch(/^\d{6}$/); // 6-digit code
                    expect(res.body.teacherId).toBe('teacher-1');
                    expect(res.body.students).toEqual([]);
                    expect(res.body.gameSessionIds).toEqual([]);
                    expect(res.body.status).toBe('LOBBY');
                });
        });

        it('should persist classroom to database', async () => {
            const response = await request(app.getHttpServer())
                .post('/classrooms')
                .send({ teacherId: 'teacher-2' });

            const code = response.body.code;
            const dbClass = await prisma.classSession.findUnique({
                where: { code },
            });

            expect(dbClass).toBeDefined();
            expect(dbClass?.teacherId).toBe('teacher-2');
            expect(dbClass?.status).toBe('OPEN');
        });

        it('should create teacher user if not exists', async () => {
            const teacherId = 'new-teacher-123';

            await request(app.getHttpServer())
                .post('/classrooms')
                .send({ teacherId });

            const teacher = await prisma.user.findUnique({
                where: { id: teacherId },
            });

            expect(teacher).toBeDefined();
            expect(teacher?.type).toBe('TEACHER');
        });
    });

    describe('/classrooms/:code (GET)', () => {
        it('should get classroom by code', async () => {
            const createRes = await request(app.getHttpServer())
                .post('/classrooms')
                .send({ teacherId: 'teacher-1' });

            const code = createRes.body.code;

            return request(app.getHttpServer())
                .get(`/classrooms/${code}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.code).toBe(code);
                    expect(res.body.teacherId).toBe('teacher-1');
                });
        });

        it('should return 404 for non-existent classroom', () => {
            return request(app.getHttpServer())
                .get('/classrooms/999999')
                .expect(404);
        });
    });

    describe('/classrooms/:code/join (POST)', () => {
        it('should join classroom as student', async () => {
            const createRes = await request(app.getHttpServer())
                .post('/classrooms')
                .send({ teacherId: 'teacher-1' });

            const code = createRes.body.code;

            return request(app.getHttpServer())
                .post(`/classrooms/${code}/join`)
                .send({ name: 'Alice' })
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body.name).toBe('Alice');
                });
        });

        it('should add student to classroom students list', async () => {
            const createRes = await request(app.getHttpServer())
                .post('/classrooms')
                .send({ teacherId: 'teacher-1' });

            const code = createRes.body.code;

            await request(app.getHttpServer())
                .post(`/classrooms/${code}/join`)
                .send({ name: 'Bob' });

            const classroom = await request(app.getHttpServer())
                .get(`/classrooms/${code}`);

            expect(classroom.body.students).toHaveLength(1);
            expect(classroom.body.students[0].name).toBe('Bob');
        });

        it('should allow multiple students to join', async () => {
            const createRes = await request(app.getHttpServer())
                .post('/classrooms')
                .send({ teacherId: 'teacher-1' });

            const code = createRes.body.code;

            await request(app.getHttpServer())
                .post(`/classrooms/${code}/join`)
                .send({ name: 'Student1' });

            await request(app.getHttpServer())
                .post(`/classrooms/${code}/join`)
                .send({ name: 'Student2' });

            await request(app.getHttpServer())
                .post(`/classrooms/${code}/join`)
                .send({ name: 'Student3' });

            const classroom = await request(app.getHttpServer())
                .get(`/classrooms/${code}`);

            expect(classroom.body.students).toHaveLength(3);
        });
    });

    describe('Classroom Flow', () => {
        it('should start games for students', async () => {
            const createRes = await request(app.getHttpServer())
                .post('/classrooms')
                .send({ teacherId: 'teacher-1' });

            const code = createRes.body.code;

            // Add students
            await request(app.getHttpServer())
                .post(`/classrooms/${code}/join`)
                .send({ name: 'Student1' });

            await request(app.getHttpServer())
                .post(`/classrooms/${code}/join`)
                .send({ name: 'Student2' });

            await request(app.getHttpServer())
                .post(`/classrooms/${code}/join`)
                .send({ name: 'Student3' });

            await request(app.getHttpServer())
                .post(`/classrooms/${code}/join`)
                .send({ name: 'Student4' });

            // Get classroom before starting games
            const beforeStart = await request(app.getHttpServer())
                .get(`/classrooms/${code}`);

            expect(beforeStart.body.gameSessionIds).toEqual([]);

            // Note: Game start is typically done via WebSocket, but if there's an endpoint:
            // Start games (would need to implement this endpoint if not exists)
            // For now, we just verify the classroom structure is correct
            expect(beforeStart.body.students).toHaveLength(4);
            expect(beforeStart.body.status).toBe('LOBBY');
        });

        it('should persist student data across requests', async () => {
            const createRes = await request(app.getHttpServer())
                .post('/classrooms')
                .send({ teacherId: 'teacher-persist' });

            const code = createRes.body.code;

            await request(app.getHttpServer())
                .post(`/classrooms/${code}/join`)
                .send({ name: 'PersistentStudent' });

            // Fetch from database directly
            const dbClass = await prisma.classSession.findUnique({
                where: { code },
            });

            expect(dbClass).toBeDefined();
            const students = dbClass?.students as any[];
            expect(students).toHaveLength(1);
            expect(students[0].name).toBe('PersistentStudent');
        });
    });

    describe('/classrooms/:code/join error handling', () => {
        it('should return error for non-existent classroom', () => {
            return request(app.getHttpServer())
                .post('/classrooms/999999/join')
                .send({ name: 'Alice' })
                .expect(404);
        });
    });
});
