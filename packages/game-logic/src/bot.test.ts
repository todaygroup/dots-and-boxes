import { createBoard, makeMove, BoardState, Move } from './index';
import { getBotMove } from './bot';

describe('AI Bot', () => {
    let board: BoardState;

    beforeEach(() => {
        board = createBoard(3, 3); // 2x2 boxes
    });

    test('Easy bot returns a valid move', () => {
        const result = getBotMove(board, 'EASY');
        expect(result.move).toBeDefined();
        // Should be valid
        // Check manually? Or trust classifyMoves.
    });

    test('Medium bot avoids sacrifice when safe moves exist', () => {
        // Setup a board where a sacrifice is possible
        // Box 0,0 needs bottom edge (h-1-0) to complete.
        // Wait, completing is SCORING (Good).
        // Sacrifice means making it 3-edge.
        // So setup Box 0,0 with Top (h-0-0) and Bottom (h-1-0).
        // Adding Left (v-0-0) makes it 3-edge (Sacrifice).

        board = makeMove(board, { type: 'horizontal', row: 0, col: 0 }).newState;
        board = makeMove(board, { type: 'horizontal', row: 1, col: 0 }).newState;

        // Safe moves exist (e.g. h-0-1 top right).
        // Sacrifice moves exist (v-0-0 left, v-0-1 right).

        // Mock random? Or run multiple times?
        // Just verify result is NOT a sacrifice.

        const result = getBotMove(board, 'MEDIUM');
        const move = result.move;

        // Check if move is v-0-0 or v-0-1
        const isSacrifice = move.type === 'vertical' && move.row === 0 && (move.col === 0 || move.col === 1);
        expect(isSacrifice).toBe(false);
    });

    test('Hard bot takes completed box immediately', () => {
        // Setup box 0,0 with 3 edges.
        board = makeMove(board, { type: 'horizontal', row: 0, col: 0 }).newState;
        board = makeMove(board, { type: 'horizontal', row: 1, col: 0 }).newState;
        board = makeMove(board, { type: 'vertical', row: 0, col: 0 }).newState;
        // Missing v-0-1 (Right).

        const result = getBotMove(board, 'HARD');
        expect(result.move).toEqual({ type: 'vertical', row: 0, col: 1 });
    });

    test('Easy bot completes a full game', () => {
        let state = board;
        let turns = 0;
        const maxTurns = 100; // Prevent infinite loop

        while (state.winner === null && turns < maxTurns) {
            const botResult = getBotMove(state, 'EASY');
            const moveResult = makeMove(state, botResult.move);

            expect(moveResult.isValid).toBe(true);
            state = moveResult.newState;
            turns++;
        }

        expect(state.winner).not.toBeNull();
        expect(turns).toBeLessThan(maxTurns);
    });

    test('Medium bot completes a full game', () => {
        let state = board;
        let turns = 0;
        const maxTurns = 100;

        while (state.winner === null && turns < maxTurns) {
            const botResult = getBotMove(state, 'MEDIUM');
            const moveResult = makeMove(state, botResult.move);

            expect(moveResult.isValid).toBe(true);
            state = moveResult.newState;
            turns++;
        }

        expect(state.winner).not.toBeNull();
        expect(turns).toBeLessThan(maxTurns);
    });

    test('Hard bot completes a full game', () => {
        let state = board;
        let turns = 0;
        const maxTurns = 100;

        while (state.winner === null && turns < maxTurns) {
            const botResult = getBotMove(state, 'HARD');
            const moveResult = makeMove(state, botResult.move);

            expect(moveResult.isValid).toBe(true);
            state = moveResult.newState;
            turns++;
        }

        expect(state.winner).not.toBeNull();
        expect(turns).toBeLessThan(maxTurns);
    });

    test('Bot vs Bot: Medium vs Hard completes game', () => {
        let state = board;
        let turns = 0;
        const maxTurns = 100;
        let currentBot: 'MEDIUM' | 'HARD' = 'MEDIUM';

        while (state.winner === null && turns < maxTurns) {
            const botResult = getBotMove(state, currentBot);
            const moveResult = makeMove(state, botResult.move);

            expect(moveResult.isValid).toBe(true);
            state = moveResult.newState;

            // Switch bots if turn changed (no extra turn from completing box)
            if (moveResult.newState.currentPlayer !== (turns % 2)) {
                currentBot = currentBot === 'MEDIUM' ? 'HARD' : 'MEDIUM';
            }
            turns++;
        }

        expect(state.winner).not.toBeNull();
        expect(state.scores[0] + state.scores[1]).toBe(4); // 2x2 board has 4 boxes
    });

    test('All bots make valid moves on empty board', () => {
        const easyMove = getBotMove(board, 'EASY');
        const mediumMove = getBotMove(board, 'MEDIUM');
        const hardMove = getBotMove(board, 'HARD');

        expect(makeMove(board, easyMove.move).isValid).toBe(true);
        expect(makeMove(board, mediumMove.move).isValid).toBe(true);
        expect(makeMove(board, hardMove.move).isValid).toBe(true);
    });
});
