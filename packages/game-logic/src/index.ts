export const name = "game-logic";

export type PlayerId = 0 | 1;

export interface BoxState {
    completed: boolean;
    owner: PlayerId | null;
}

export interface GameRules {
    noExtraTurn: boolean; // if true, completing a box does not grant an extra turn
    // diagonalMode?: boolean; // future extension
}

export interface BoardState {
    width: number;  // number of dots in width
    height: number; // number of dots in height
    edges: string[]; // array of edge keys "v-row-col" or "h-row-col"
    boxes: BoxState[][]; // [row][col]
    scores: [number, number]; // [player0, player1]
    currentPlayer: PlayerId;
    winner: PlayerId | null;
    rules: GameRules;
}

export interface Move {
    type: 'vertical' | 'horizontal';
    row: number;
    col: number;
}

export const createBoard = (width: number, height: number, rules: GameRules = { noExtraTurn: false }): BoardState => {
    const boxes: BoxState[][] = [];
    for (let r = 0; r < height - 1; r++) {
        const row: BoxState[] = [];
        for (let c = 0; c < width - 1; c++) {
            row.push({ completed: false, owner: null });
        }
        boxes.push(row);
    }

    return {
        width,
        height,
        edges: [],
        boxes,
        scores: [0, 0],
        currentPlayer: 0,
        winner: null,
        rules,
    };
};

export const getEdgeKey = (move: Move): string => {
    const prefix = move.type === 'vertical' ? 'v' : 'h';
    return `${prefix}-${move.row}-${move.col}`;
};

export const isValidMove = (board: BoardState, move: Move): boolean => {
    // Check bounds
    if (move.type === 'vertical') {
        // Vertical edge: row from 0 to height-2, col from 0 to width-1
        if (move.row < 0 || move.row >= board.height - 1) return false;
        if (move.col < 0 || move.col >= board.width) return false;
    } else {
        // Horizontal edge: row from 0 to height-1, col from 0 to width-2
        if (move.row < 0 || move.row >= board.height) return false;
        if (move.col < 0 || move.col >= board.width - 1) return false;
    }

    // Check if edge already exists
    const key = getEdgeKey(move);
    if (board.edges.includes(key)) return false;

    return true;
};

export interface MoveResult {
    newState: BoardState;
    completedBoxes: { row: number, col: number }[];
    isValid: boolean;
}

export const makeMove = (board: BoardState, move: Move): MoveResult => {
    // Deep copy state to avoid mutation issues
    const newState: BoardState = JSON.parse(JSON.stringify(board));

    if (!isValidMove(newState, move)) {
        return { newState: board, completedBoxes: [], isValid: false };
    }

    const key = getEdgeKey(move);
    newState.edges.push(key);

    const completedBoxes: { row: number, col: number }[] = [];
    const boxes = newState.boxes;
    const edges = new Set(newState.edges);

    // Helper to check if a box is complete
    const isBoxComplete = (r: number, c: number): boolean => {
        const top = `h-${r}-${c}`;
        const bottom = `h-${r + 1}-${c}`;
        const left = `v-${r}-${c}`;
        const right = `v-${r}-${c + 1}`;
        return edges.has(top) && edges.has(bottom) && edges.has(left) && edges.has(right);
    };

    // Check affected boxes
    if (move.type === 'horizontal') {
        // Edge is Top of box(row, col) AND Bottom of box(row-1, col)
        // Box below edge
        if (move.row < newState.height - 1) {
            if (!boxes[move.row][move.col].completed && isBoxComplete(move.row, move.col)) {
                boxes[move.row][move.col].completed = true;
                boxes[move.row][move.col].owner = newState.currentPlayer;
                completedBoxes.push({ row: move.row, col: move.col });
            }
        }
        // Box above edge
        if (move.row > 0) {
            if (!boxes[move.row - 1][move.col].completed && isBoxComplete(move.row - 1, move.col)) {
                boxes[move.row - 1][move.col].completed = true;
                boxes[move.row - 1][move.col].owner = newState.currentPlayer;
                completedBoxes.push({ row: move.row - 1, col: move.col });
            }
        }
    } else {
        // Vertical edge
        // Edge is Left of box(row, col) AND Right of box(row, col-1)
        // Box to right of edge
        if (move.col < newState.width - 1) {
            if (!boxes[move.row][move.col].completed && isBoxComplete(move.row, move.col)) {
                boxes[move.row][move.col].completed = true;
                boxes[move.row][move.col].owner = newState.currentPlayer;
                completedBoxes.push({ row: move.row, col: move.col });
            }
        }
        // Box to left of edge
        if (move.col > 0) {
            if (!boxes[move.row][move.col - 1].completed && isBoxComplete(move.row, move.col - 1)) {
                boxes[move.row][move.col - 1].completed = true;
                boxes[move.row][move.col - 1].owner = newState.currentPlayer;
                completedBoxes.push({ row: move.row, col: move.col - 1 });
            }
        }
    }

    // Update Score
    if (completedBoxes.length > 0) {
        newState.scores[newState.currentPlayer] += completedBoxes.length;
        // Current player keeps turn UNLESS noExtraTurn rule is active
        if (newState.rules.noExtraTurn) {
            newState.currentPlayer = newState.currentPlayer === 0 ? 1 : 0;
        }
    } else {
        // Switch turn
        newState.currentPlayer = newState.currentPlayer === 0 ? 1 : 0;
    }

    // Check Game Over
    const totalBoxes = (newState.width - 1) * (newState.height - 1);
    if (newState.scores[0] + newState.scores[1] === totalBoxes) {
        if (newState.scores[0] > newState.scores[1]) newState.winner = 0;
        else if (newState.scores[1] > newState.scores[0]) newState.winner = 1;
        // Draw logic can be handled by winner being null but scores summing to total
    }

    return { newState, completedBoxes, isValid: true };
};

export * from './strategy';
export * from './bot';
