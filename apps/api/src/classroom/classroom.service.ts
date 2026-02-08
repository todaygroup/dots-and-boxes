import { Injectable } from '@nestjs/common';
import { SessionsService } from '../sessions/sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClassSession as PrismaClassSession, ClassStatus } from '@prisma/client';

export interface Student {
    id: string;
    name: string;
    socketId?: string;
}

export interface ClassSession {
    code: string;
    teacherId: string;
    students: Student[];
    gameSessionIds: string[];
    status: 'LOBBY' | 'PLAYING' | 'FINISHED';
}

@Injectable()
export class ClassroomService {
    constructor(
        private sessionsService: SessionsService,
        private prisma: PrismaService
    ) { }

    // Helper: Map Prisma model to interface
    private mapToClassSession(dbClass: PrismaClassSession): ClassSession {
        const students = Array.isArray(dbClass.students)
            ? dbClass.students as any[]
            : [];
        const gameIds = Array.isArray(dbClass.gameIds)
            ? dbClass.gameIds as string[]
            : [];

        return {
            code: dbClass.code,
            teacherId: dbClass.teacherId,
            students: students.map(s => ({
                id: s.id,
                name: s.name,
                socketId: s.socketId
            })),
            gameSessionIds: gameIds,
            status: dbClass.status === ClassStatus.OPEN ? 'LOBBY' :
                dbClass.status === ClassStatus.CLOSED ? 'FINISHED' : 'PLAYING'
        };
    }

    // Helper: Ensure teacher user exists
    private async ensureTeacher(teacherId: string): Promise<void> {
        const existing = await this.prisma.user.findUnique({
            where: { id: teacherId }
        });

        if (!existing) {
            await this.prisma.user.create({
                data: {
                    id: teacherId,
                    type: 'TEACHER'
                }
            });
        }
    }

    async getAllClasses(teacherId?: string): Promise<ClassSession[]> {
        try {
            const where = teacherId ? { teacherId } : {};
            const dbClasses = await this.prisma.classSession.findMany({
                where,
                orderBy: { createdAt: 'desc' }
            });
            return dbClasses.map(c => this.mapToClassSession(c));
        } catch (error) {
            console.warn('[Classroom] Database unavailable, returning empty array');
            return [];
        }
    }

    async createClass(teacherId: string): Promise<ClassSession> {
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Ensure teacher exists
        await this.ensureTeacher(teacherId);

        const dbClass = await this.prisma.classSession.create({
            data: {
                code,
                teacherId,
                status: ClassStatus.OPEN,
                students: [],
                gameIds: []
            }
        });

        return this.mapToClassSession(dbClass);
    }

    async getClass(code: string): Promise<ClassSession | undefined> {
        const dbClass = await this.prisma.classSession.findUnique({
            where: { code }
        });

        if (!dbClass) {
            return undefined;
        }

        return this.mapToClassSession(dbClass);
    }

    async joinClass(code: string, name: string, socketId?: string): Promise<Student> {
        const dbClass = await this.prisma.classSession.findUnique({
            where: { code }
        });

        if (!dbClass) {
            throw new Error('Class not found');
        }

        const student: Student = {
            id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            socketId
        };

        const currentStudents = Array.isArray(dbClass.students)
            ? dbClass.students as any[]
            : [];

        await this.prisma.classSession.update({
            where: { code },
            data: {
                students: [...currentStudents, student]
            }
        });

        return student;
    }

    async startGame(code: string) {
        const dbClass = await this.prisma.classSession.findUnique({
            where: { code }
        });

        if (!dbClass) {
            return { success: false, message: 'Class not found' };
        }

        const students = Array.isArray(dbClass.students)
            ? dbClass.students as any[]
            : [];

        if (students.length < 2) {
            return { success: false, message: 'Not enough students' };
        }

        const games: { sessionId: string; p1: Student; p2: Student }[] = [];
        const gameIds: string[] = [];

        for (let i = 0; i < students.length; i += 2) {
            if (i + 1 < students.length) {
                const [p1, p2] = [students[i], students[i + 1]];
                const session = await this.sessionsService.create({ width: 3, height: 3 });
                await this.sessionsService.join(session.id, p1.id);
                await this.sessionsService.join(session.id, p2.id);
                games.push({ sessionId: session.id, p1, p2 });
                gameIds.push(session.id);
            }
        }

        // Update class status and game IDs
        await this.prisma.classSession.update({
            where: { code },
            data: {
                status: ClassStatus.CLOSED,
                gameIds: gameIds
            }
        });

        return { success: true, games };
    }
}
