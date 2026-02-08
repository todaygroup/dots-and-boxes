import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UserType } from '@prisma/client';

export interface JwtPayload {
    sub: string; // user ID
    type: UserType;
}

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    async validateUser(userId: string): Promise<any> {
        return this.prisma.user.findUnique({
            where: { id: userId },
        });
    }

    async login(user: { id: string; type: UserType }) {
        const payload: JwtPayload = { sub: user.id, type: user.type };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                type: user.type,
            },
        };
    }

    async createGuestToken() {
        const guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create guest user in database
        await this.prisma.user.create({
            data: {
                id: guestId,
                type: UserType.GUEST,
            },
        });

        return this.login({ id: guestId, type: UserType.GUEST });
    }
}
