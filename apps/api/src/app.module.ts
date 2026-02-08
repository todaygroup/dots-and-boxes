import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SessionsModule } from './sessions/sessions.module';
import { ClassroomModule } from './classroom/classroom.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TutorialModule } from './tutorial/tutorial.module';

import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SessionsModule, ClassroomModule, AnalyticsModule, TutorialModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
