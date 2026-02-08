import { BoardState } from './index';

export interface BoxCoord {
    row: number;
    col: number;
}

export const getBoxEdges = (row: number, col: number): string[] => {
    return [
        `h-${row}-${col}`,     // top
        `h-${row + 1}-${col}`, // bottom
        `v-${row}-${col}`,     // left
        `v-${row}-${col + 1}`  // right
    ];
};

export const countBoxEdges = (board: BoardState, row: number, col: number): number => {
    let count = 0;
    const edges = new Set(board.edges);
    const possibleEdges = getBoxEdges(row, col);

    for (const edge of possibleEdges) {
        if (edges.has(edge)) {
            count++;
        }
    }
    return count;
};

// Returns the edge key of the first missing edge for a box, or null if full
export const getOpenEdge = (board: BoardState, row: number, col: number): string | null => {
    const edges = new Set(board.edges);
    const possibleEdges = getBoxEdges(row, col);

    for (const edge of possibleEdges) {
        if (!edges.has(edge)) {
            return edge;
        }
    }
    return null;
};

// Basic implementation to find 3-sided boxes (sacrifices)
export const findSacrifices = (board: BoardState): BoxCoord[] => {
    const sacrifices: BoxCoord[] = [];
    for (let r = 0; r < board.height - 1; r++) {
        for (let c = 0; c < board.width - 1; c++) {
            if (countBoxEdges(board, r, c) === 3 && !board.boxes[r][c].completed) {
                sacrifices.push({ row: r, col: c });
            }
        }
    }
    return sacrifices;
}

export interface ChainData {
    boxes: BoxCoord[];
    type: 'chain' | 'loop';
}

export const getChainsAndLoops = (board: BoardState): ChainData[] => {
    const chains: ChainData[] = [];
    const twoEdgeBoxes: BoxCoord[] = [];
    const twoEdgeSet = new Set<string>();

    // 1. Identify all boxes with exactly 2 edges
    for (let r = 0; r < board.height - 1; r++) {
        for (let c = 0; c < board.width - 1; c++) {
            if (countBoxEdges(board, r, c) === 2 && !board.boxes[r][c].completed) {
                twoEdgeBoxes.push({ row: r, col: c });
                twoEdgeSet.add(`${r}-${c}`);
            }
        }
    }

    const visited = new Set<string>();

    for (const startBox of twoEdgeBoxes) {
        const startKey = `${startBox.row}-${startBox.col}`;
        if (visited.has(startKey)) continue;

        const component: BoxCoord[] = [];
        const queue: BoxCoord[] = [startBox];
        visited.add(startKey);

        let head = 0;
        while (head < queue.length) {
            const current = queue[head++];
            component.push(current);

            const potentialNeighbors: { r: number, c: number, edge: string }[] = [];
            // Up
            if (current.row > 0) potentialNeighbors.push({ r: current.row - 1, c: current.col, edge: `h-${current.row}-${current.col}` });
            // Down
            if (current.row < board.height - 2) potentialNeighbors.push({ r: current.row + 1, c: current.col, edge: `h-${current.row + 1}-${current.col}` });
            // Left
            if (current.col > 0) potentialNeighbors.push({ r: current.row, c: current.col - 1, edge: `v-${current.row}-${current.col}` });
            // Right
            if (current.col < board.width - 2) potentialNeighbors.push({ r: current.row, c: current.col + 1, edge: `v-${current.row}-${current.col + 1}` });

            for (const n of potentialNeighbors) {
                const nKey = `${n.r}-${n.c}`;
                if (!board.edges.includes(n.edge)) {
                    if (twoEdgeSet.has(nKey)) {
                        if (!visited.has(nKey)) {
                            visited.add(nKey);
                            queue.push({ row: n.r, col: n.c });
                        }
                    }
                }
            }
        }

        // Classify Component
        let endpoints = 0;
        for (const b of component) {
            let degree = 0;
            const neighbors = [
                { r: b.row - 1, c: b.col, edge: `h-${b.row}-${b.col}` }, // Up
                { r: b.row + 1, c: b.col, edge: `h-${b.row + 1}-${b.col}` }, // Down
                { r: b.row, c: b.col - 1, edge: `v-${b.row}-${b.col}` }, // Left
                { r: b.row, c: b.col + 1, edge: `v-${b.row}-${b.col + 1}` } // Right
            ];

            for (const n of neighbors) {
                if (n.r >= 0 && n.r < board.height - 1 && n.c >= 0 && n.c < board.width - 1) {
                    if (!board.edges.includes(n.edge) && twoEdgeSet.has(`${n.r}-${n.c}`)) {
                        degree++;
                    }
                }
            }
            if (degree <= 1) endpoints++;
        }

        chains.push({
            boxes: component,
            type: endpoints === 0 ? 'loop' : 'chain'
        });
    }

    return chains;
};

