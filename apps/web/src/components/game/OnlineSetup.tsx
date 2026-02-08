'use client';

import React, { useState, useEffect } from 'react';
import { createSession, joinSession, getSession } from '../../lib/api';
import { socket } from '../../lib/socket';

interface OnlineSetupProps {
    onStart: (sessionId: string, playerId: string, width: number, height: number, players: { 0: string, 1: string }) => void;
    onBack: () => void;
}

export const OnlineSetup = ({ onStart, onBack }: OnlineSetupProps) => {
    const [mode, setMode] = useState<'initial' | 'create' | 'join' | 'waiting'>('initial');
    const [sessionId, setSessionId] = useState('');
    const [playerId, setPlayerId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [joinId, setJoinId] = useState('');

    // Auto-connect socket on mount
    useEffect(() => {
        socket.connect();
        return () => {
            socket.disconnect();
        };
    }, []);

    // Waiting Room Logic
    useEffect(() => {
        if (mode === 'waiting' && sessionId) {
            // Listen for session updates
            socket.on('session_state', (data: any) => {
                console.log('Session State Update:', data);
                if (data.status === 'PLAYING') {
                    // Game Started!
                    // Determine names/colors if we had them, or just use IDs for now
                    onStart(sessionId, playerId, data.board.width, data.board.height, {
                        0: data.players[0] || 'Player A',
                        1: data.players[1] || 'Player B'
                    });
                }
            });

            // Ensure we are joined
            socket.emit('join_session', { sessionId, playerId });

            return () => {
                socket.off('session_state');
            };
        }
    }, [mode, sessionId, playerId, onStart]);

    const handleCreate = async () => {
        try {
            setError(null);
            const session = await createSession(3, 3); // Default 3x3 for now, can add size selector
            const pid = 'host-' + Math.random().toString(36).substr(2, 9);
            await joinSession(session.id, pid);
            setSessionId(session.id);
            setPlayerId(pid);
            setMode('waiting');
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleJoin = async () => {
        if (!joinId) return;
        try {
            setError(null);
            const pid = 'joiner-' + Math.random().toString(36).substr(2, 9);
            await joinSession(joinId, pid);

            // Fetch session details to get board size
            const session = await getSession(joinId);

            // setSessionId(joinId);
            // setPlayerId(pid);
            // setMode('waiting'); 
            // Actually if we join and it's full, it becomes PLAYING immediately.
            // But we should verify via socket.

            setSessionId(joinId);
            setPlayerId(pid);
            setMode('waiting');

        } catch (e: any) {
            setError(e.message);
        }
    };

    if (mode === 'initial') {
        return (
            <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800">Online Multiplayer</h2>
                <button
                    onClick={() => setMode('create')}
                    className="w-full py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
                >
                    Create Session
                </button>
                <button
                    onClick={() => setMode('join')}
                    className="w-full py-3 px-6 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
                >
                    Join Session
                </button>
                <button
                    onClick={onBack}
                    className="w-full py-3 px-6 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                    Back
                </button>
            </div>
        );
    }

    if (mode === 'create') {
        // Should ideally show size selector here
        // For MVP just creating
        return (
            <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-xl shadow-lg">
                <h2 className="text-xl font-bold">Creating Session...</h2>
                {/* We trigger handleCreate immediately or via button? Button is better */}
                <button onClick={handleCreate} className="px-4 py-2 bg-blue-500 text-white rounded">
                    Confirm Create (3x3)
                </button>
                <button onClick={() => setMode('initial')} className="text-gray-500">Cancel</button>
                {error && <p className="text-red-500">{error}</p>}
            </div>
        );
    }

    if (mode === 'join') {
        return (
            <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold">Join Session</h2>
                <input
                    type="text"
                    placeholder="Enter Session ID"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    className="w-full p-2 border rounded"
                />
                <button
                    onClick={handleJoin}
                    className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    Join
                </button>
                <button onClick={() => setMode('initial')} className="text-gray-500">Cancel</button>
                {error && <p className="text-red-500">{error}</p>}
            </div>
        );
    }

    if (mode === 'waiting') {
        return (
            <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-xl shadow-lg text-center">
                <h2 className="text-2xl font-bold text-blue-600 animate-pulse">Waiting for Opponent...</h2>
                <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Share this Session ID:</p>
                    <p className="text-xl font-mono font-bold select-all tracking-wider">{sessionId}</p>
                </div>
                <p className="text-gray-600">The game will start automatically when a player joins.</p>
                <button onClick={onBack} className="text-red-500 hover:underline">Cancel</button>
            </div>
        );
    }

    return null;
};
