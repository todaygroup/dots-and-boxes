import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AnalyticsEvent {
    type: string;
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, any>;
}

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async logEvent(event: AnalyticsEvent) {
        // For now, just log to console
        // In production, send to analytics service (Mixpanel, Amplitude, etc.)
        console.log('[Analytics Event]', {
            timestamp: new Date().toISOString(),
            ...event,
        });

        // Optionally store in database for internal analytics
        // await this.prisma.analyticsEvent.create({ data: event });

        return { success: true };
    }

    async logGameStart(sessionId: string, players: string[]) {
        return this.logEvent({
            type: 'game_start',
            sessionId,
            metadata: { playerCount: players.length, players },
        });
    }

    async logMoveMade(sessionId: string, userId: string, moveData: any) {
        return this.logEvent({
            type: 'move_made',
            sessionId,
            userId,
            metadata: moveData,
        });
    }

    async logGameEnd(sessionId: string, winner: number | null, scores: number[]) {
        return this.logEvent({
            type: 'game_end',
            sessionId,
            metadata: { winner, scores },
        });
    }

    async logStudentJoin(classCode: string, studentId: string, studentName: string) {
        return this.logEvent({
            type: 'student_join',
            userId: studentId,
            metadata: { classCode, studentName },
        });
    }

    async logClassCreated(teacherId: string, classCode: string) {
        return this.logEvent({
            type: 'class_created',
            userId: teacherId,
            metadata: { classCode },
        });
    }

    // Dashboard queries
    async getGameStats(startDate?: Date, endDate?: Date) {
        try {
            const where: any = {};
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) where.createdAt.gte = startDate;
                if (endDate) where.createdAt.lte = endDate;
            }

            const [totalGames, activeGames, finishedGames] = await Promise.all([
                this.prisma.gameSession.count({ where }),
                this.prisma.gameSession.count({ where: { ...where, status: 'PLAYING' } }),
                this.prisma.gameSession.count({ where: { ...where, status: 'FINISHED' } }),
            ]);

            return {
                totalGames,
                activeGames,
                finishedGames,
                completionRate: totalGames > 0 ? (finishedGames / totalGames) * 100 : 0,
            };
        } catch (error) {
            // Return mock data when database is unavailable
            console.warn('[Analytics] Database unavailable, returning mock data');
            return {
                totalGames: 0,
                activeGames: 0,
                finishedGames: 0,
                completionRate: 0,
                _note: 'Database connection unavailable - showing default values',
            };
        }
    }

    async getUserActivity(startDate?: Date, endDate?: Date) {
        try {
            const where: any = {};
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) where.createdAt.gte = startDate;
                if (endDate) where.createdAt.lte = endDate;
            }

            const totalUsers = await this.prisma.user.count({ where });
            const usersByType = await this.prisma.user.groupBy({
                by: ['type'],
                _count: true,
                where,
            });

            return {
                totalUsers,
                byType: usersByType.reduce((acc, item) => {
                    acc[item.type] = item._count;
                    return acc;
                }, {} as Record<string, number>),
            };
        } catch (error) {
            console.warn('[Analytics] Database unavailable for user activity');
            return {
                totalUsers: 0,
                byType: {},
                _note: 'Database connection unavailable',
            };
        }
    }

    async getClassroomMetrics(startDate?: Date, endDate?: Date) {
        try {
            const where: any = {};
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) where.createdAt.gte = startDate;
                if (endDate) where.createdAt.lte = endDate;
            }

            const [totalClasses, activeClasses, avgStudents] = await Promise.all([
                this.prisma.classSession.count({ where }),
                this.prisma.classSession.count({ where: { ...where, status: 'OPEN' } }),
                this.prisma.classSession.aggregate({
                    where,
                    _count: true,
                }),
            ]);

            return {
                totalClasses,
                activeClasses,
                closedClasses: totalClasses - activeClasses,
            };
        } catch (error) {
            console.warn('[Analytics] Database unavailable for classroom metrics');
            return {
                totalClasses: 0,
                activeClasses: 0,
                closedClasses: 0,
                _note: 'Database connection unavailable',
            };
        }
    }
}
