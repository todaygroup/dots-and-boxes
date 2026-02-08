'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createBoard, makeMove, BoardState, getBotMove } from '@dots-game/game-logic';
import { Board } from './Board';
import { ResultScreen } from './ResultScreen';
import { MainMenu } from './MainMenu';
import { GameSetup, GameConfig } from './GameSetup';
import { OnlineSetup } from './OnlineSetup';
import { TeacherDashboard } from '../classroom/TeacherDashboard';
import { StudentLobby } from '../classroom/StudentLobby';
import { socket } from '../../lib/socket';

export const Game = () => {
    // Navigation State
    const [screen, setScreen] = useState<'menu' | 'setup' | 'playing' | 'ended' | 'classroom_teacher' | 'classroom_student'>('menu');
    const [setupMode, setSetupMode] = useState<'single' | 'local' | 'online' | 'classroom'>('local');

    // Online/Classroom State
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);

    // Game Config & State
    const [config, setConfig] = useState<GameConfig | null>(null);
    const [board, setBoard] = useState<BoardState>(createBoard(3, 3)); // initial dummy

    // Derived for UI
    const winnerIndex = board.winner;

    // --- Actions ---

    const handleSelectMode = (mode: 'single' | 'local' | 'online' | 'tutorial' | 'classroom') => {
        if (mode === 'tutorial') return; // Not implemented

        if (mode === 'classroom') {
            // Classroom has sub-selection in main menu or handled here?
            // Actually MainMenu currently passes strict types. 
            // We need to update MainMenu to allow 'classroom' or handle it via a sub-prop?
            // Let's assume onSelectMode passes 'classroom_teacher' or 'classroom_student' ?
            // Or simpler: handleSelectMode takes specific string.
            return;
        }

        setSetupMode(mode as any);
        setScreen('setup');
    };

    // Temporary helper for MainMenu integration
    const handleMenuNavigation = (target: string) => {
        if (target === 'single') { setSetupMode('single'); setScreen('setup'); }
        else if (target === 'local') { setSetupMode('local'); setScreen('setup'); }
        else if (target === 'online') { setSetupMode('online'); setScreen('setup'); }
        else if (target === 'teacher') { setScreen('classroom_teacher'); }
        else if (target === 'student') { setScreen('classroom_student'); }
    }

    const handleStartGame = (newConfig: GameConfig) => {
        setConfig(newConfig);
        setBoard(createBoard(newConfig.width, newConfig.height));
        setScreen('playing');
        setSessionId(null);
        setPlayerId(null);
    };

    const handleOnlineStart = (sid: string, pid: string, width: number, height: number, players: { 0: string, 1: string }) => {
        setSessionId(sid);
        setPlayerId(pid);
        setConfig({
            width,
            height,
            names: [players[0], players[1]],
            colors: ['bg-blue-500', 'bg-red-500'],
        });
        setBoard(createBoard(width, height));
        setScreen('playing');
        setSetupMode('online');
    };

    const handleClassroomGameStart = (sid: string, opponentName: string) => {
        setSessionId(sid);
        // playerId is handled by socket connection implicitly or needs to be set? 
        // StudentLobby connection logic sets socket.id.
        setPlayerId(socket.id || 'student');

        setConfig({
            width: 3, // Default for classroom
            height: 3,
            names: ['You', opponentName], // Simplified for now
            colors: ['bg-blue-500', 'bg-red-500'],
        });
        setBoard(createBoard(3, 3));
        setScreen('playing');
        setSetupMode('classroom');
    };

    const handleBackToMenu = () => {
        setScreen('menu');
        setConfig(null);
        setSessionId(null);
        setPlayerId(null);
        socket.disconnect();
    };

    const handleMove = useCallback((type: 'vertical' | 'horizontal', row: number, col: number) => {
        if (screen !== 'playing') return;
        if (board.winner !== null) return;

        // Online & Classroom Move (Both use socket)
        if ((setupMode === 'online' || setupMode === 'classroom') && sessionId) {

            socket.emit('make_move', {
                sessionId,
                move: { type, row, col, playerIndex: board.currentPlayer }
            });
            return;
        }

        // Local/Bot Move
        const move = { type, row, col };
        const result = makeMove(board, move);

        if (result.isValid) {
            setBoard(result.newState);
            // Check Game Over
            if (result.newState.winner !== null || result.newState.scores[0] + result.newState.scores[1] === (board.width - 1) * (board.height - 1)) {
                setScreen('ended');
            }
        }
    }, [board, screen, setupMode, sessionId, playerId, config]);

    // --- Online Listeners ---
    useEffect(() => {
        if ((setupMode === 'online' || setupMode === 'classroom') && sessionId) {
            socket.on('session_state', (data: any) => {
                setBoard(data.board);
                if (data.status === 'FINISHED') {
                    setScreen('ended');
                }
            });

            socket.on('game_over', (data: any) => {
                setScreen('ended');
            });

            return () => {
                socket.off('session_state');
                socket.off('game_over');
            };
        }
    }, [setupMode, sessionId]);


    // --- Bot Logic ---
    useEffect(() => {
        if (screen === 'playing' && setupMode === 'single' && config && board.currentPlayer === 1 && board.winner === null) {
            // It's Bot's turn
            const timer = setTimeout(() => {
                try {
                    const difficulty = config.difficulty || 'EASY';
                    const botResult = getBotMove(board, difficulty);
                    handleMove(botResult.move.type, botResult.move.row, botResult.move.col);
                } catch (e) {
                    console.error("Bot error:", e);
                }
            }, 600); // Delay for better UX
            return () => clearTimeout(timer);
        }
    }, [board, screen, setupMode, config, handleMove]);


    // --- Renders ---

    if (screen === 'menu') {
        return <MainMenu onSelectMode={handleMenuNavigation} />;
    }

    if (screen === 'classroom_teacher') {
        return <TeacherDashboard onBack={handleBackToMenu} />;
    }

    if (screen === 'classroom_student') {
        return <StudentLobby onStartGame={handleClassroomGameStart} onBack={handleBackToMenu} />;
    }

    if (screen === 'setup') {
        if (setupMode === 'online') {
            return (
                <OnlineSetup
                    onStart={handleOnlineStart}
                    onBack={handleBackToMenu}
                />
            );
        }
        return (
            <GameSetup
                mode={setupMode as 'single' | 'local'}
                onStart={handleStartGame}
                onBack={handleBackToMenu}
            />
        );
    }

    if (screen === 'ended' && config) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
                <ResultScreen
                    winnerName={winnerIndex !== null ? config.names[winnerIndex] : null}
                    winnerColor={winnerIndex !== null ? config.colors[winnerIndex] : null}
                    scores={board.scores}
                    playerNames={config.names}
                    onRestart={() => {
                        if (setupMode === 'online' || setupMode === 'classroom') handleBackToMenu();
                        else handleStartGame(config);
                    }}
                    onSetup={handleBackToMenu}
                />
            </div>
        );
    }

    if (screen === 'playing' && config) {
        // Determine text
        let statusText = `${config.names[board.currentPlayer]}'s Turn`;
        if (setupMode === 'single' && board.currentPlayer === 1) statusText = 'Bot is thinking...';

        const isOnline = setupMode === 'online' || setupMode === 'classroom';

        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
                <div className="flex justify-between w-full max-w-md mb-6 px-4">
                    {/* Player A */}
                    <div className={`flex items-center gap-2 text-xl font-bold transition-all duration-300 ${board.currentPlayer === 0 ? 'opacity-100 scale-110' : 'opacity-50 scale-100'}`}>
                        <div className={`w-4 h-4 rounded-full ${config.colors[0]}`} />
                        <span className="text-gray-800">
                            {/* Truncate long IDs if online */}
                            {isOnline && config.names[0] === playerId ? 'You' : config.names[0]}: {board.scores[0]}
                        </span>
                    </div>
                    {/* Player B */}
                    <div className={`flex items-center gap-2 text-xl font-bold transition-all duration-300 ${board.currentPlayer === 1 ? 'opacity-100 scale-110' : 'opacity-50 scale-100'}`}>
                        <div className={`w-4 h-4 rounded-full ${config.colors[1]}`} />
                        <span className="text-gray-800">
                            {isOnline && config.names[1] === playerId ? 'You' : config.names[1]}: {board.scores[1]}
                        </span>
                    </div>
                </div>

                <div className="mb-6 text-2xl font-semibold text-gray-700 h-8">
                    {statusText}
                </div>

                <Board board={board} onMove={handleMove} playerColors={config.colors} />

                {isOnline && (
                    <div className="mt-4 text-sm text-gray-500">
                        Session: {sessionId}
                    </div>
                )}

                <button
                    onClick={() => {
                        if (isOnline) handleBackToMenu();
                        else setScreen('ended');
                    }}
                    className="mt-8 px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                >
                    {isOnline ? 'Leave Game' : 'End Game'}
                </button>
            </div>
        );
    }

    return <div>Loading...</div>;
};
