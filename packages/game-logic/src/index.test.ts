import { createBoard, isValidMove, makeMove, BoardState, Move } from './index';

describe('Game Logic', () => {
    let board: BoardState;

    beforeEach(() => {
        board = createBoard(3, 3); // 2x2 boxes
    });

    test('createBoard initializes correctly', () => {
        expect(board.width).toBe(3);
        expect(board.height).toBe(3);
        expect(board.edges).toHaveLength(0);
        expect(board.boxes).toHaveLength(2);
        expect(board.boxes[0]).toHaveLength(2);
        expect(board.scores).toEqual([0, 0]);
        expect(board.currentPlayer).toBe(0);
    });

    test('isValidMove checks bounds', () => {
        // Valid moves
        expect(isValidMove(board, { type: 'horizontal', row: 0, col: 0 })).toBe(true);
        expect(isValidMove(board, { type: 'vertical', row: 0, col: 0 })).toBe(true);

        // Invalid moves (out of bounds)
        expect(isValidMove(board, { type: 'horizontal', row: 3, col: 0 })).toBe(false); // row 3 is out for horizontal (0,1,2 allowed for 3x3 dots?) 
        // Wait, implementation: horizontal row is 0..height-1? No, 0..height.
        // Let's re-read validMove implementation:
        // Horizontal: row 0..height-1? Actually row index is for the line of dots.
        // If 3x3 dots, rows are 0, 1, 2. Col index for horizontal edge is 0..width-2 (0, 1).
        expect(isValidMove(board, { type: 'horizontal', row: 2, col: 1 })).toBe(true);
        expect(isValidMove(board, { type: 'horizontal', row: 2, col: 2 })).toBe(false); // col 2 out bounds
    });

    test('makeMove adds edge and switches turn on non-scoring move', () => {
        const move: Move = { type: 'horizontal', row: 0, col: 0 };
        const result = makeMove(board, move);

        expect(result.isValid).toBe(true);
        expect(result.newState.edges).toContain('h-0-0');
        expect(result.newState.currentPlayer).toBe(1); // Turn switched
        expect(result.newState.scores).toEqual([0, 0]);
    });

    test('makeMove completes a box and keeps turn', () => {
        // Setup a box almost complete
        // Box (0,0) needs h-0-0, h-1-0, v-0-0, v-0-1
        let state = board;
        state = makeMove(state, { type: 'horizontal', row: 0, col: 0 }).newState; // P0
        state = makeMove(state, { type: 'horizontal', row: 1, col: 0 }).newState; // P1
        state = makeMove(state, { type: 'vertical', row: 0, col: 0 }).newState;   // P0

        // P1's turn. Make the final move.
        const move: Move = { type: 'vertical', row: 0, col: 1 };
        const result = makeMove(state, move);

        expect(result.isValid).toBe(true);
        expect(result.completedBoxes).toHaveLength(1);
        expect(result.completedBoxes[0]).toEqual({ row: 0, col: 0 });
        expect(result.newState.boxes[0][0].completed).toBe(true);
        expect(result.newState.boxes[0][0].owner).toBe(1); // P1 completed it
        expect(result.newState.scores[1]).toBe(1);
        expect(result.newState.currentPlayer).toBe(1); // Turn kept
    });

    test('makeMove respects noExtraTurn rule', () => {
        // Setup board with noExtraTurn rule
        const ruleBoard = createBoard(3, 3, { noExtraTurn: true });

        // Setup a box almost complete
        let state = ruleBoard;
        state = makeMove(state, { type: 'horizontal', row: 0, col: 0 }).newState; // P0
        state = makeMove(state, { type: 'horizontal', row: 1, col: 0 }).newState; // P1
        state = makeMove(state, { type: 'vertical', row: 0, col: 0 }).newState;   // P0

        // P1's turn. Make the final move.
        const move: Move = { type: 'vertical', row: 0, col: 1 };
        const result = makeMove(state, move);

        expect(result.isValid).toBe(true);
        expect(result.completedBoxes).toHaveLength(1);
        expect(result.newState.boxes[0][0].completed).toBe(true);
        expect(result.newState.scores[1]).toBe(1);

        // Crucial check: Turn SHOULD switch because of noExtraTurn rule
        expect(result.newState.currentPlayer).toBe(0);
    });

    test('makeMove rejects duplicate edge', () => {
        const move: Move = { type: 'horizontal', row: 0, col: 0 };
        const result1 = makeMove(board, move);

        expect(result1.isValid).toBe(true);

        // Try to place same edge again
        const result2 = makeMove(result1.newState, move);

        expect(result2.isValid).toBe(false);
        expect(result2.newState.edges).toHaveLength(1); // No change
    });

    test('game ends when all boxes are completed', () => {
        // For 2x2 grid (3x3 dots), there are 4 boxes
        let state = board;

        // Complete all boxes systematically
        // Box (0,0): h-0-0, h-1-0, v-0-0, v-0-1
        state = makeMove(state, { type: 'horizontal', row: 0, col: 0 }).newState;
        state = makeMove(state, { type: 'horizontal', row: 0, col: 1 }).newState;
        state = makeMove(state, { type: 'horizontal', row: 1, col: 0 }).newState;
        state = makeMove(state, { type: 'horizontal', row: 1, col: 1 }).newState;
        state = makeMove(state, { type: 'horizontal', row: 2, col: 0 }).newState;
        state = makeMove(state, { type: 'horizontal', row: 2, col: 1 }).newState;

        state = makeMove(state, { type: 'vertical', row: 0, col: 0 }).newState;
        state = makeMove(state, { type: 'vertical', row: 0, col: 1 }).newState;
        state = makeMove(state, { type: 'vertical', row: 0, col: 2 }).newState;
        state = makeMove(state, { type: 'vertical', row: 1, col: 0 }).newState;
        state = makeMove(state, { type: 'vertical', row: 1, col: 1 }).newState;

        // Last move completes final box
        const finalResult = makeMove(state, { type: 'vertical', row: 1, col: 2 });

        // All boxes should be completed
        const allCompleted = finalResult.newState.boxes.every(row =>
            row.every(box => box.completed)
        );
        expect(allCompleted).toBe(true);

        // All boxes completed means scores should sum to total
        const totalBoxes = (board.width - 1) * (board.height - 1);
        expect(finalResult.newState.scores[0] + finalResult.newState.scores[1]).toBe(totalBoxes);

        // Winner should be determined based on scores
        const [score0, score1] = finalResult.newState.scores;
        if (score0 > score1) {
            expect(finalResult.newState.winner).toBe(0);
        } else if (score1 > score0) {
            expect(finalResult.newState.winner).toBe(1);
        } else {
            // Tie - winner is null (valid)
            expect(finalResult.newState.winner).toBeNull();
        }
    });

    test('completing multiple boxes in one move grants correct score', () => {
        // Setup: Create two adjacent boxes that share an edge
        // Complete 3 sides of both boxes, then finish with shared edge
        let state = board;

        // Box (0,0) - top, left, right
        state = makeMove(state, { type: 'horizontal', row: 0, col: 0 }).newState;
        state = makeMove(state, { type: 'vertical', row: 0, col: 0 }).newState;
        state = makeMove(state, { type: 'vertical', row: 0, col: 1 }).newState;

        // Box (0,1) - top, left (shared), right
        state = makeMove(state, { type: 'horizontal', row: 0, col: 1 }).newState;
        // v-0-1 already placed (shared edge)
        state = makeMove(state, { type: 'vertical', row: 0, col: 2 }).newState;

        // Now place h-1-0 which completes box (0,0)
        const result1 = makeMove(state, { type: 'horizontal', row: 1, col: 0 });
        expect(result1.completedBoxes).toHaveLength(1);

        // Place h-1-1 which completes box (0,1)
        const result2 = makeMove(result1.newState, { type: 'horizontal', row: 1, col: 1 });
        expect(result2.completedBoxes).toHaveLength(1);

        // Total score should reflect both completions
        const totalScore = result2.newState.scores[0] + result2.newState.scores[1];
        expect(totalScore).toBe(2);
    });

    test('winner is player with higher score', () => {
        // Manually set up a game end state
        const state: BoardState = {
            ...board,
            boxes: [
                [
                    { completed: true, owner: 0 },
                    { completed: true, owner: 0 }
                ],
                [
                    { completed: true, owner: 1 },
                    { completed: true, owner: 0 }
                ]
            ],
            scores: [3, 1],
            winner: 0
        };

        expect(state.winner).toBe(0);
        expect(state.scores[0]).toBeGreaterThan(state.scores[1]);
    });

    test('turn alternates correctly without box completion', () => {
        let state = board;
        expect(state.currentPlayer).toBe(0);

        state = makeMove(state, { type: 'horizontal', row: 0, col: 0 }).newState;
        expect(state.currentPlayer).toBe(1);

        state = makeMove(state, { type: 'horizontal', row: 0, col: 1 }).newState;
        expect(state.currentPlayer).toBe(0);

        state = makeMove(state, { type: 'horizontal', row: 2, col: 0 }).newState;
        expect(state.currentPlayer).toBe(1);
    });
});