// === Move Classification ===

export interface MoveAnalysis {
    move: { type: 'vertical' | 'horizontal', row: number, col: number };
    givesAwayBox: boolean; // if true, move creates a 3-edge box (bad)
    completesBox: boolean; // if true, move completes a box (good)
}

export const getAllValidMoves = (board: BoardState): { type: 'vertical' | 'horizontal', row: number, col: number }[] => {
    const moves: { type: 'vertical' | 'horizontal', row: number, col: number }[] = [];
    const edges = new Set(board.edges);

    // Horizontal: r 0..height-1, c 0..width-2
    for (let r = 0; r < board.height; r++) {
        for (let c = 0; c < board.width - 1; c++) {
            if (!edges.has(`h-${r}-${c}`)) {
                moves.push({ type: 'horizontal', row: r, col: c });
            }
        }
    }

    // Vertical: r 0..height-2, c 0..width-1
    for (let r = 0; r < board.height - 1; r++) {
        for (let c = 0; c < board.width; c++) {
            if (!edges.has(`v-${r}-${c}`)) {
                moves.push({ type: 'vertical', row: r, col: c });
            }
        }
    }

    return moves;
}

export const analyzeMove = (board: BoardState, move: { type: 'vertical' | 'horizontal', row: number, col: number }): MoveAnalysis => {
    let completes = false;
    let givesAway = false;

    // Simulate edge addition just for checking 3 vs 4 edges
    // We check adjacent boxes to the edge
    const affectedBoxes: { r: number, c: number }[] = [];
    if (move.type === 'horizontal') {
        if (move.row > 0) affectedBoxes.push({ r: move.row - 1, c: move.col });
        if (move.row < board.height - 1) affectedBoxes.push({ r: move.row, c: move.col });
    } else {
        if (move.col > 0) affectedBoxes.push({ r: move.row, c: move.col - 1 });
        if (move.col < board.width - 1) affectedBoxes.push({ r: move.row, c: move.col });
    }

    // Create temporary edges set including the new move
    const key = move.type === 'vertical' ? `v-${move.row}-${move.col}` : `h-${move.row}-${move.col}`;
    const edges = new Set(board.edges);
    edges.add(key);

    for (const b of affectedBoxes) {
        // Count edges for box b with the NEW edge
        let count = 0;
        const possible = getBoxEdges(b.r, b.c);
        for (const e of possible) {
            if (edges.has(e)) count++;
        }

        if (count === 4) completes = true;
        if (count === 3) givesAway = true;
    }

    return {
        move,
        completesBox: completes,
        givesAwayBox: givesAway
    };
};

export const classifyMoves = (board: BoardState) => {
    const validMoves = getAllValidMoves(board);
    const safeMoves: typeof validMoves = [];
    const sacrificeMoves: typeof validMoves = [];
    const scoringMoves: typeof validMoves = [];

    for (const m of validMoves) {
        const analysis = analyzeMove(board, m);
        if (analysis.completesBox) {
            scoringMoves.push(m);
        } else if (analysis.givesAwayBox) {
            sacrificeMoves.push(m);
        } else {
            safeMoves.push(m);
        }
    }

    return { validMoves, safeMoves, sacrificeMoves, scoringMoves };
};
