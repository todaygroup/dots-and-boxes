import { Module } from '@nestjs/common';
import { ClassroomService } from './classroom.service';
import { ClassroomController } from './classroom.controller';
import { ClassroomGateway } from './classroom.gateway';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
    imports: [SessionsModule],
    controllers: [ClassroomController],
    providers: [ClassroomService, ClassroomGateway],
    exports: [ClassroomService]
})
export class ClassroomModule { }
