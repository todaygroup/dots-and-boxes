import React from 'react';
import { PlayerId } from '@dots-game/game-logic';

interface BoxProps {
    owner: PlayerId | null;
    playerColors: [string, string];
    className?: string;
}

export const Box = ({ owner, playerColors, className = '' }: BoxProps) => {
    const baseClasses = "w-full h-full transition-colors duration-300 flex items-center justify-center text-white font-bold text-xl";

    const colorClasses = owner !== null ? playerColors[owner] : "bg-transparent";

    return (
        <div className={`${baseClasses} ${colorClasses} ${className}`}>
            {owner !== null ? (owner === 0 ? 'A' : 'B') : ''}
        </div>
    );
};
