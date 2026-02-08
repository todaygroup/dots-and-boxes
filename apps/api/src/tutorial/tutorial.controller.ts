import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { TutorialService } from './tutorial.service';

@Controller('tutorials')
export class TutorialController {
    constructor(private tutorialService: TutorialService) { }

    @Get()
    async getAllTutorials(@Query('targetAge') targetAge?: string) {
        return this.tutorialService.getAllTutorials(targetAge);
    }

    @Get(':id')
    async getTutorial(@Param('id') id: string) {
        const tutorial = await this.tutorialService.getTutorial(id);
        if (!tutorial) {
            return { error: 'Tutorial not found' };
        }
        return tutorial;
    }

    @Get('users/:userId/progress')
    async getUserProgress(@Param('userId') userId: string) {
        return this.tutorialService.getUserProgress(userId);
    }

    @Post(':id/progress')
    async saveProgress(
        @Param('id') tutorialId: string,
        @Body()
        body: {
            userId: string;
            currentStep: string;
            stepsCompleted: string[];
            stars?: number;
        },
    ) {
        return this.tutorialService.saveProgress(
            body.userId,
            tutorialId,
            body.currentStep,
            body.stepsCompleted,
            body.stars,
        );
    }

    @Post(':id/complete')
    async completeTutorial(
        @Param('id') tutorialId: string,
        @Body() body: { userId: string; stars: number },
    ) {
        return this.tutorialService.markTutorialComplete(
            body.userId,
            tutorialId,
            body.stars,
        );
    }
}
