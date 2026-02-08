'use client';

import React, { useState, useEffect } from 'react';
import { socket } from '../../lib/socket';

interface StudentLobbyProps {
    onStartGame: (sessionId: string, opponentName: string) => void;
    onBack: () => void;
}

export const StudentLobby = ({ onStartGame, onBack }: StudentLobbyProps) => {
    const [status, setStatus] = useState<'enter_code' | 'waiting'>('enter_code');
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        socket.connect();

        socket.on('joined_class', (data: any) => {
            console.log('Joined class:', data);
            setStatus('waiting');
            setError(null);
        });

        socket.on('error', (err: any) => {
            setError(err.message);
        });

        socket.on('game_started', (data: any) => {
            console.log('Game Started:', data);
            onStartGame(data.sessionId, data.opponent);
        });

        return () => {
            socket.off('joined_class');
            socket.off('error');
            socket.off('game_started');
            // socket.disconnect(); // Handled by Game or clean up?
        };
    }, [onStartGame]);

    const handleJoin = () => {
        if (!code || !name) {
            setError("Please enter both Name and Class Code");
            return;
        }
        socket.emit('join_class', { code, name });
    };

    if (status === 'enter_code') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Join Classroom</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="e.g. Alice"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class Code</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono tracking-widest text-center text-lg"
                                placeholder="123456"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                        <button
                            onClick={handleJoin}
                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md"
                        >
                            Join Class
                        </button>
                        <button
                            onClick={onBack}
                            className="w-full py-2 text-gray-500 hover:text-gray-700"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'waiting') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 p-8 text-center">
                <div className="animate-bounce mb-8 text-6xl">🎓</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome, {name}!</h2>
                <div className="bg-white px-8 py-4 rounded-full shadow-sm mb-8 inline-block">
                    <span className="text-gray-500 mr-2">Class Code:</span>
                    <span className="font-mono font-bold text-xl text-blue-600">{code}</span>
                </div>
                <p className="text-xl text-gray-600 mb-8 animate-pulse">Waiting for teacher to start the game...</p>
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            </div>
        );
    }

    return null;
};
