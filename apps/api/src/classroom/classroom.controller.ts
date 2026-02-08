import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ClassroomService } from './classroom.service';

@Controller('classrooms')
export class ClassroomController {
    constructor(private readonly classroomService: ClassroomService) { }

    @Get()
    async getAllClasses(@Query('teacherId') teacherId?: string) {
        return this.classroomService.getAllClasses(teacherId);
    }

    @Post()
    async createClass(@Body() body: { teacherId: string }) {
        return this.classroomService.createClass(body.teacherId);
    }

    @Get(':code')
    async getClass(@Param('code') code: string) {
        return this.classroomService.getClass(code);
    }

    @Post(':code/join')
    async joinClass(@Param('code') code: string, @Body() body: { name: string }) {
        return this.classroomService.joinClass(code, body.name);
    }
}
