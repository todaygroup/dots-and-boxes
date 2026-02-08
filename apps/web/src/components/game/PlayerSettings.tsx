import React from 'react';

const AVAILABLE_COLORS = [
    'bg-blue-500',
    'bg-red-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500'
];

interface PlayerSettingsProps {
    names: [string, string];
    colors: [string, string];
    onUpdate: (names: [string, string], colors: [string, string]) => void;
    onStart: () => void;
}

export const PlayerSettings = ({ names, colors, onUpdate, onStart }: PlayerSettingsProps) => {
    const updateName = (index: 0 | 1, name: string) => {
        const newNames: [string, string] = [...names];
        newNames[index] = name;
        onUpdate(newNames, colors);
    };

    const updateColor = (index: 0 | 1, color: string) => {
        const newColors: [string, string] = [...colors];
        newColors[index] = color;
        onUpdate(names, newColors);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Game Setup</h2>

            {[0, 1].map((playerIndex) => (
                <div key={playerIndex} className="mb-6 border-b pb-4 last:border-b-0">
                    <h3 className="tex-lg font-semibold mb-2 text-gray-700">Player {playerIndex === 0 ? 'A' : 'B'}</h3>

                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                        <input
                            type="text"
                            value={names[playerIndex]}
                            onChange={(e) => updateName(playerIndex as 0 | 1, e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Color</label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_COLORS.map((color) => (
                                <button
                                    key={color}
                                    className={`w-8 h-8 rounded-full ${color} ${colors[playerIndex] === color ? 'ring-4 ring-offset-2 ring-gray-400' : ''}`}
                                    onClick={() => updateColor(playerIndex as 0 | 1, color)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            ))}

            <button
                onClick={onStart}
                className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition duration-200"
            >
                Start Game
            </button>
        </div>
    );
};
