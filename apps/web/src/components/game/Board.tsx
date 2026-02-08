import React from 'react';
import { BoardState, BoxState } from '@dots-game/game-logic';
import { Dot } from './Dot';
import { Line } from './Line';
import { Box } from './Box';

interface BoardProps {
    board: BoardState;
    onMove: (type: 'vertical' | 'horizontal', row: number, col: number) => void;
    playerColors: [string, string];
}

export const Board = ({ board, onMove, playerColors }: BoardProps) => {
    const { width, height, edges, boxes } = board;

    // We need to render rows.
    // Each "row" of the visual grid consists of:
    // 1. A row of Dots connected by Horizontal Lines.
    // 2. A row of Vertical Lines separating Boxes.
    // Repeat for height-1 times.
    // Finally a last row of Dots and Horizontal Lines (if we consider height dots).

    // Board dimensions: width x height DOTS.
    // Boxes: (width-1) x (height-1).
    // Horizontal lines: height rows, (width-1) cols.
    // Vertical lines: (height-1) rows, width cols.

    // Let's create a grid layout.
    // We can use CSS Grid or Flexbox.
    // Grid might be easiest. 
    // Columns: Dot, H-Line, Dot, H-Line... 
    // Rows: Dot, V-Line, Dot...

    // Number of grid columns = (width * 2) - 1
    // Number of grid rows = (height * 2) - 1

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${width - 1}, auto 1fr) auto`,
        gridTemplateRows: `repeat(${height - 1}, auto 1fr) auto`,
    };

    const renderCells = () => {
        const cells = [];

        for (let r = 0; r < height; r++) {
            // 1. Dot & Horizontal Line Row
            for (let c = 0; c < width; c++) {
                // Dot at (r, c)
                cells.push(<Dot key={`dot-${r}-${c}`} />);

                // Horizontal Line to the right (if not last column)
                if (c < width - 1) {
                    const hKey = `h-${r}-${c}`;
                    const isDrawn = edges.includes(hKey);
                    cells.push(
                        <Line
                            key={hKey}
                            type="horizontal"
                            isDrawn={isDrawn}
                            onClick={() => onMove('horizontal', r, c)}
                        />
                    );
                }
            }

            // 2. Vertical Line & Box Row (if not last row)
            if (r < height - 1) {
                for (let c = 0; c < width; c++) {
                    // Vertical Line below Dot (r, c)
                    const vKey = `v-${r}-${c}`;
                    const isDrawn = edges.includes(vKey);
                    cells.push(
                        <Line
                            key={vKey}
                            type="vertical"
                            isDrawn={isDrawn}
                            onClick={() => onMove('vertical', r, c)}
                        />
                    );

                    // Box to the right of Vertical Line (if not last column)
                    if (c < width - 1) {
                        const box = boxes[r][c];
                        cells.push(
                            <Box
                                key={`box-${r}-${c}`}
                                owner={box.owner}
                                playerColors={playerColors}
                            />
                        );
                    }
                }
            }
        }
        return cells;
    };

    return (
        <div className="inline-block p-4 bg-white rounded-lg shadow-lg">
            <div style={gridStyle} className="gap-0">
                {renderCells()}
            </div>
        </div>
    );
};
