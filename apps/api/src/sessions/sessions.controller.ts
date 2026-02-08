import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { MakeMoveDto } from './dto/make-move.dto';
import type { GameSession } from './sessions.interface';

@Controller('sessions')
export class SessionsController {
    constructor(private readonly sessionsService: SessionsService) { }

    @Post()
    async create(@Body() createSessionDto: CreateSessionDto): Promise<GameSession> {
        return this.sessionsService.create(createSessionDto);
    }

    @Get()
    async findAll(): Promise<GameSession[]> {
        return this.sessionsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<GameSession> {
        return this.sessionsService.findOne(id);
    }

    @Post(':id/join')
    async join(@Param('id') id: string, @Body('playerId') playerId: string): Promise<GameSession> {
        return this.sessionsService.join(id, playerId);
    }

    @Post(':id/move')
    async makeMove(@Param('id') id: string, @Body() makeMoveDto: MakeMoveDto): Promise<GameSession> {
        return this.sessionsService.makeMove(id, makeMoveDto);
    }
}
