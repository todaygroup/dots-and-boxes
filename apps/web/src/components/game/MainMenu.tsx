import React from 'react';
import { Globe } from 'lucide-react';

interface MainMenuProps {
    onSelectMode: (mode: string) => void;
}

interface MenuButtonProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    onClick: () => void;
    disabled?: boolean;
}

const MenuButton = ({ icon, title, description, onClick, disabled }: MenuButtonProps) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-4 px-6 flex items-center justify-between bg-white text-gray-800 font-bold text-xl rounded-xl shadow-md border border-gray-200 transition transform ${disabled
            ? 'opacity-50 cursor-not-allowed bg-gray-50'
            : 'hover:shadow-lg hover:-translate-y-1 hover:bg-blue-50'
            }`}
    >
        <div className="flex items-center gap-4">
            {icon && <div className="text-blue-500">{icon}</div>}
            <div className="text-left">
                <div className="text-lg">{title}</div>
                {description && <div className="text-xs text-gray-400 font-normal">{description}</div>}
            </div>
        </div>
    </button>
);

export const MainMenu = ({ onSelectMode }: MainMenuProps) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8 animate-fade-in">
            <h1 className="text-6xl font-extrabold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 drop-shadow-sm">
                Dots & Boxes
            </h1>

            <div className="flex flex-col gap-4 w-full max-w-sm">
                <MenuButton
                    title="Single Player"
                    description="Challenge the AI Bot"
                    onClick={() => onSelectMode('single')}
                />
                <MenuButton
                    title="Two Players (Local)"
                    description="Play on the same device"
                    onClick={() => onSelectMode('local')}
                />
                <MenuButton
                    title="Online Multiplayer"
                    description="Play against friends remotely"
                    icon={<Globe className="w-6 h-6" />}
                    onClick={() => onSelectMode('online')}
                    disabled={false}
                />

                <div className="border-t border-gray-200 my-2 pt-2 w-full">
                    <p className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-wider text-center">Classroom Mode</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onSelectMode('teacher')}
                            className="bg-purple-100 text-purple-700 py-3 rounded-lg font-bold hover:bg-purple-200 transition"
                        >
                            Teacher
                        </button>
                        <button
                            onClick={() => onSelectMode('student')}
                            className="bg-blue-100 text-blue-700 py-3 rounded-lg font-bold hover:bg-blue-200 transition"
                        >
                            Student
                        </button>
                    </div>
                </div>

                <MenuButton
                    title="Tutorial"
                    description="Learn how to play"
                    onClick={() => onSelectMode('tutorial')}
                    disabled={true}
                />
            </div>

            <div className="mt-12 text-gray-400 text-sm">
                v0.1.0 MVP
            </div>
        </div>
    );
};
