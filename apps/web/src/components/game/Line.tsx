import React from 'react';

interface LineProps {
    type: 'vertical' | 'horizontal';
    isDrawn: boolean;
    onClick?: () => void;
    className?: string;
}

export const Line = ({ type, isDrawn, onClick, className = '' }: LineProps) => {
    const baseClasses = "transition-colors duration-200 cursor-pointer";
    const drawnClasses = "bg-gray-800";
    const emptyClasses = "bg-gray-200 hover:bg-gray-400";

    const sizeClasses = type === 'horizontal'
        ? "h-2 w-full"
        : "w-2 h-full";

    return (
        <div
            className={`${baseClasses} ${sizeClasses} ${isDrawn ? drawnClasses : emptyClasses} ${className}`}
            onClick={!isDrawn ? onClick : undefined}
        />
    );
};
