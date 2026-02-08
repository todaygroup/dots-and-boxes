import React, { useState } from 'react';
import { PlayerSettings } from './PlayerSettings';

export interface GameConfig {
    width: number;
    height: number;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    names: [string, string];
    colors: [string, string];
}

interface GameSetupProps {
    mode: 'single' | 'local';
    onStart: (config: GameConfig) => void;
    onBack: () => void;
}

export const GameSetup = ({ mode, onStart, onBack }: GameSetupProps) => {
    const [size, setSize] = useState<number>(3); // 3x3 dots (2x2 boxes)
    const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');
    const [names, setNames] = useState<[string, string]>(
        mode === 'single' ? ['You', 'Bot'] : ['Player A', 'Player B']
    );
    const [colors, setColors] = useState<[string, string]>(['bg-blue-500', 'bg-red-500']);

    // If single player, Player 2 is Bot. Disallow changing Bot name?
    // Or just let user name the bot.

    const handleStart = () => {
        onStart({
            width: size,
            height: size,
            difficulty: mode === 'single' ? difficulty : undefined,
            names,
            colors
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8 animate-fade-in">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
                    {mode === 'single' ? 'Single Player Setup' : 'Local 2-Player Setup'}
                </h2>

                {/* Board Size */}
                <div className="mb-6">
                    <label className="block text-lg font-semibold text-gray-700 mb-2">Board Size</label>
                    <div className="flex gap-2">
                        {[3, 4, 5, 6].map(s => (
                            <button
                                key={s}
                                onClick={() => setSize(s)}
                                className={`flex-1 py-2 rounded border ${size === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                {s}x{s}
                            </button>
                        ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">({size - 1}x{size - 1} boxes)</p>
                </div>

                {/* Difficulty (Single Only) */}
                {mode === 'single' && (
                    <div className="mb-6">
                        <label className="block text-lg font-semibold text-gray-700 mb-2">Bot Difficulty</label>
                        <div className="flex gap-2">
                            {(['EASY', 'MEDIUM', 'HARD'] as const).map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    className={`flex-1 py-2 rounded border ${difficulty === d ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Player Settings (Names & Colors) - Reusing simplified form or inline?
                Let's inline simplified inputs to avoid double "Start" buttons if we reused PlayerSettings fully. 
                Or pass onStart to null and just use it for rendering inputs?
                PlayerSettings has its own Start button. 
                Maybe better to implement inputs here directly for cohesion.
            */}

                <div className="mb-6 border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Players</h3>
                    {/* Player 1 */}
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-600">Player 1 (You)</label>
                        <input
                            className="w-full border rounded px-2 py-1 mb-2"
                            value={names[0]}
                            onChange={e => setNames([e.target.value, names[1]])}
                        />
                        <div className="flex gap-1">
                            {['bg-blue-500', 'bg-green-500', 'bg-indigo-500'].map(c => (
                                <button key={c} onClick={() => setColors([c, colors[1]])} className={`w-6 h-6 rounded-full ${c} ${colors[0] === c ? 'ring-2 ring-gray-400' : ''}`} />
                            ))}
                        </div>
                    </div>

                    {/* Player 2 */}
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-600">{mode === 'single' ? 'Player 2 (Bot)' : 'Player 2'}</label>
                        <input
                            className="w-full border rounded px-2 py-1 mb-2"
                            value={names[1]}
                            onChange={e => setNames([names[0], e.target.value])}
                        />
                        <div className="flex gap-1">
                            {['bg-red-500', 'bg-yellow-500', 'bg-pink-500'].map(c => (
                                <button key={c} onClick={() => setColors([colors[0], c])} className={`w-6 h-6 rounded-full ${c} ${colors[1] === c ? 'ring-2 ring-gray-400' : ''}`} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button
                        onClick={onBack}
                        className="flex-1 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleStart}
                        className="flex-[2] py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
                    >
                        Start Game
                    </button>
                </div>
            </div>
        </div>
    );
};
