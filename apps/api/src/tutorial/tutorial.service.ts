import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TutorialStep {
    id: string;
    type: 'explanation' | 'interactive' | 'quiz';
    title: string;
    instruction?: string;
    content?: {
        text: string;
        animation?: string;
        audio?: string;
    };
    boardSetup?: {
        grid: string;
        predrawnLines?: any[];
    };
    highlightDots?: number[][];
    expectedMove?: any;
    validation?: string;
    feedback?: {
        success: string;
        retry: string;
    };
}

export interface Tutorial {
    id: string;
    targetAge: string;
    title: string;
    description: string;
    estimatedTime: string;
    steps: TutorialStep[];
    completion: {
        message: string;
        reward: string;
    };
}

@Injectable()
export class TutorialService {
    constructor(private prisma: PrismaService) { }

    // Tutorial catalog
    private tutorials: Tutorial[] = [
        {
            id: 'dots-basics-ages-4-6',
            targetAge: '4-6',
            title: 'Learning to Connect Dots',
            description: 'Introduction to basic game mechanics',
            estimatedTime: '5-7 minutes',
            steps: [
                {
                    id: 'intro',
                    type: 'explanation',
                    title: 'Welcome!',
                    content: {
                        text: 'Welcome! Let\'s learn to play Dots and Boxes!',
                        animation: 'character_wave.gif',
                        audio: 'welcome_narration.mp3',
                    },
                },
                {
                    id: 'first_line',
                    type: 'interactive',
                    title: 'Draw Your First Line',
                    instruction: 'Tap two dots next to each other to draw a line',
                    boardSetup: {
                        grid: '3x3',
                        predrawnLines: [],
                    },
                    highlightDots: [[0, 0], [0, 1]],
                    expectedMove: { type: 'horizontal', row: 0, col: 0 },
                    validation: 'exact_match',
                    feedback: {
                        success: 'Perfect! You drew a line!',
                        retry: 'Try tapping these two dots that are next to each other',
                    },
                },
                {
                    id: 'make_box',
                    type: 'interactive',
                    title: 'Complete a Box',
                    instruction: 'Draw the last line to finish this box!',
                    boardSetup: {
                        grid: '3x3',
                        predrawnLines: [
                            { type: 'horizontal', row: 0, col: 0 },
                            { type: 'horizontal', row: 1, col: 0 },
                            { type: 'vertical', row: 0, col: 0 },
                        ],
                    },
                    highlightDots: [[0, 1], [1, 1]],
                    expectedMove: { type: 'vertical', row: 0, col: 1 },
                    feedback: {
                        success: 'Yay! You made a box! Great job!',
                        retry: 'Draw the missing line',
                    },
                },
            ],
            completion: {
                message: 'You finished the tutorial!',
                reward: 'tutorial_complete_badge',
            },
        },
        {
            id: 'strategy-grades-3-4',
            targetAge: '9-10',
            title: 'Advanced Strategy',
            description: 'Learn chains, loops, and double-cross tactics',
            estimatedTime: '15-20 minutes',
            steps: [
                {
                    id: 'chain_intro',
                    type: 'explanation',
                    title: 'What is a Chain?',
                    content: {
                        text: 'A chain is a series of boxes connected together, each with 2 edges.',
                    },
                },
                {
                    id: 'chain_practice',
                    type: 'interactive',
                    title: 'Identify the Chain',
                    instruction: 'Click on boxes that form a chain',
                    feedback: {
                        success: 'Correct! Those boxes form a chain.',
                        retry: 'Look for boxes that share edges',
                    },
                },
            ],
            completion: {
                message: 'You\'re a strategy master!',
                reward: 'strategy_badge',
            },
        },
    ];

    async getAllTutorials(targetAge?: string): Promise<Tutorial[]> {
        if (targetAge) {
            return this.tutorials.filter((t) => t.targetAge === targetAge);
        }
        return this.tutorials;
    }

    async getTutorial(tutorialId: string): Promise<Tutorial | null> {
        return this.tutorials.find((t) => t.id === tutorialId) || null;
    }

    async getUserProgress(userId: string) {
        // In production, fetch from database
        // For now, return empty progress
        return {
            completedTutorials: [],
            currentTutorial: null,
            currentStep: null,
        };
    }

    async saveProgress(
        userId: string,
        tutorialId: string,
        currentStep: string,
        stepsCompleted: string[],
        stars?: number,
    ) {
        // In production, save to TutorialProgress model
        console.log('[Tutorial Progress]', {
            userId,
            tutorialId,
            currentStep,
            stepsCompleted,
            stars,
        });

        return {
            success: true,
            progress: {
                tutorialId,
                currentStep,
                completedSteps: stepsCompleted.length,
                totalSteps: this.tutorials.find((t) => t.id === tutorialId)?.steps.length || 0,
            },
        };
    }

    async markTutorialComplete(userId: string, tutorialId: string, stars: number) {
        // Save completion to database
        console.log('[Tutorial Complete]', { userId, tutorialId, stars });

        return {
            success: true,
            reward: this.tutorials.find((t) => t.id === tutorialId)?.completion.reward,
        };
    }
}
