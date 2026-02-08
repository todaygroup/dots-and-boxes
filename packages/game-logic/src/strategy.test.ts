import { createBoard, makeMove, BoardState, Move } from './index';
import { countBoxEdges, findSacrifices, getOpenEdge, getChainsAndLoops, classifyMoves } from './strategy';

describe('Strategy Engine', () => {
    let board: BoardState;

    beforeEach(() => {
        board = createBoard(3, 3); // 2x2 boxes
    });

    test('countBoxEdges returns correct count', () => {
        expect(countBoxEdges(board, 0, 0)).toBe(0);
        board = makeMove(board, { type: 'horizontal', row: 0, col: 0 }).newState;
        expect(countBoxEdges(board, 0, 0)).toBe(1);
    });

    test('findSacrifices identifies 3-edged boxes', () => {
        board = makeMove(board, { type: 'horizontal', row: 0, col: 0 }).newState;
        board = makeMove(board, { type: 'vertical', row: 0, col: 0 }).newState;
        board = makeMove(board, { type: 'vertical', row: 0, col: 1 }).newState;
        expect(findSacrifices(board)).toHaveLength(1);
    });

    test('getChainsAndLoops identifies a simple chain', () => {
        board = makeMove(board, { type: 'horizontal', row: 0, col: 0 }).newState;
        board = makeMove(board, { type: 'horizontal', row: 1, col: 0 }).newState;
        board = makeMove(board, { type: 'horizontal', row: 0, col: 1 }).newState;
        board = makeMove(board, { type: 'horizontal', row: 1, col: 1 }).newState;

        const analysis = getChainsAndLoops(board);
        expect(analysis).toHaveLength(1);
        expect(analysis[0].type).toBe('chain');
        expect(analysis[0].boxes).toHaveLength(2);
    });

    test('getChainsAndLoops identifies a loop', () => {
        board = makeMove(board, { type: 'horizontal', row: 0, col: 0 }).newState;
        board = makeMove(board, { type: 'horizontal', row: 0, col: 1 }).newState;
        board = makeMove(board, { type: 'horizontal', row: 2, col: 0 }).newState;
        board = makeMove(board, { type: 'horizontal', row: 2, col: 1 }).newState;
        board = makeMove(board, { type: 'vertical', row: 0, col: 0 }).newState;
        board = makeMove(board, { type: 'vertical', row: 1, col: 0 }).newState;
        board = makeMove(board, { type: 'vertical', row: 0, col: 2 }).newState;
        board = makeMove(board, { type: 'vertical', row: 1, col: 2 }).newState;

        const analysis = getChainsAndLoops(board);
        expect(analysis).toHaveLength(1);
        expect(analysis[0].type).toBe('loop');
        expect(analysis[0].boxes).toHaveLength(4);
    });

    test('classifyMoves identifies safe, sacrifice, and scoring moves', () => {
        // Empty board: all moves safe (mostly, except ones creating 3-edge boxes from 2-edge)
        // Actually on empty board, all moves create 1-edge boxes. Safe.
        let classification = classifyMoves(board);
        expect(classification.validMoves.length).toBeGreaterThan(0);
        expect(classification.safeMoves.length).toBe(classification.validMoves.length);
        expect(classification.sacrificeMoves).toHaveLength(0);
        expect(classification.scoringMoves).toHaveLength(0);

        // Setup a 3-edge box (sacrifice available)
        // Box 0,0 needs bottom edge (h-1-0) to complete
        board = makeMove(board, { type: 'horizontal', row: 0, col: 0 }).newState;
        board = makeMove(board, { type: 'vertical', row: 0, col: 0 }).newState;
        board = makeMove(board, { type: 'vertical', row: 0, col: 1 }).newState;

        classification = classifyMoves(board);

        // h-1-0 is a scoring move
        const scoring = classification.scoringMoves.find(m => m.type === 'horizontal' && m.row === 1 && m.col === 0);
        expect(scoring).toBeDefined();

        // Any move that touches this box but doesn't complete it? 
        // No, current state is 3 edges. Any edge adding to it completes it.
        // Wait, box has edges T, L, R. Bottom is missing.
        // Adding bottom completes it.
        // Are there other moves?
        // Rules say: "Sacrifice" is a move that *creates* a 3-edge box.
        // If a box IS ALREADY 3-edge, completing it is SCORING.
        // Creating a 3-edge box happens when a box has 2 edges and you add one.

        // Let's create a 2-edge box situation.
        // Box 1,1 has Top (h-1-1) and Bottom (h-2-1).
        board = makeMove(board, { type: 'horizontal', row: 1, col: 1 }).newState;
        board = makeMove(board, { type: 'horizontal', row: 2, col: 1 }).newState;

        // Adding Left (v-1-1) or Right (v-1-2) would make it 3-edge (Sacrifice).
        classification = classifyMoves(board);

        const sacrifice = classification.sacrificeMoves.find(m => m.type === 'vertical' && m.row === 1 && m.col === 1);
        expect(sacrifice).toBeDefined(); // Left of 1,1

        const sacrifice2 = classification.sacrificeMoves.find(m => m.type === 'vertical' && m.row === 1 && m.col === 2);
        expect(sacrifice2).toBeDefined(); // Right of 1,1
    });
});
