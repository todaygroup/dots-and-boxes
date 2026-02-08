import React from 'react';

interface ResultScreenProps {
    winnerName: string | null; // null for draw
    winnerColor: string | null;
    scores: [number, number];
    playerNames: [string, string];
    onRestart: () => void;
    onSetup: () => void;
}

export const ResultScreen = ({ winnerName, winnerColor, scores, playerNames, onRestart, onSetup }: ResultScreenProps) => {
    return (
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full animate-fade-in">
            <h2 className="text-4xl font-bold mb-4 text-gray-800">Game Over!</h2>

            <div className="mb-8">
                {winnerName ? (
                    <>
                        <div className="text-2xl text-gray-600 mb-2">Winner</div>
                        <div className={`text-5xl font-extrabold mb-4 ${winnerColor?.replace('bg-', 'text-') || 'text-gray-800'}`}>
                            {winnerName}
                        </div>
                    </>
                ) : (
                    <div className="text-4xl font-extrabold text-gray-600 mb-4">It's a Draw!</div>
                )}
            </div>

            <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                    <span className="text-gray-600 font-medium">{playerNames[0]}</span>
                    <span className="text-xl font-bold text-gray-800">{scores[0]} pts</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                    <span className="text-gray-600 font-medium">{playerNames[1]}</span>
                    <span className="text-xl font-bold text-gray-800">{scores[1]} pts</span>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <button
                    onClick={onRestart}
                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition duration-200"
                >
                    Play Again
                </button>
                <button
                    onClick={onSetup}
                    className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300 transition duration-200"
                >
                    Back to Setup
                </button>
            </div>
        </div>
    );
};
