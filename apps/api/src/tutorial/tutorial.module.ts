import { Module } from '@nestjs/common';
import { TutorialService } from './tutorial.service';
import { TutorialController } from './tutorial.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [TutorialService],
    controllers: [TutorialController],
    exports: [TutorialService],
})
export class TutorialModule { }
